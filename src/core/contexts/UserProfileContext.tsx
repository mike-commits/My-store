/**
 * src/core/contexts/UserProfileContext.tsx
 * ─────────────────────────────────────────────────────────────
 * Provides the authenticated user's profile (store_name, role,
 * full_name, avatar_url) to any screen without prop-drilling.
 * Consumed by ScreenHeader and any screen that needs the store
 * name or user details.
 *
 * UserProfileProvider must be rendered inside AuthProvider so
 * it can read the current user's ID from AuthContext.
 * ─────────────────────────────────────────────────────────────
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUserProfile, UserProfile } from '../hooks/useUserProfile';

interface UserProfileContextType {
  profile:  UserProfile | null;
  loading:  boolean;
  error:    string | null;
  refetch:  () => void;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const result   = useUserProfile(user?.id ?? null);

  return (
    <UserProfileContext.Provider value={result}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfileContext(): UserProfileContextType {
  const ctx = useContext(UserProfileContext);
  if (!ctx) {
    throw new Error('useUserProfileContext must be used within a UserProfileProvider');
  }
  return ctx;
}
