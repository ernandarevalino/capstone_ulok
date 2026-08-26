import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Minimal valid PDF Buffer (~140 bytes)
const dummyPdfBuffer = Buffer.from(
  `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 100 100] >> endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer << /Size 4 /Root 1 0 R >>
startxref
190
%%EOF`
);

// Minimal valid 1x1 JPG Buffer (~125 bytes)
const dummyJpgBuffer = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
  'base64'
);

const SAMPLE_LOCATIONS = [
  'Alfamidi Super Boulevard Gading Serpong',
  'Alfamidi Express Margonda Raya Depok',
  'Alfamidi BSD City Section 7',
  'Alfamidi Gajah Mada Plaza Jakarta',
  'Alfamidi Kebayoran Baru Wolter Monginsidi',
  'Alfamidi Bintaro Sektor 9 Utama',
  'Alfamidi Super Raya Pajajaran Bogor',
  'Alfamidi Bekasi Barat Ahmad Yani',
  'Alfamidi Tangcity Mall Area',
  'Alfamidi Super Cinere Raya',
  'Alfamidi Express Tebet Utara',
  'Alfamidi Karawaci Supermal',
  'Alfamidi Super Serpong Park',
  'Alfamidi Pondok Indah Arteri',
  'Alfamidi Cilandak KKO Raya',
  'Alfamidi Kelapa Gading Boulevard Utara',
  'Alfamidi Super Sawangan Depok',
  'Alfamidi Express Fatmawati Selatan',
  'Alfamidi Super Cibubur Junction Area',
  'Alfamidi Rawamangun Pemuda Raya',
  'Alfamidi Super Summarecon Bekasi',
  'Alfamidi Express Kemang Raya',
  'Alfamidi Super Alam Sutera Utama',
  'Alfamidi Duren Sawit Raya',
  'Alfamidi Super Pamulang Barat',
  'Alfamidi Express Palmerah Barat',
  'Alfamidi Super Jatiwaringin Raya',
  'Alfamidi Sunter Agung Utara'
];

const PROPRIETORS = [
  'Budi Santoso', 'Siti Rahmawati', 'Hendra Wijaya', 'Dewi Lestari',
  'Agus Setiawan', 'Sri Wahyuni', 'Rahmat Hidayat', 'Nurul Hidayah',
  'Eko Prasetyo', 'Endang Suherman', 'Bambang Trihatmoko', 'Ratna Sari',
  'Dedi Kurniawan', 'Mega Utami', 'Iwan Setiyawan', 'Fitriani Aksa'
];

const STATUSES = ['Draft', 'In Review', 'Revisi', 'Approved', 'Rejected'];
const LEGAL_TYPES = ['PT', 'Perorangan', 'Yayasan', 'Koperasi', 'Kuasa', 'Waris'];

