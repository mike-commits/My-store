import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co').replace(/['"]+/g, '').trim();
const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key').replace(/['"]+/g, '').trim();

if (supabaseUrl.includes('your-project') || supabaseAnonKey.includes('your-anon-key')) {
    console.error('CRITICAL: Supabase credentials are missing! Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
