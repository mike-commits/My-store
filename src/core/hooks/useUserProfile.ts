/**
 * src/core/hooks/useUserProfile.ts
 * ─────────────────────────────────────────────────────────────
 * Fetches the user_profiles row for the given userId from
 * Supabase. Returns the profile data, loading state, any error,
 * and a refetch function.
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../data/supabase';

export interface UserProfile {
  full_name:  string | null;
  store_name: string | null;
  role:       'owner' | 'manager' | 'staff';
  avatar_url: string | null;
}

interface UseUserProfileResult {
  profile:  UserProfile | null;
  loading:  boolean;
  error:    string | null;
  refetch:  () => void;
}

export function useUserProfile(userId: string | null): UseUserProfileResult {
  const [profile, setProfile]   = useState<UserProfile | null>(null);
  const [loading, setLoading]   = useState<boolean>(false);
  const [error,   setError]     = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: supaError } = await supabase
        .from('user_profiles')
        .select('full_name, store_name, role, avatar_url')
        .eq('id', userId)
        .single();

      if (supaError && supaError.code !== 'PGRST116') {
        // PGRST116 = no rows — treat as empty, not an error
        throw supaError;
      }

      setProfile(data ?? null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load profile';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
}
