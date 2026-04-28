/**
 * src/data/supabase.ts
 * ─────────────────────────────────────────────────────────────
 * Supabase JS client initialisation.
 * Reads credentials from EXPO_PUBLIC_* env vars at module load
 * time and throws a descriptive error if either is missing so
 * misconfiguration is caught early rather than silently failing.
 *
 * Also exports a Database type placeholder that can be replaced
 * with the output of `supabase gen types typescript` once you
 * run the Supabase CLI code-gen step.
 * ─────────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js';

// ── Type placeholder ──────────────────────────────────────────
// Replace with: import { Database } from './database.types';
// after running: npx supabase gen types typescript --linked
export type Database = Record<string, unknown>;

// ── Credential validation ─────────────────────────────────────
const rawUrl  = process.env.EXPO_PUBLIC_SUPABASE_URL  ?? '';
const rawKey  = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const supabaseUrl  = rawUrl.replace(/['"]+/g, '').trim();
const supabaseAnonKey = rawKey.replace(/['"]+/g, '').trim();

if (!supabaseUrl || supabaseUrl.includes('your-project')) {
  throw new Error(
    '[Supabase] EXPO_PUBLIC_SUPABASE_URL is missing or contains a placeholder. ' +
    'Copy .env.example to .env and fill in your real Supabase project URL.'
  );
}

if (!supabaseAnonKey || supabaseAnonKey.includes('your-anon-key')) {
  throw new Error(
    '[Supabase] EXPO_PUBLIC_SUPABASE_ANON_KEY is missing or contains a placeholder. ' +
    'Copy .env.example to .env and fill in your real Supabase anon key.'
  );
}

// ── Client singleton ──────────────────────────────────────────
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