async function main() {
  console.log('🚀 Starting ULOK Dummy Data Seeder...');

  // 1. Fetch admin_cabang profiles
  const { data: adminProfiles, error: profileErr } = await supabase
    .from('profiles')
    .select('id, full_name, branch_id')
    .eq('role', 'admin_cabang');

  if (profileErr) {
    console.error('❌ Failed to fetch admin profiles:', profileErr.message);
    process.exit(1);
  }

  if (!adminProfiles || adminProfiles.length === 0) {
    console.error('⚠️ No users found with role = "admin_cabang". Please create branches and admin users first.');
    process.exit(1);
  }

  console.log(`✅ Found ${adminProfiles.length} admin_cabang profiles.`);

  // 2. Fetch checklist_master
  const { data: checklistMaster, error: checklistErr } = await supabase
    .from('checklist_master')
    .select('*');

  if (checklistErr) {
    console.error('❌ Failed to fetch checklist_master:', checklistErr.message);
    process.exit(1);
  }

  console.log(`✅ Loaded ${checklistMaster?.length || 0} items from checklist_master.`);

  let totalSubmissions = 0;
  let totalDocsUploaded = 0;
  let locationIdx = 0;

  const now = new Date();

  // 3. Loop through each admin profile and generate 4 ULOK entries per admin
  for (const admin of adminProfiles) {
    console.log(`\n📌 Seeding entries for Admin: ${admin.full_name} (Branch ID: ${admin.branch_id})...`);

    for (let i = 0; i < 72; i++) {
      const namaLokasi = `${SAMPLE_LOCATIONS[locationIdx % SAMPLE_LOCATIONS.length]} - Blok ${String.fromCharCode(65 + (i % 26))}${i + 1}`;
      const namaPemegangHak = PROPRIETORS[locationIdx % PROPRIETORS.length];
      locationIdx++;

      // Status distribution
      const status = STATUSES[totalSubmissions % STATUSES.length];
      const jenisBadanHukum = LEGAL_TYPES[totalSubmissions % LEGAL_TYPES.length];

      // Date variation: 50% older than 7 days (8-25 days ago), 50% within last 1-6 days
      const isOlderThan7Days = (totalSubmissions % 2 === 0);
      const daysAgo = isOlderThan7Days ? (8 + Math.floor(Math.random() * 15)) : (1 + Math.floor(Math.random() * 5));
      const createdAtDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const createdAtIso = createdAtDate.toISOString();

      let firstInReviewAt = null;
      let approvedAt = null;
      let lastReviewedAt = null;

      if (status !== 'Draft') {
        firstInReviewAt = new Date(createdAtDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString();
        lastReviewedAt = new Date(createdAtDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
      }
      if (status === 'Approved') {
        approvedAt = new Date(createdAtDate.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString();
      }

      const hargaSewa = 150000000 + Math.floor(Math.random() * 350) * 1000000; // Rp 150m - 500m

      // a. Insert ulok_submissions
      const { data: subData, error: subErr } = await supabase
        .from('ulok_submissions')
        .insert({
          admin_id: admin.id,
          nama_lokasi: namaLokasi,
          jenis_badan_hukum: jenisBadanHukum,
          nama_pemegang_hak: namaPemegangHak,
          alamat_koordinat: `-6.${150000 + Math.floor(Math.random() * 800000)}, 106.${750000 + Math.floor(Math.random() * 400000)}`,
          detail_alamat: `Jl. ${namaLokasi.replace('Alfamidi ', '')} No. ${10 + i * 5}, Jawa Barat / DKI Jakarta`,
          harga_sewa: hargaSewa,
          status: status,
          created_at: createdAtIso,
          updated_at: createdAtIso,
          first_in_review_at: firstInReviewAt,
          approved_at: approvedAt,
          last_reviewed_at: lastReviewedAt
        })
        .select('id')
        .single();

      if (subErr || !subData) {
        console.error(`❌ Error inserting ulok_submissions for ${namaLokasi}:`, subErr?.message);
        continue;
      }

      const ulokId = subData.id;
      totalSubmissions++;

      // b. Insert 1:1 relational sub-tables
      const nikFake = `3276${Math.floor(100000000000 + Math.random() * 899999999999)}`;
      const noKkFake = `3276${Math.floor(100000000000 + Math.random() * 899999999999)}`;
      const sertifikatNo = `SHM-${Math.floor(10000 + Math.random() * 89999)}/${namaLokasi.substring(0, 5).toUpperCase()}`;

      await Promise.all([
        supabase.from('ulok_pemilik').insert({
          ulok_id: ulokId,
          jenis_identitas: 'E-KTP',
          nik_pemilik: nikFake,
          no_kk: noKkFake,
          bentuk_objek: i % 2 === 0 ? 'Ruko 2 Lantai' : 'Lahan Kosong Siap Bangun',
          data_pribadi_lainnya: 'Dokumen pemilik lengkap dan terverifikasi'
        }),
        supabase.from('ulok_sertifikat').insert({
          ulok_id: ulokId,
          jenis_alas_hak: 'SHM',
          no_sertifikat_alas_hak: sertifikatNo,
          nama_sertifikat: namaPemegangHak,
          luas_sertifikat: 200 + (i * 30),
          masa_berlaku: '2045-12-31'
        }),
        supabase.from('ulok_legal').insert({
          ulok_id: ulokId,
          nama_ajb: `Notaris ${PROPRIETORS[(locationIdx + 1) % PROPRIETORS.length]} S.H.`,
          no_ajb_lainnya: `AJB-${Math.floor(100 + Math.random() * 899)}/2021`,
          luas_ajb: 200 + (i * 30),
          no_surat_kelurahan: `SK-${Math.floor(1000 + Math.random() * 8999)}/2022`
        }),
        supabase.from('ulok_jaminan').insert({
          ulok_id: ulokId,
          dokumen_jaminan: i === 3,
          nama_jaminan: i === 3 ? 'Bank Mandiri Cabang Utama' : null,
          no_surat_jaminan: i === 3 ? `SJB-${Math.floor(10000 + Math.random() * 89999)}` : null
        })
      ]);

      // c. Insert documents & upload fake files to bucket `dokumen-ulok`
      // Filter checklist master for this jenis_badan_hukum
      const matchingChecklist = (checklistMaster || []).filter(
        cm => cm.jenis_badan_hukum === jenisBadanHukum
      );

      // Determine completeness: Even-indexed submissions get 100% complete, Odd-indexed get ~40%
      const isComplete = (totalSubmissions % 2 === 0);
      const itemsToUpload = isComplete
        ? matchingChecklist
        : matchingChecklist.slice(0, Math.max(2, Math.floor(matchingChecklist.length * 0.4)));

      for (const item of itemsToUpload) {
        const fileExt = item.id % 2 === 0 ? 'pdf' : 'jpg';
        const fileBuffer = fileExt === 'pdf' ? dummyPdfBuffer : dummyJpgBuffer;
        const mimeType = fileExt === 'pdf' ? 'application/pdf' : 'image/jpeg';
        const randomStr = Math.random().toString(36).substring(2, 7);
        const storagePath = `${ulokId}/doc-${item.id}-${Date.now()}-${randomStr}.${fileExt}`;

        // Upload to storage
        const { error: uploadErr } = await supabase.storage
          .from('dokumen-ulok')
          .upload(storagePath, fileBuffer, {
            contentType: mimeType,
            upsert: true
          });

        if (uploadErr) {
          console.error(`  ⚠️ File upload error (${storagePath}):`, uploadErr.message);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('dokumen-ulok')
          .getPublicUrl(storagePath);

        // Insert into documents table
        // For complete submissions, set is_verified = true (≥80% target)
        const isVerified = isComplete;

        const { error: docInsertErr } = await supabase
          .from('documents')
          .insert({
            ulok_id: ulokId,
            checklist_id: item.id,
            document_type: `checklist_${item.id}`,
            file_url: urlData.publicUrl,
            uploaded_by: admin.id,
            version: 1,
            is_latest: true,
            is_verified: isVerified,
            uploaded_at: createdAtIso
          });

        if (docInsertErr) {
          console.error(`  ⚠️ Document table insert error:`, docInsertErr.message);
        } else {
          totalDocsUploaded++;
        }
      }

      // d. Insert metode_saw
      const c1 = isComplete ? 5 : Math.floor(2 + Math.random() * 2);
      const c2 = Math.floor(2 + Math.random() * 4); // 2 to 5
      const c3 = Math.floor(2 + Math.random() * 4); // 2 to 5

      const finalScore = Number(((0.45 * (c1 / 5)) + (0.35 * (c2 / 5)) + (0.20 * (c3 / 5))).toFixed(4));
      
      let notes = finalScore >= 0.75
        ? '**Sangat Layak Eksekusi!**\nDokumen lengkap dan durasi review legal sangat optimal.'
        : '**Evaluasi Lebih Lanjut.**\nBeberapa kriteria finansial atau kelengkapan berkas memerlukan penyesuaian.';

      await supabase.from('metode_saw').insert({
        ulok_id: ulokId,
        c1_score: c1,
        c2_score: c2,
        c3_score: c3,
        final_score: finalScore,
        saw_analysis_notes: notes
      });

      console.log(`  ✓ Subscribed ULOK: "${namaLokasi}" | Status: ${status} | Completeness: ${isComplete ? '100% (Lengkap)' : '~40% (Belum)'}`);
      
      // Throttle to prevent Supabase Storage rate limits (429)
      await sleep(200);
    }
  }

  console.log('\n==================================================');
  console.log(`🎉 SEEDING COMPLETE!`);
  console.log(`📊 Summary:`);
  console.log(`   - Total ULOK Submissions Created: ${totalSubmissions}`);
  console.log(`   - Total Dummy Documents Uploaded to Bucket: ${totalDocsUploaded}`);
  console.log('==================================================\n');
}

main().catch(err => {
  console.error('❌ Unexpected error during seeding:', err);
  process.exit(1);
});
