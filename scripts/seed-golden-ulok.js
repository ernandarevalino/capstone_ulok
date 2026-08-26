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

const TARGET_BRANCHES = [
  { nama_cabang: 'Cabang Jakarta', kabupaten_kota: 'Jakarta Selatan', provinsi: 'DKI Jakarta' },
  { nama_cabang: 'Cabang Bandung', kabupaten_kota: 'Kota Bandung', provinsi: 'Jawa Barat' },
  { nama_cabang: 'Cabang Surabaya', kabupaten_kota: 'Kota Surabaya', provinsi: 'Jawa Timur' },
  { nama_cabang: 'Cabang Semarang', kabupaten_kota: 'Kota Semarang', provinsi: 'Jawa Tengah' },
  { nama_cabang: 'Cabang Denpasar', kabupaten_kota: 'Kota Denpasar', provinsi: 'Bali' },
  { nama_cabang: 'Cabang Makassar', kabupaten_kota: 'Kota Makassar', provinsi: 'Sulawesi Selatan' },
  { nama_cabang: 'Cabang Palembang', kabupaten_kota: 'Kota Palembang', provinsi: 'Sumatera Selatan' },
  { nama_cabang: 'Cabang Balikpapan', kabupaten_kota: 'Kota Balikpapan', provinsi: 'Kalimantan Timur' },
  { nama_cabang: 'Cabang Manado', kabupaten_kota: 'Kota Manado', provinsi: 'Sulawesi Utara' },
  { nama_cabang: 'Cabang Medan', kabupaten_kota: 'Kota Medan', provinsi: 'Sumatera Utara' },
  { nama_cabang: 'Cabang Yogyakarta', kabupaten_kota: 'Kota Yogyakarta', provinsi: 'DI Yogyakarta' },
];

const ADMIN_NAMES = [
  'Surya Kencana', 'Rina Octaviani', 'Fajar Ramadhan', 'Dian Lestari',
  'Aris Setiawan', 'Larasati Putri', 'Galih Permana', 'Vina Melati',
  'Bayu Kurnia', 'Tania Safitri', 'Fahmi Idris'
];

const GOLDEN_LOCATIONS = [
  'Alfamidi Super Ahmad Yani',
  'Alfamidi Express Sudirman',
  'Alfamidi Super Pettarani',
  'Alfamidi Express Demang Lebar Daun',
  'Alfamidi Super Sudirman',
  'Alfamidi Express Sam Ratulangi',
  'Alfamidi Super Gatot Subroto',
  'Alfamidi Express Malioboro',
  'Alfamidi Super Dago Utama',
  'Alfamidi Express Mayjen Sungkono',
  'Alfamidi Super HR Rasuna Said',
  'Alfamidi Express Pandanaran',
  'Alfamidi Super Teuku Umar',
  'Alfamidi Express AP Pettarani',
  'Alfamidi Super Veteran'
];

const PROPRIETORS = [
  'Budi Santoso', 'Siti Rahmawati', 'Hendra Wijaya', 'Dewi Lestari',
  'Agus Setiawan', 'Sri Wahyuni', 'Rahmat Hidayat', 'Nurul Hidayah',
  'Eko Prasetyo', 'Endang Suherman', 'Bambang Trihatmoko', 'Ratna Sari'
];

const LEGAL_TYPES = ['PT', 'Perorangan', 'Yayasan', 'Koperasi', 'Kuasa', 'Waris'];

async function createAndProfileUser(email, password, fullName, role, branchId) {
  let userId = null;

  const { data: createData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (createError) {
    if (createError.message.includes('already been registered') || createError.status === 422) {
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      if (!listError && users) {
        const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
          userId = existing.id;
          await supabase.auth.admin.updateUserById(userId, { password });
        }
      }
    } else {
      console.error(`  ❌ Failed to create auth user ${email}:`, createError.message);
      return null;
    }
  } else if (createData?.user) {
    userId = createData.user.id;
  }

  if (!userId) return null;

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('nik')
    .eq('id', userId)
    .single();

  const nik = existingProfile?.nik || Math.floor(10000000 + Math.random() * 89999999);

  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: userId,
      full_name: fullName,
      nik: nik,
      role: role,
      branch_id: branchId
    },
    { onConflict: 'id' }
  );

  if (profileError) {
    console.error(`  ⚠️ Error updating profile for ${email}:`, profileError.message);
    return null;
  }

  return { id: userId, full_name: fullName, branch_id: branchId };
}

