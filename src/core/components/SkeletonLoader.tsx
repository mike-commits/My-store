/**
 * src/core/components/SkeletonLoader.tsx
 * ─────────────────────────────────────────────────────────────
 * Reusable animated skeleton loading placeholder.
 * Uses Animated.loop + Animated.sequence to pulse opacity
 * between 0.3 and 0.7 every 700 ms.
 * ─────────────────────────────────────────────────────────────
 */

import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleSheet } from 'react-native';
import { useAppTheme } from '../contexts/ThemeContext';

interface SkeletonLoaderProps {
  width:        number | string;
  height:       number;
  borderRadius?: number;
  style?:       ViewStyle;
}

export function SkeletonLoader({
  width,
  height,
  borderRadius = 8,
  style,
}: SkeletonLoaderProps) {
  const { colors } = useAppTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

// ── Preset card skeleton used in dashboard/lists ──────────────
export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <SkeletonLoader width="100%" height={88} borderRadius={16} style={style} />
  );
}

const styles = StyleSheet.create({
  skeleton: { overflow: 'hidden' },
});
