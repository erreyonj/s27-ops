import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
// Supabase's newer "publishable" key (sb_publishable_...) replaces the legacy
// anon key; accept either name so setup matches whatever the dashboard shows.
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

export const supabaseConfigured = Boolean(url && key);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    if (!supabaseConfigured) throw new Error("Supabase is not configured");
    client = createClient(url!, key!, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return client;
}
