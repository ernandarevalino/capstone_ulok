import nodemailer from "nodemailer";
import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Core Nodemailer Email Dispatcher with Quota Optimization
 */
export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  // 1. SAFEGUARD: Check if Email is disabled in .env
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log(
      `[Mock Email] Sistem email dimatikan via .env. Pura-pura mengirim ke: ${to}`,
    );
    console.log(`[Mock Email] Subject: ${subject}`);
    return {
      success: true,
      data: { message: "Sistem email dimatikan sementara" },
    };
  }

  // 2. Validate Email Format & Existence
  if (!to || typeof to !== "string" || !to.includes("@")) {
    console.log(
      "[Gmail SMTP] Skipped: Invalid or empty recipient email address.",
    );
    return { success: false, error: "Alamat email tidak valid." };
  }

  // 3. Filter Dummy Domains (e.g. @mu.co.id)
  const isDummyDomain = to.endsWith("@mu.co.id") || to.endsWith("@bsi.ac.id");
  if (isDummyDomain && process.env.NODE_ENV !== "production") {
    console.log(
      `[Gmail SMTP - OPTIMIZED] Skipped dummy email (${to}) to preserve daily quota.`,
    );
    return {
      success: true,
      data: { message: "Dummy email skipped successfully" },
    };
  }

  // 4. Send Email
  try {
    const info = await transporter.sendMail({
      from: `"PRISMA Alfamidi" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
    });

    console.log("[Gmail SMTP] Email successfully sent:", info.messageId);
    return { success: true, data: info };
  } catch (error: any) {
    console.error("[Gmail SMTP] Failed to send email:", error);
    return { success: false, error: error.message || "Gagal mengirim email." };
  }
}

export async function sendProgressNotificationToAssessors({
  ulokId,
  namaLokasi,
  progressPercentage,
  namaCabang,
}: {
  ulokId: string;
  namaLokasi: string;
  progressPercentage: number;
  namaCabang?: string;
}) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[Email Trigger] Missing SUPABASE_SERVICE_ROLE_KEY or URL");
      return;
    }

    // 1. Create Admin Instance with Service Role Key
    const supabaseAdmin = createSupabaseAdmin(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // 2. Fetch all Assessor profiles (role = 'assessor')
    const { data: assessorProfiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .eq("role", "assessor");

    if (profileError || !assessorProfiles || assessorProfiles.length === 0) {
      console.log("[Email Trigger] No Assessor profiles found.");
      return;
    }

    // 3. Fetch Auth Users via Service Role
    const {
      data: { users },
      error: authError,
    } = await supabaseAdmin.auth.admin.listUsers();
    if (authError || !users) {
      console.error("[Email Trigger] Failed to list auth users:", authError);
      return;
    }

    // 4. Match Assessor profiles with Auth users to get actual email addresses
    const assessorUserIds = new Set(assessorProfiles.map((p) => p.id));
    const targetAssessors = users.filter(
      (u) => assessorUserIds.has(u.id) && u.email,
    );

    console.log(
      `[Email Trigger] Found ${targetAssessors.length} Assessor email(s) for >=80% progress notification.`,
    );

    // 5. Dispatch Emails to all Assessors
    for (const assessor of targetAssessors) {
      const profile = assessorProfiles.find((p) => p.id === assessor.id);
      const recipientEmail = assessor.email!;

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #3365A6; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px;">PRISMA Alfamidi</h1>
            <p style="color: #e2e8f0; margin: 4px 0 0 0; font-size: 13px;">Notifikasi Kelengkapan Berkas Usulan Lokasi</p>
          </div>
          <div style="padding: 32px; background-color: #ffffff; color: #334155;">
            <h2 style="color: #1e293b; margin-top: 0;">Berkas Siap Dievaluasi (>=80%)</h2>
            <p>Halo <strong>${profile?.full_name || "Assessor PRISMA"}</strong>,</p>
            <p>Usulan lokasi <strong>${namaLokasi}</strong>${namaCabang ? ` dari cabang <strong>${namaCabang}</strong>` : ""} telah memenuhi kelengkapan dokumen di atas atau sama dengan 80% (Progres: <strong>${progressPercentage}%</strong>).</p>
            
            <div style="text-align: center; margin: 24px 0;">
              <span style="background-color: #3365A6; color: #ffffff; padding: 10px 24px; border-radius: 20px; font-weight: bold; font-size: 14px;">
                Progres Dokumen: ${progressPercentage}%
              </span>
            </div>

            <p style="font-size: 13px; color: #64748b;">Silakan masuk ke portal PRISMA untuk meninjau dan memberikan penilaian pada usulan lokasi ini.</p>
          </div>
          <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
            &copy; ${new Date().getFullYear()} PRISMA Alfamidi. All rights reserved.
          </div>
        </div>
      `;

      await sendEmail({
        to: recipientEmail,
        subject: `[PRISMA] Berkas ${namaLokasi} Siap Dievaluasi (${progressPercentage}%)`,
        html: htmlContent,
      });
    }
  } catch (error) {
    console.error(
      "[Email Trigger] Error in sendProgressNotificationToAssessors:",
      error,
    );
  }
}

