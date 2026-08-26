import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.');
  process.exit(1);
}

// Service role client can bypass RLS and access auth.admin
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Random Indonesian full names for realistic profiles
const ASSESSOR_NAMES = [
  'Ahmad Fauzi', 'Siti Nurhaliza', 'Budi Harjo', 'Dewi Anggraini',
  'Rizky Pratama', 'Indah Permata', 'Hasan Basri', 'Maya Sartika',
  'Tri Wibowo', 'Nabila Putri'
];

const ADMIN_NAMES = [
  'Surya Kencana', 'Rina Octaviani', 'Fajar Ramadhan', 'Dian Lestari',
  'Aris Setiawan', 'Larasati Putri', 'Galih Permana', 'Vina Melati',
  'Bayu Kurnia', 'Tania Safitri', 'Fahmi Idris'
];

async function createAndProfileUser(email, password, fullName, role, branchId = null) {
  let userId = null;

  // 1. Create or fetch Auth user
  const { data: createData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (createError) {
    if (createError.message.includes('already been registered') || createError.status === 422) {
      // User already exists in Auth, fetch their ID
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      if (!listError && users) {
        const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
          userId = existing.id;
          // Optionally update password to 00000000
          await supabase.auth.admin.updateUserById(userId, { password });
        }
      }
    } else {
      console.error(`  ❌ Failed to create auth user ${email}:`, createError.message);
      return false;
    }
  } else if (createData?.user) {
    userId = createData.user.id;
  }

  if (!userId) {
    console.error(`  ❌ Could not obtain user ID for ${email}`);
    return false;
  }

  // 2. Check if profile already exists to preserve existing NIK if present
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('nik')
    .eq('id', userId)
    .single();

  let nik = existingProfile?.nik;
  if (!nik) {
    nik = Math.floor(10000000 + Math.random() * 89999999);
  }

  // 3. Upsert profile record
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
    return false;
  }

  console.log(`  ✓ Account Ready: ${email} | Role: ${role} ${branchId ? `(Branch ID: ${branchId})` : ''}`);
  return true;
}

async function main() {
  console.log('🚀 Starting Dummy Users Seeder (Assessors & Admin Cabangs)...\n');

  // 1. Fetch or create branches
  let { data: branches, error: branchErr } = await supabase.from('branches').select('*');

  if (branchErr) {
    console.error('❌ Failed to fetch branches:', branchErr.message);
    process.exit(1);
  }

  if (!branches || branches.length < 5) {
    console.log('⚠️ Fewer than 5 branches found. Seeding default branches...');
    const defaultBranches = [
      { nama_cabang: 'Cabang Jakarta', kabupaten_kota: 'Jakarta Selatan', provinsi: 'DKI Jakarta' },
      { nama_cabang: 'Cabang Bandung', kabupaten_kota: 'Kota Bandung', provinsi: 'Jawa Barat' },
      { nama_cabang: 'Cabang Surabaya', kabupaten_kota: 'Kota Surabaya', provinsi: 'Jawa Timur' },
      { nama_cabang: 'Cabang Semarang', kabupaten_kota: 'Kota Semarang', provinsi: 'Jawa Tengah' },
      { nama_cabang: 'Cabang Denpasar', kabupaten_kota: 'Kota Denpasar', provinsi: 'Bali' }
    ];

    const { data: newBranches, error: insertBranchErr } = await supabase
      .from('branches')
      .insert(defaultBranches)
      .select();

    if (!insertBranchErr && newBranches) {
      branches = [...(branches || []), ...newBranches];
    }
  }

  console.log(`✅ Total Branches Available: ${branches.length}\n`);

  // 2. Seed 10 Assessors
  console.log('📌 Seeding 10 Assessor Accounts (Password: "00000000")...');
  let assessorSuccessCount = 0;
  for (let i = 1; i <= 10; i++) {
    const email = `assessor${i}@mu.co.id`;
    const fullName = ASSESSOR_NAMES[(i - 1) % ASSESSOR_NAMES.length] + ` (Assessor ${i})`;
    const success = await createAndProfileUser(email, '00000000', fullName, 'assessor', null);
    if (success) assessorSuccessCount++;
    await sleep(200);
  }

  console.log(`\n✅ ${assessorSuccessCount}/10 Assessor accounts created/updated.\n`);

  // 3. Seed Admin Cabang for each branch
  console.log('📌 Seeding Admin Cabang Accounts for Each Branch (Password: "00000000")...');
  let adminSuccessCount = 0;
  for (let idx = 0; idx < branches.length; idx++) {
    const branch = branches[idx];
    const email = `admin.cabang${branch.id}@mu.co.id`;
    const fullName = ADMIN_NAMES[idx % ADMIN_NAMES.length] + ` (${branch.nama_cabang})`;
    const success = await createAndProfileUser(email, '00000000', fullName, 'admin_cabang', branch.id);
    if (success) adminSuccessCount++;
    await sleep(200);
  }

  console.log(`\n✅ ${adminSuccessCount}/${branches.length} Admin Cabang accounts created/updated.`);

  console.log('\n==================================================');
  console.log('🎉 USER SEEDING COMPLETE!');
  console.log('🔑 Credentials Summary:');
  console.log('   - Password for ALL generated accounts: "00000000"');
  console.log('   - Assessor Emails: assessor1@mu.co.id ... assessor10@mu.co.id');
  console.log(`   - Admin Cabang Emails: admin.cabang1@mu.co.id ... admin.cabang${branches.length}@mu.co.id`);
  console.log('==================================================\n');
}

main().catch((err) => {
  console.error('❌ Unexpected error during user seeding:', err);
  process.exit(1);
});
