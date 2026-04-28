/**
 * src/presenter/components/AuthGuard.tsx
 * ─────────────────────────────────────────────────────────────
 * Guards the navigation stack behind authentication.
 * Renders a loading spinner while auth state is resolving, the
 * unauthFallback (AuthScreen) when there is no session, and the
 * children when a valid session exists.
 *
 * Accepts optional override props so callers can supply custom
 * loading and unauth UIs.
 * ─────────────────────────────────────────────────────────────
 */

import React, { ReactNode } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../../core/contexts/AuthContext';
import { useAppTheme } from '../../core/contexts/ThemeContext';

interface AuthGuardProps {
  children:         ReactNode;
  /** Shown while auth state is loading. Pass null to use the built-in spinner. */
  loadingFallback?: ReactNode | null;
  /** Shown when there is no active session. Defaults to null. */
  unauthFallback?:  ReactNode;
}

export function AuthGuard({ children, loadingFallback, unauthFallback }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const { colors }        = useAppTheme();

  if (loading) {
    if (loadingFallback !== undefined) return <>{loadingFallback}</>;
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <>{unauthFallback ?? null}</>;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
