import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SUPABASE_URL =
  (import.meta.env['VITE_SUPABASE_URL'] as string | undefined) ||
  (typeof process !== "undefined" ? process.env['SUPABASE_URL'] : undefined);
const SUPABASE_KEY =
  (import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] as string | undefined) ||
  (typeof process !== "undefined" ? process.env['SUPABASE_PUBLISHABLE_KEY'] : undefined);

function supabaseFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    const opaque = key.startsWith("sb_publishable_") || key.startsWith("sb_secret_");
    if (opaque && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

let instance: SupabaseClient<Database> | null = null;

/** Cliente único do navegador (sessão persistida em localStorage). */
export function getSupabase(): SupabaseClient<Database> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Configuração do banco de dados ausente.");
  }
  if (!instance) {
    instance = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
      global: { fetch: supabaseFetch(SUPABASE_KEY) },
      auth: {
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return instance;
}
