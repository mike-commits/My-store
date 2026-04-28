/**
 * src/core/components/StatusBadge.tsx
 * ─────────────────────────────────────────────────────────────
 * Reusable pill-shaped status badge.
 * Maps a semantic status string to theme-based colours and
 * renders a compact or medium-sized label.
 * ─────────────────────────────────────────────────────────────
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../contexts/ThemeContext';

export type BadgeStatus = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type BadgeSize   = 'sm' | 'md';

interface StatusBadgeProps {
  status:  BadgeStatus;
  label:   string;
  size?:   BadgeSize;
}

export function StatusBadge({ status, label, size = 'md' }: StatusBadgeProps) {
  const { colors } = useAppTheme();

  const palette: Record<BadgeStatus, { bg: string; text: string }> = {
    success: { bg: colors.success + '25', text: colors.success },
    warning: { bg: colors.warning + '25', text: colors.warning },
    danger:  { bg: colors.error   + '25', text: colors.error },
    info:    { bg: colors.secondary + '25', text: colors.secondary },
    neutral: { bg: colors.textMuted + '20', text: colors.textMuted },
  };

  const { bg, text } = palette[status];
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor:  bg,
          paddingHorizontal: isSmall ? 8 : 12,
          paddingVertical:   isSmall ? 3 : 5,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: text, fontSize: isSmall ? 9 : 11 },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 20, alignSelf: 'flex-start' },
  label: { fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
});