async function main() {
  console.log('🚀 Starting Branch Expansion & Golden ULOK Data Seeder...\n');

  // =========================================================================
  // STEP 1: Branch Expansion (Ensure exactly 11 active branches)
  // =========================================================================
  console.log('📌 STEP 1: Checking & Expanding Branches to 11...');
  let { data: existingBranches, error: fetchBranchErr } = await supabase.from('branches').select('*');

  if (fetchBranchErr) {
    console.error('❌ Failed to fetch existing branches:', fetchBranchErr.message);
    process.exit(1);
  }

  existingBranches = existingBranches || [];
  console.log(`  Current branch count: ${existingBranches.length}`);

  for (const target of TARGET_BRANCHES) {
    const found = existingBranches.find(
      (b) => b.nama_cabang.toLowerCase().trim() === target.nama_cabang.toLowerCase().trim()
    );

    if (!found && existingBranches.length < 11) {
      console.log(`  ➕ Inserting branch: ${target.nama_cabang}...`);
      const { data: inserted, error: insErr } = await supabase
        .from('branches')
        .insert(target)
        .select()
        .single();

      if (!insErr && inserted) {
        existingBranches.push(inserted);
      } else if (insErr) {
        console.error(`  ❌ Failed to insert branch ${target.nama_cabang}:`, insErr.message);
      }
    }
  }

  // Refetch all branches to ensure we have the complete up-to-date list
  const { data: finalBranches } = await supabase.from('branches').select('*').order('id');
  const branches = finalBranches || existingBranches;
  console.log(`✅ Active Branches Count: ${branches.length}\n`);

  // =========================================================================
  // STEP 2: Ensure Admin Cabang User Accounts for all branches
  // =========================================================================
  console.log('📌 STEP 2: Ensuring Admin Cabang Accounts for all 11 Branches...');
  const adminProfiles = [];

  for (let idx = 0; idx < branches.length; idx++) {
    const branch = branches[idx];
    const email = `admin.cabang${branch.id}@mu.co.id`;
    const fullName = (ADMIN_NAMES[idx % ADMIN_NAMES.length] || `Admin ${branch.nama_cabang}`) + ` (${branch.nama_cabang})`;

    const profile = await createAndProfileUser(email, '00000000', fullName, 'admin_cabang', branch.id);
    if (profile) {
      adminProfiles.push(profile);
      console.log(`  ✓ Admin Account Ready: ${email} -> ${branch.nama_cabang} (ID: ${branch.id})`);
    }
    await sleep(150);
  }

  console.log(`\n✅ Ready with ${adminProfiles.length} Admin Cabang profiles.\n`);

  // =========================================================================
  // STEP 3: Golden Data Engineering (Patut Dilihat Priority Seed)
  // =========================================================================
  console.log('📌 STEP 3: Seeding Golden ULOK Data (Patut Dilihat Priority)...');

  // Fetch checklist master items
  const { data: checklistMaster, error: checklistErr } = await supabase
    .from('checklist_master')
    .select('*');

  if (checklistErr || !checklistMaster) {
    console.error('❌ Failed to fetch checklist_master:', checklistErr?.message);
    process.exit(1);
  }

  let totalGoldenSubmissions = 0;
  let totalGoldenDocs = 0;
  let locCounter = 0;
  const now = new Date();

  for (let bIdx = 0; bIdx < adminProfiles.length; bIdx++) {
    const admin = adminProfiles[bIdx];
    const branchObj = branches.find(b => b.id === admin.branch_id) || { nama_cabang: `Cabang ${admin.branch_id}` };

    // Generate 4 "Golden" submissions per admin cabang (4 x 11 = 44 golden submissions)
    const submissionsPerAdmin = 4;
    console.log(`\n🌟 Generating ${submissionsPerAdmin} Golden Submissions for ${admin.full_name} (${branchObj.nama_cabang})...`);

    for (let s = 0; s < submissionsPerAdmin; s++) {
      locCounter++;
      const baseLoc = GOLDEN_LOCATIONS[(locCounter - 1) % GOLDEN_LOCATIONS.length];
      const namaLokasi = `${baseLoc} - ${branchObj.nama_cabang.replace('Cabang ', '')} Prime ${s + 1}`;
      const namaPemegangHak = PROPRIETORS[(locCounter - 1) % PROPRIETORS.length];
      const jenisBadanHukum = LEGAL_TYPES[(locCounter - 1) % LEGAL_TYPES.length];

      // Criteria 1: status = 'In Review'
      const status = 'In Review';

      // Criteria 2: Low Rent Price (Rp 40M - Rp 85M)
      const hargaSewa = 40000000 + Math.floor(Math.random() * 45) * 1000000;

      // Date: 8 to 15 days ago to trigger priority/stale review threshold
      const daysAgo = 8 + Math.floor(Math.random() * 8);
      const createdAtDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const createdAtIso = createdAtDate.toISOString();

      const firstInReviewAt = new Date(createdAtDate.getTime() + 12 * 60 * 60 * 1000).toISOString();
      const lastReviewedAt = new Date(createdAtDate.getTime() + 24 * 60 * 60 * 1000).toISOString();

      // Insert into ulok_submissions
      const { data: subData, error: subErr } = await supabase
        .from('ulok_submissions')
        .insert({
          admin_id: admin.id,
          nama_lokasi: namaLokasi,
          jenis_badan_hukum: jenisBadanHukum,
          nama_pemegang_hak: namaPemegangHak,
          alamat_koordinat: `-6.${180000 + Math.floor(Math.random() * 700000)}, 106.${800000 + Math.floor(Math.random() * 300000)}`,
          detail_alamat: `Jl. Utama ${branchObj.nama_cabang} No. ${15 + s * 8}, ${branchObj.kabupaten_kota || 'Kota'}, ${branchObj.provinsi || 'Indonesia'}`,
          harga_sewa: hargaSewa,
          status: status,
          created_at: createdAtIso,
          updated_at: createdAtIso,
          first_in_review_at: firstInReviewAt,
          approved_at: null,
          last_reviewed_at: lastReviewedAt
        })
        .select('id')
        .single();

      if (subErr || !subData) {
        console.error(`  ❌ Error inserting submission for ${namaLokasi}:`, subErr?.message);
        continue;
      }

      const ulokId = subData.id;
      totalGoldenSubmissions++;

      // Insert 1:1 sub-tables
      const nikFake = `3276${Math.floor(100000000000 + Math.random() * 899999999999)}`;
      const noKkFake = `3276${Math.floor(100000000000 + Math.random() * 899999999999)}`;
      const sertifikatNo = `SHM-GOLD-${Math.floor(10000 + Math.random() * 89999)}/${branchObj.nama_cabang.substring(7, 10).toUpperCase()}`;

      await Promise.all([
        supabase.from('ulok_pemilik').insert({
          ulok_id: ulokId,
          jenis_identitas: 'E-KTP',
          nik_pemilik: nikFake,
          no_kk: noKkFake,
          bentuk_objek: 'Ruko Strategis 2 Lantai',
          data_pribadi_lainnya: 'Pemilik kooperatif, berkas siap 100%'
        }),
        supabase.from('ulok_sertifikat').insert({
          ulok_id: ulokId,
          jenis_alas_hak: 'SHM',
          no_sertifikat_alas_hak: sertifikatNo,
          nama_sertifikat: namaPemegangHak,
          luas_sertifikat: 250 + (s * 25),
          masa_berlaku: '2048-12-31'
        }),
        supabase.from('ulok_legal').insert({
          ulok_id: ulokId,
          nama_ajb: `Notaris Utama ${PROPRIETORS[(locCounter + 1) % PROPRIETORS.length]} S.H.`,
          no_ajb_lainnya: `AJB-GOLD-${Math.floor(100 + Math.random() * 899)}/2023`,
          luas_ajb: 250 + (s * 25),
          no_surat_kelurahan: `SK-GOLD-${Math.floor(1000 + Math.random() * 8999)}/2023`
        }),
        supabase.from('ulok_jaminan').insert({
          ulok_id: ulokId,
          dokumen_jaminan: false,
          nama_jaminan: null,
          no_surat_jaminan: null
        })
      ]);

      // Matching checklist items for 100% completeness
      const matchingChecklist = checklistMaster.filter(
        (cm) => cm.jenis_badan_hukum === jenisBadanHukum
      );

      for (const item of matchingChecklist) {
        const fileExt = item.id % 2 === 0 ? 'pdf' : 'jpg';
        const fileBuffer = fileExt === 'pdf' ? dummyPdfBuffer : dummyJpgBuffer;
        const mimeType = fileExt === 'pdf' ? 'application/pdf' : 'image/jpeg';
        const randomStr = Math.random().toString(36).substring(2, 7);
        const storagePath = `golden-${ulokId}/doc-${item.id}-${Date.now()}-${randomStr}.${fileExt}`;

        // Upload to storage bucket
        const { error: uploadErr } = await supabase.storage
          .from('dokumen-ulok')
          .upload(storagePath, fileBuffer, {
            contentType: mimeType,
            upsert: true
          });

        if (uploadErr) {
          console.error(`    ⚠️ Upload error for ${storagePath}:`, uploadErr.message);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('dokumen-ulok')
          .getPublicUrl(storagePath);

        // Document type mapping to satisfy hasAlasHak:
        // hasAlasHak checks doc.document_type === 'sertifikat_tanah' || doc.document_type === 'ajb_girik'
        let docType = `checklist_${item.id}`;
        const isSertifikatDoc = [12, 26, 40, 54].includes(item.id) || item.nama_dokumen.toLowerCase().includes('sertifikat');
        const isAjbDoc = [13, 27, 41, 55].includes(item.id) || item.nama_dokumen.toLowerCase().includes('ajb');

        if (isSertifikatDoc) {
          docType = 'sertifikat_tanah';
        } else if (isAjbDoc) {
          docType = 'ajb_girik';
        }

        const { error: docInsertErr } = await supabase
          .from('documents')
          .insert({
            ulok_id: ulokId,
            checklist_id: item.id,
            document_type: docType,
            file_url: urlData.publicUrl,
            uploaded_by: admin.id,
            version: 1,
            is_latest: true,
            is_verified: true, // 100% verified & complete
            uploaded_at: createdAtIso
          });

        if (!docInsertErr) {
          totalGoldenDocs++;
        } else {
          console.error(`    ⚠️ Doc table insert error:`, docInsertErr.message);
        }
      }

      // SAW Scoring for High Priority / High Potential
      const c1 = 5;
      const c2 = 5;
      const c3 = 5;
      const finalScore = 0.95;

      await supabase.from('metode_saw').insert({
        ulok_id: ulokId,
        c1_score: c1,
        c2_score: c2,
        c3_score: c3,
        final_score: finalScore,
        saw_analysis_notes: '🌟 GOLDEN PROPOSAL! Dokumen 100% lengkap, harga sewa sangat terjangkau, dan daya tarik lokasi sangat tinggi.'
      });

      console.log(`  ✓ Golden ULOK Inserted: "${namaLokasi}" | Rent: Rp ${(hargaSewa / 1000000).toFixed(0)}M | Status: In Review | Docs: 100% Verified`);

      await sleep(200);
    }
  }

  console.log('\n==================================================');
  console.log('🎉 GOLDEN SEEDING COMPLETE!');
  console.log('📊 Summary:');
  console.log(`   - Active Branches: ${branches.length}`);
  console.log(`   - Admin Cabang Accounts: ${adminProfiles.length}`);
  console.log(`   - Golden ULOK Submissions Created: ${totalGoldenSubmissions}`);
  console.log(`   - Verified Documents Uploaded: ${totalGoldenDocs}`);
  console.log('==================================================\n');
}

main().catch((err) => {
  console.error('❌ Unexpected error during golden seeding:', err);
  process.exit(1);
});
