'use server' // <-- Ini wajib, nandain kalau fungsi ini berjalan di server (Aman/Secure)

export async function loginAction(formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');
  
  // Di sini lu tinggal panggil Supabase client buat nyocokin data
  // Mirip kayak Auth::attempt() di Laravel
}