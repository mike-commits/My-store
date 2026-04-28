/**
 * src/core/components/EmptyState.tsx
 * ─────────────────────────────────────────────────────────────
 * Reusable empty-state display with an icon, title, subtitle,
 * and an optional call-to-action button.
 * ─────────────────────────────────────────────────────────────
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../contexts/ThemeContext';

// Use the Feather icon name type
type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

interface EmptyStateProps {
  icon:         FeatherIconName;
  title:        string;
  subtitle:     string;
  actionLabel?: string;
  onAction?:    () => void;
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: colors.border + '60' }]}>
        <Feather name={icon} size={48} color={colors.textMuted} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>

      {actionLabel && onAction && (
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: colors.primary }]}
          onPress={onAction}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionText, { color: colors.primary }]}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, minHeight: 280 },
  iconContainer: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title:         { fontSize: 18, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  subtitle:      { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  actionBtn:     { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  actionText:    { fontSize: 14, fontWeight: '700' },
});
