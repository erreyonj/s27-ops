import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
// Supabase's newer "publishable" key (sb_publishable_...) replaces the legacy
// anon key; accept either name so setup matches whatever the dashboard shows.
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

export const supabaseConfigured = Boolean(url && key);

/** Decode JWT payload claims only (no verify). Debug/clock-skew helper. */
export function peekJwtClaims(accessToken: string | undefined | null): {
  iat?: number;
  exp?: number;
  role?: string;
  iss?: string;
} | null {
  if (!accessToken) return null;
  try {
    const part = accessToken.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function supabaseHost(): string | null {
  try {
    return url ? new URL(url).host : null;
  } catch {
    return null;
  }
}

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
