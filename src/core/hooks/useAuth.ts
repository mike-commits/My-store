/**
 * src/core/hooks/useAuth.ts
 * ─────────────────────────────────────────────────────────────
 * Standalone hook that reads auth state from AuthContext.
 * Provides session, user, loading state and a signOut helper.
 * Screens should import this hook rather than AuthContext
 * directly to decouple from the context implementation.
 * ─────────────────────────────────────────────────────────────
 */

import { useAuth as useAuthContext } from '../contexts/AuthContext';

/**
 * Returns { session, user, loading, signOut }.
 * Must be called inside a component that is a descendant of
 * AuthProvider (already set up in App.tsx).
 */
export function useAuth() {
  return useAuthContext();
}
