/**
 * src/presenter/screens/ProductDetailsScreen.tsx
 * ─────────────────────────────────────────────────────────────
 * Shows full details of a single product with:
 *   - Animated slide-up entrance
 *   - Product image (Supabase Storage URL) or placeholder icon
 *   - Stock-level StatusBadge
 *   - Detail rows: SKU, category, prices, quantity, description
 *   - Sales history (last 10 sales for this product)
 *   - Edit button → ProductFormScreen (when available)
 * ─────────────────────────────────────────────────────────────
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated,
  Image, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { useStore }      from '../../domain/useStore';
import { Sale, ShipmentItem } from '../../domain/models';
import { useAppTheme }   from '../../core/contexts/ThemeContext';
import { StatusBadge }   from '../../core/components/StatusBadge';
import { BadgeStatus }   from '../../core/components/StatusBadge';
import { AppButton }     from '../components/AppButton';

function stockStatus(qty: number): BadgeStatus {
  if (qty === 0) return 'danger';
  if (qty < 10)  return 'warning';
  return 'success';
}

function stockLabel(qty: number): string {
  if (qty === 0) return 'Out of Stock';
  if (qty < 10)  return 'Low Stock';
  return 'In Stock';
}

export function ProductDetailsScreen({ route, navigation }: any) {
  const { productId } = route.params;
  const { products, getProductShipments, getProductSales } = useStore();
  const { colors } = useAppTheme();

  const [shipments, setShipments] = useState<(ShipmentItem & { date: string })[]>([]);
  const [sales,     setSales]     = useState<Sale[]>([]);
  const [histLoading, setHistLoading] = useState(true);

  const product = products.find(p => p.id === productId);

  // ── Animated entrance ──────────────────────────────────────
  const translateY = useRef(new Animated.Value(60)).current;
  const fadeIn     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 380, useNativeDriver: true }),
      Animated.timing(fadeIn,     { toValue: 1, duration: 380, useNativeDriver: true }),
    ]).start();
  }, [translateY, fadeIn]);

  // ── Load activity ──────────────────────────────────────────
  useEffect(() => {
    if (!productId) return;
    (async () => {
      setHistLoading(true);
      try {
        const [s, r] = await Promise.all([
          getProductShipments(productId),
          getProductSales(productId),
        ]);
        setShipments(s);
        setSales(r.slice(0, 10));
      } finally {
        setHistLoading(false);
      }
    })();
  }, [productId, getProductShipments, getProductSales]);

  // ── Not found state ────────────────────────────────────────
  if (!product) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={40} color={colors.textMuted} />
        <Text style={[styles.notFoundText, { color: colors.text }]}>Product not found</Text>
        <AppButton title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const totalSold    = sales.reduce((sum, s) => sum + s.quantity, 0);
  const totalRevenue = sales.reduce((sum, s) => sum + s.quantity * s.sell_price, 0);
  const estProfit    = totalRevenue - totalSold * product.buy_price;

  const rows: { label: string; value: string }[] = [
    { label: 'Category',   value: product.category },
    { label: 'Buy Price',  value: `SSP ${product.buy_price.toFixed(2)}` },
    { label: 'Sell Price', value: `SSP ${product.sell_price.toFixed(2)}` },
    { label: 'Margin',     value: `SSP ${(product.sell_price - product.buy_price).toFixed(2)}` },
    { label: 'Quantity',   value: product.quantity.toString() },
    ...(product.notes ? [{ label: 'Notes', value: product.notes }] : []),
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.background }]}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerCategory, { color: colors.primary }]}>{product.category}</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{product.name}</Text>
        </View>
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeIn, transform: [{ translateY }] }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Image / Placeholder */}
        {(product as any).image_url ? (
          <Image source={{ uri: (product as any).image_url }} style={styles.productImage} resizeMode="cover" />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.border }]}>
            <Feather name="image" size={48} color={colors.textMuted} />
          </View>
        )}

        {/* Stock badge */}
        <View style={styles.badgeRow}>
          <StatusBadge status={stockStatus(product.quantity)} label={stockLabel(product.quantity)} size="md" />
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: 'In Stock',     val: product.quantity.toString(), color: colors.primary },
            { label: 'Total Sold',   val: totalSold.toString(),        color: colors.success },
            { label: 'Est. Profit',  val: `SSP ${estProfit.toFixed(0)}`, color: colors.secondary },
          ].map(s => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.val}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Detail rows */}
        <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {rows.map((r, i) => (
            <View key={r.label} style={[styles.detailRow, i < rows.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{r.label}</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{r.value}</Text>
            </View>
          ))}
        </View>

        {/* Sales history */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Sales History</Text>
        {histLoading ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Loading…</Text>
        ) : sales.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No sales recorded for this product.</Text>
        ) : (
          sales.map((s, i) => (
            <View key={s.id ?? i} style={[styles.histRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.histIcon, { backgroundColor: colors.success + '20' }]}>
                <Feather name="dollar-sign" size={14} color={colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.histTitle, { color: colors.text }]}>Sale · {s.quantity} unit{s.quantity !== 1 ? 's' : ''}</Text>
                <Text style={[styles.histDate,  { color: colors.textMuted }]}>{new Date(s.date).toLocaleDateString()}</Text>
              </View>
              <Text style={[styles.histAmount, { color: colors.primary }]}>SSP {(s.sell_price * s.quantity).toLocaleString()}</Text>
            </View>
          ))
        )}

        <View style={{ height: 110 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1 },
  notFound:         { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  notFoundText:     { fontSize: 16, fontWeight: '700' },
  header:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, gap: 12, borderBottomWidth: 1 },
  backBtn:          { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  headerCategory:   { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },
  headerTitle:      { fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  scroll:           { padding: 20 },
  productImage:     { width: '100%', height: 220, borderRadius: 20, marginBottom: 16 },
  imagePlaceholder: { width: '100%', height: 180, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  badgeRow:         { marginBottom: 20 },
  statsRow:         { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard:         { flex: 1, borderRadius: 16, borderWidth: 1, padding: 14, alignItems: 'center' },
  statValue:        { fontSize: 16, fontWeight: '900', marginBottom: 4 },
  statLabel:        { fontSize: 10, fontWeight: '700' },
  detailCard:       { borderRadius: 20, borderWidth: 1, marginBottom: 28, overflow: 'hidden' },
  detailRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  detailLabel:      { fontSize: 12, fontWeight: '600' },
  detailValue:      { fontSize: 13, fontWeight: '800' },
  sectionTitle:     { fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  histRow:          { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 8, gap: 12 },
  histIcon:         { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  histTitle:        { fontSize: 13, fontWeight: '700' },
  histDate:         { fontSize: 11, marginTop: 2 },
  histAmount:       { fontSize: 13, fontWeight: '900' },
  emptyText:        { fontSize: 13, fontStyle: 'italic' },
});
