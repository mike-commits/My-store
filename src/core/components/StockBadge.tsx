import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  qty: number;
}

export function StockBadge({ qty }: Props) {
  let bgColor = '#DC2626'; // Out of stock (red)
  let label = 'Out of stock';

  if (qty > 10) {
    bgColor = '#16A34A'; // In stock (green)
    label = 'In stock';
  } else if (qty > 0 && qty <= 10) {
    bgColor = '#D97706'; // Low stock (amber)
    label = 'Low stock';
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
