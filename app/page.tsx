import { supabase } from "@/lib/supabaseClient";

export default async function Home() {
  const { data, error } = await supabase.from("ulok_requests").select("*");

  return (
    <main style={{ padding: 20 }}>
      <h1>Supabase Test</h1>
      {error && <p>Error: {error.message}</p>}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  );
}