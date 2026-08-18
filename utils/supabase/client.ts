import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | undefined

// Flag biar listener onAuthStateChange cuma didaftarin SEKALI,
// walau createClient()/getRealtimeClient() dipanggil berkali-kali
// dari komponen yang berbeda-beda.
let authListenerRegistered = false

export function createClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  // Daftarin listener token-refresh sekali aja, di sini (bukan di tiap
  // komponen) - biar SEMUA channel realtime yang lagi aktif di halaman
  // manapun otomatis ke-refresh auth-nya bareng, tanpa tiap komponen
  // perlu ngurus sendiri-sendiri.
  if (!authListenerRegistered) {
    authListenerRegistered = true
    client.auth.onAuthStateChange((event: any, session: any) => {
      if (session?.access_token) {
        // Dipanggil ulang tiap kali: login awal, token refresh (~1 jam),
        // atau logout (access_token jadi undefined -> di-skip, gak masalah
        // karena socket bakal ke-drop juga pas user logout).
        client!.realtime.setAuth(session.access_token)
      }
    })
  }

  return client
}

/**
 * Pastiin session user (kalau ada) udah nempel ke koneksi Realtime
 * SEBELUM subscribe ke channel manapun. Wajib dipanggil di awal tiap
 * useEffect yang bikin channel postgres_changes.
 *
 * Kenapa perlu: kalau langsung .channel().subscribe() tanpa nunggu ini,
 * ada kemungkinan socket connect duluan sebelum JWT ke-attach -> Supabase
 * Realtime ngevaluasi RLS pakai role 'anon', bukan 'authenticated' ->
 * event postgres_changes di-drop diam-diam walau status subscribe-nya
 * tetap "SUBSCRIBED".
 */
export async function getRealtimeClient() {
  const supabase = createClient()
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      supabase.realtime.setAuth(session.access_token)
    }
  } catch (err) {
    console.error('Failed to set auth token on realtime socket:', err)
  }
  return supabase
}