export async function sendResetPasswordEmail({
  to,
  resetLink,
  userName,
}: {
  to: string;
  resetLink: string;
  userName?: string;
}) {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #3365A6; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px;">PRISMA Alfamidi</h1>
        <p style="color: #e2e8f0; margin: 4px 0 0 0; font-size: 13px;">Sistem Pemrosesan Dokumen Usulan Lokasi</p>
      </div>
      <div style="padding: 32px; background-color: #ffffff; color: #334155;">
        <h2 style="color: #1e293b; margin-top: 0;">Permintaan Atur Ulang Kata Sandi</h2>
        <p>Halo <strong>${userName || "Pengguna PRISMA"}</strong>,</p>
        <p>Kami menerima permintaan untuk mengatur ulang kata sandi akun PRISMA Anda. Klik tombol di bawah ini untuk membuat kata sandi baru:</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}" style="background-color: #3365A6; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; display: inline-block;">Atur Ulang Kata Sandi</a>
        </div>
        
        <p style="font-size: 13px; color: #64748b;">Jika Anda tidak merasa melakukan permintaan ini, silakan abaikan email ini.</p>
      </div>
      <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        &copy; ${new Date().getFullYear()} PRISMA Alfamidi. All rights reserved.
      </div>
    </div>
  `;

  return await sendEmail({
    to,
    subject: "Atur Ulang Kata Sandi - PRISMA Alfamidi",
    html: htmlContent,
  });
}

export async function sendStatusChangeNotificationToAdmin({
  ulokId,
  namaLokasi,
  newStatus,
  reviewerNote,
}: {
  ulokId: string;
  namaLokasi: string;
  newStatus: "Approved" | "Revisi" | "Rejected" | "In Review";
  reviewerNote?: string;
}) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[Email Trigger] Missing SUPABASE_SERVICE_ROLE_KEY or URL");
      return;
    }

    // 1. Create Admin Supabase Instance with Service Role Key
    const supabaseAdmin = createSupabaseAdmin(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // 2. Fetch the ULOK submission to get admin_id
    const { data: ulokData, error: ulokError } = await supabaseAdmin
      .from("ulok_submissions")
      .select("admin_id, nama_lokasi")
      .eq("id", ulokId)
      .single();

    if (ulokError || !ulokData) {
      console.error("[Email Trigger] Failed to find ULOK submission:", ulokError);
      return;
    }

    // 3. Fetch creator profile to determine branch_id
    const { data: creatorProfile, error: creatorError } = await supabaseAdmin
      .from("profiles")
      .select("branch_id")
      .eq("id", ulokData.admin_id)
      .single();

    if (creatorError || !creatorProfile?.branch_id) {
      console.error("[Email Trigger] Creator profile or branch_id missing:", creatorError);
      return;
    }

    const branchId = creatorProfile.branch_id;

    // 4. Fetch all Admin Cabang profiles belonging to this branch_id
    const { data: adminProfiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .eq("branch_id", branchId)
      .eq("role", "admin_cabang");

    if (profileError || !adminProfiles || adminProfiles.length === 0) {
      console.log(`[Email Trigger] No Admin Cabang profiles found for branch_id: ${branchId}`);
      return;
    }

    // 5. Fetch auth users using Service Role Key
    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError || !users) {
      console.error("[Email Trigger] Failed to list auth users:", authError);
      return;
    }

    const adminUserIds = new Set(adminProfiles.map((p) => p.id));
    const targetAdmins = users.filter((u) => adminUserIds.has(u.id) && u.email);

    console.log(`[Email Trigger] Found ${targetAdmins.length} target admin email(s) for branch_id ${branchId}`);

    // 6. Dispatch emails
    for (const admin of targetAdmins) {
      const profile = adminProfiles.find((p) => p.id === admin.id);
      const recipientEmail = admin.email!;

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #3365A6; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px;">PRISMA Alfamidi</h1>
            <p style="color: #e2e8f0; margin: 4px 0 0 0; font-size: 13px;">Pembaruan Status Usulan Lokasi</p>
          </div>
          <div style="padding: 32px; background-color: #ffffff; color: #334155;">
            <h2 style="color: #1e293b; margin-top: 0;">Status Usulan Lokasi Diperbarui</h2>
            <p>Halo <strong>${profile?.full_name || "Admin Cabang"}</strong>,</p>
            <p>Status untuk usulan lokasi <strong>${namaLokasi || ulokData.nama_lokasi}</strong> telah diperbarui menjadi:</p>

            <div style="text-align: center; margin: 24px 0;">
              <span style="background-color: ${newStatus === "Approved" ? "#22c55e" : "#f59e0b"}; color: #ffffff; padding: 8px 20px; border-radius: 20px; font-weight: bold; font-size: 14px;">
                ${newStatus}
              </span>
            </div>

            ${reviewerNote ? `<div style="background-color: #f8fafc; border-left: 4px solid #3365A6; padding: 12px 16px; margin-bottom: 24px;"><p style="margin: 0; font-size: 13px; color: #475569;"><strong>Catatan Evaluator:</strong> ${reviewerNote}</p></div>` : ""}

            <p style="font-size: 13px; color: #64748b;">Silakan masuk ke portal PRISMA untuk melihat rincian pembaruan.</p>
          </div>
          <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
            &copy; ${new Date().getFullYear()} PRISMA Alfamidi. All rights reserved.
          </div>
        </div>
      `;

      await sendEmail({
        to: recipientEmail,
        subject: `[PRISMA] Status ULOK ${namaLokasi || ulokData.nama_lokasi} - ${newStatus}`,
        html: htmlContent,
      });
    }
  } catch (error) {
    console.error("[Email Trigger] Error in sendStatusChangeNotificationToAdmin:", error);
  }
}
