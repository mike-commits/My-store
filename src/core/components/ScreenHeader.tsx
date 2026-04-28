/**
 * src/core/components/ScreenHeader.tsx
 * ─────────────────────────────────────────────────────────────
 * Reusable header for tab root screens (no back button).
 * Displays a title, an optional subtitle, and an optional right
 * action slot (any ReactNode — usually an icon button).
 * Falls back to the store_name from UserProfileContext as the
 * subtitle if none is passed explicitly.
 * ─────────────────────────────────────────────────────────────
 */

import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../contexts/ThemeContext';
import { useUserProfileContext } from '../contexts/UserProfileContext';

interface ScreenHeaderProps {
  title:       string;
  subtitle?:   string;
  rightAction?: ReactNode;
}

export function ScreenHeader({ title, subtitle, rightAction }: ScreenHeaderProps) {
  const { colors } = useAppTheme();

  // Safely try to use profile context; if not mounted yet, fall back gracefully
  let storeName: string | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { profile } = useUserProfileContext();
    storeName = profile?.store_name ?? null;
  } catch {
    // UserProfileProvider not mounted yet — that's ok
  }

  const displaySubtitle = subtitle ?? storeName ?? '';

  return (
    <View style={styles.header}>
      <View style={styles.textBlock}>
        {displaySubtitle ? (
          <Text style={[styles.subtitle, { color: colors.primary }]}>
            {displaySubtitle.toUpperCase()}
          </Text>
        ) : null}
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      </View>
      {rightAction && <View style={styles.rightSlot}>{rightAction}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header:    { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  textBlock: { flex: 1 },
  subtitle:  { fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  title:     { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  rightSlot: { marginLeft: 12 },
});
