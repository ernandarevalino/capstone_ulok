import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface ProgressEmailPayload {
  namaLokasi: string
  namaCabang: string
  jenisBadanHukum: string
  persentase: number
  recipientEmails: string[]
}

interface StatusEmailPayload {
  namaLokasi: string
  namaCabang: string
  jenisBadanHukum: string
  status: string
  reviewTimestamp: string
  reviewNotes?: string
  recipientEmail: string
}

export async function sendProgressNotificationToAssessors(payload: ProgressEmailPayload) {
  const { namaLokasi, namaCabang, jenisBadanHukum, persentase, recipientEmails } = payload
  const finalRecipients = process.env.TEST_RECEIVER_EMAIL
    ? [process.env.TEST_RECEIVER_EMAIL]
    : recipientEmails
  if (finalRecipients.length === 0) return { success: true, message: 'No recipients provided' }

  const subject = `[PRISMA ULOK] Siap Ditinjau: ${namaLokasi} (${persentase}%)`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f8fafc; color: #1e293b;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0; margin-top: 20px; margin-bottom: 20px;">
          <!-- Header -->
          <div style="background-color: #0f172a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">PRISMA</h1>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 12px; font-weight: 500;">Prioritizing Location (PT Midi Utama Indonesia Tbk)</p>
          </div>
          <!-- Body -->
          <div style="padding: 32px 24px;">
            <h2 style="margin-top: 0; margin-bottom: 8px; font-size: 18px; font-weight: 700; color: #0f172a;">Usulan Lokasi Siap Ditinjau</h2>
            <p style="font-size: 14px; line-height: 24px; color: #475569; margin-bottom: 24px;">
              Usulan lokasi ini telah memenuhi batas kelengkapan dokumen (>= 50%) dan siap untuk diverifikasi.
            </p>
            
            <!-- Card -->
            <div style="background-color: #f1f5f9; border-radius: 6px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #64748b; width: 35%;">Nama Lokasi</td>
                  <td style="padding: 4px 0; font-size: 14px; font-weight: 700; color: #0f172a;">${namaLokasi}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #64748b;">Asal Cabang</td>
                  <td style="padding: 4px 0; font-size: 14px; font-weight: 500; color: #334155;">${namaCabang}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #64748b;">Jenis Badan Hukum</td>
                  <td style="padding: 4px 0; font-size: 14px; font-weight: 500; color: #334155;">${jenisBadanHukum}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0 4px 0; font-size: 13px; font-weight: 600; color: #64748b;" colspan="2">Progress Dokumen</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;" colspan="2">
                    <div style="background-color: #cbd5e1; border-radius: 9999px; height: 12px; width: 100%; overflow: hidden;">
                      <div style="background-color: #0284c7; border-radius: 9999px; height: 12px; width: ${persentase}%;"></div>
                    </div>
                    <div style="font-size: 13px; font-weight: 700; color: #0284c7; margin-top: 6px;">${persentase}% Terisi</div>
                  </td>
                </tr>
              </table>
            </div>

            <!-- CTA -->
            <div style="text-align: center; margin-top: 32px; margin-bottom: 16px;">
              <a href="https://capstone-ulok.vercel.app/admin/assessor/pengelompokan" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                Verifikasi Sekarang
              </a>
            </div>
          </div>
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
            Email ini dikirim secara otomatis oleh Sistem PRISMA. Harap tidak membalas email ini.
          </div>
        </div>
      </body>
    </html>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: 'PRISMA System <onboarding@resend.dev>',
      to: finalRecipients,
      subject: subject,
      html: html,
    })

    if (error) {
      console.error('Error sending progress email to Resend:', error)
      return { success: false, error }
    }
    return { success: true, data }
  } catch (err: any) {
    console.error('Error sending progress email:', err)
    return { success: false, error: err }
  }
}

export async function sendStatusChangeNotificationToAdmin(payload: StatusEmailPayload) {
  const { namaLokasi, namaCabang, jenisBadanHukum, status, reviewTimestamp, reviewNotes, recipientEmail } = payload
  const finalRecipients = process.env.TEST_RECEIVER_EMAIL
    ? [process.env.TEST_RECEIVER_EMAIL]
    : recipientEmail

  const subject = `[PRISMA ULOK] Perubahan Status: ${namaLokasi} - [${status}]`

  const isApproved = status.toLowerCase() === 'approved'
  const badgeBg = isApproved ? '#16a34a' : '#d97706'
  const badgeText = '#ffffff'

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f8fafc; color: #1e293b;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0; margin-top: 20px; margin-bottom: 20px;">
          <!-- Header -->
          <div style="background-color: #0f172a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">PRISMA</h1>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 12px; font-weight: 500;">Prioritizing Location (PT Midi Utama Indonesia Tbk)</p>
          </div>
          <!-- Body -->
          <div style="padding: 32px 24px;">
            <h2 style="margin-top: 0; margin-bottom: 8px; font-size: 18px; font-weight: 700; color: #0f172a;">Perubahan Status Usulan Lokasi</h2>
            <p style="font-size: 14px; line-height: 24px; color: #475569; margin-bottom: 24px;">
              Status usulan lokasi Anda telah diperbarui oleh Assessor.
            </p>
            
            <!-- Status Badge -->
            <div style="margin-bottom: 24px;">
              <span style="background-color: ${badgeBg}; color: ${badgeText}; padding: 6px 12px; font-size: 12px; font-weight: 700; border-radius: 9999px; text-transform: uppercase; display: inline-block;">
                ${status}
              </span>
            </div>

            <!-- Card -->
            <div style="background-color: #f1f5f9; border-radius: 6px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #64748b; width: 35%;">Nama Lokasi</td>
                  <td style="padding: 4px 0; font-size: 14px; font-weight: 700; color: #0f172a;">${namaLokasi}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #64748b;">Asal Cabang</td>
                  <td style="padding: 4px 0; font-size: 14px; font-weight: 500; color: #334155;">${namaCabang}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #64748b;">Jenis Badan Hukum</td>
                  <td style="padding: 4px 0; font-size: 14px; font-weight: 500; color: #334155;">${jenisBadanHukum}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #64748b;">Waktu Review</td>
                  <td style="padding: 4px 0; font-size: 14px; font-weight: 500; color: #334155;">${reviewTimestamp}</td>
                </tr>
                ${reviewNotes ? `
                <tr>
                  <td style="padding: 12px 0 4px 0; font-size: 13px; font-weight: 600; color: #64748b;" colspan="2">Catatan Review / Catatan Revisi</td>
                </tr>
                <tr>
                  <td style="padding: 10px; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px; line-height: 20px; color: #334155;" colspan="2">
                    ${reviewNotes.replace(/\n/g, '<br>')}
                  </td>
                </tr>
                ` : ''}
              </table>
            </div>

            <!-- CTA -->
            <div style="text-align: center; margin-top: 32px; margin-bottom: 16px;">
              <a href="https://capstone-ulok.vercel.app/admin/cabang/usulan-lokasi" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                Lihat Usulan Lokasi
              </a>
            </div>
          </div>
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
            Email ini dikirim secara otomatis oleh Sistem PRISMA. Harap tidak membalas email ini.
          </div>
        </div>
      </body>
    </html>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: 'PRISMA System <onboarding@resend.dev>',
      to: finalRecipients,
      subject: subject,
      html: html,
    })

    if (error) {
      console.error('Error sending status change email to Resend:', error)
      return { success: false, error }
    }
    return { success: true, data }
  } catch (err: any) {
    console.error('Error sending status change email:', err)
    return { success: false, error: err }
  }
}
