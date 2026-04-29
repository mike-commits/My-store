import React, { useEffect, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useStore }      from '../../domain/useStore';
import { useAppTheme }   from '../../core/contexts/ThemeContext';
import { useAuth }       from '../../core/contexts/AuthContext';
import { supabase }      from '../../data/supabase';
import { SkeletonCard }  from '../../core/components/SkeletonCard';
import { QuickProductModal } from '../components/QuickProductModal';

// ── Helpers ───────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getGreeting(firstName: string | null): string {
  const hour = new Date().getHours();
  const part  = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  return `Good ${part}${firstName ? ', ' + firstName : ''}`;
}

function getInitials(fullName: string | null | undefined): string {
  if (!fullName) return '?';
  return fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

// ── Component ─────────────────────────────────────────────────
export function DashboardScreen() {
  const { products, sales, stats, refreshAll, addProduct, loading } = useStore();
  const { colors, isDark } = useAppTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [productModalVisible, setProductModalVisible] = React.useState(false);

  // ── Realtime subscription ──────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-sales')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sales' },
        () => { refreshAll(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refreshAll]);

  // ── Derived KPI data ───────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const kpis = useMemo(() => {
    const salesToday = sales.filter(s => s.date.startsWith(today));
    const salesThisMonth = sales.filter(s => s.date >= monthStart);
    return {
      totalProducts:    products.length,
      salesToday:       salesToday.reduce((sum, s) => sum + s.sell_price * s.quantity, 0),
      pendingShipments: 0, 
      revenueThisMonth: salesThisMonth.reduce((sum, s) => sum + s.sell_price * s.quantity, 0),
    };
  }, [products, sales, today, monthStart]);

  const recentSales = useMemo(() => [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5), [sales]);
  const lowStock    = useMemo(() => products.filter(p => p.quantity < 10), [products]);

  // ── User info ──────────────────────────────────────────────
  const userMeta    = user?.user_metadata as { full_name?: string; store_name?: string } | undefined;
  const fullName    = userMeta?.full_name ?? null;
  const storeName   = userMeta?.store_name ?? 'My Store';
  const firstName   = fullName ? fullName.split(' ')[0] : null;
  const initials    = getInitials(fullName);

  // ── KPI card data ──────────────────────────────────────────
  const kpiCards = [
    { label: 'Total Products',      value: kpis.totalProducts,         icon: 'box' as const,         color: colors.primary },
    { label: 'Sales Today',         value: `SSP ${kpis.salesToday.toLocaleString()}`,        icon: 'dollar-sign' as const, color: colors.success },
    { label: 'Pending Shipments',   value: kpis.pendingShipments,      icon: 'truck' as const,       color: colors.warning },
    { label: 'Revenue This Month',  value: `SSP ${kpis.revenueThisMonth.toLocaleString()}`,  icon: 'trending-up' as const, color: colors.secondary },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Redesign */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[styles.storeName, { color: colors.text }]}>{storeName}</Text>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
        <Text style={[styles.greeting, { color: colors.textMuted }]}>{getGreeting(firstName)}</Text>
        
        {/* Horizontal scrollable row of quick-action chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipRow}>
          <TouchableOpacity style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setProductModalVisible(true)}>
            <Feather name="plus" size={16} color={colors.primary} />
            <Text style={[styles.chipText, { color: colors.text }]}>Product</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigation.navigate('Sales')}>
            <Feather name="dollar-sign" size={16} color={colors.success} />
            <Text style={[styles.chipText, { color: colors.text }]}>Sale</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigation.navigate('Shipments')}>
            <Feather name="truck" size={16} color={colors.warning} />
            <Text style={[styles.chipText, { color: colors.text }]}>Shipment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigation.navigate('Reports')}>
            <Feather name="pie-chart" size={16} color={colors.secondary} />
            <Text style={[styles.chipText, { color: colors.text }]}>Reports</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── KPI Grid ── */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Overview</Text>

        {loading ? (
          <View style={styles.kpiGrid}>
            <SkeletonCard style={styles.kpiCard} height={110} />
            <SkeletonCard style={styles.kpiCard} height={110} />
            <SkeletonCard style={styles.kpiCard} height={110} />
            <SkeletonCard style={styles.kpiCard} height={110} />
          </View>
        ) : (
          <View style={styles.kpiGrid}>
            {kpiCards.map((k) => (
              <View key={k.label} style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.kpiIconBox, { backgroundColor: k.color + '20' }]}>
                  <Feather name={k.icon} size={18} color={k.color} />
                </View>
                <Text style={[styles.kpiValue, { color: colors.text }]}>{k.value}</Text>
                <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>{k.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Low Stock Alert ── */}
        {!loading && lowStock.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Low Stock Alert</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.lowStockRow}>
              {lowStock.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.lowStockChip, { backgroundColor: p.quantity === 0 ? colors.error + '20' : colors.warning + '20', borderColor: p.quantity === 0 ? colors.error : colors.warning }]}
                  onPress={() => navigation.navigate('ProductDetails', { productId: p.id })}
                >
                  <Text style={[styles.lowStockName, { color: p.quantity === 0 ? colors.error : colors.warning }]}>{p.name}</Text>
                  <Text style={[styles.lowStockQty, { color: p.quantity === 0 ? colors.error : colors.warning }]}>{p.quantity} left</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* ── Recent Sales ── */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 28 }]}>Recent Sales</Text>
        {loading ? (
          <View style={{ gap: 8 }}>
             <SkeletonCard height={70} />
             <SkeletonCard height={70} />
          </View>
        ) : recentSales.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No sales recorded yet.</Text>
        ) : (
          recentSales.map(s => (
            <View key={s.id} style={[styles.saleRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.saleName, { color: colors.text }]}>{s.product_name ?? 'Product'}</Text>
                <Text style={[styles.saleTime, { color: colors.textMuted }]}>{timeAgo(s.date)}</Text>
              </View>
              <Text style={[styles.saleAmount, { color: colors.primary }]}>
                SSP {(s.sell_price * s.quantity).toLocaleString()}
              </Text>
            </View>
          ))
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      <QuickProductModal
        visible={productModalVisible}
        onClose={() => setProductModalVisible(false)}
        onAdd={addProduct}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1 },
  header:        { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
  headerTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  storeName:     { fontSize: 22, fontWeight: 'bold' },
  avatar:        { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarText:    { color: '#FFF', fontWeight: '900', fontSize: 14 },
  greeting:      { fontSize: 14, marginTop: 4, marginBottom: 16 },
  chipScroll:    { flexGrow: 0 },
  chipRow:       { gap: 10, paddingRight: 24 },
  chip:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, gap: 6 },
  chipText:      { fontSize: 13, fontWeight: '700' },
  scroll:        { paddingHorizontal: 24 },
  sectionTitle:  { fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  kpiGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  kpiCard:       { width: '47%', borderRadius: 20, borderWidth: 1, padding: 16, gap: 8 },
  kpiIconBox:    { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  kpiValue:      { fontSize: 20, fontWeight: '900' },
  kpiLabel:      { fontSize: 11, fontWeight: '600' },
  lowStockRow:   { marginBottom: 8 },
  lowStockChip:  { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, marginRight: 10, minWidth: 90 },
  lowStockName:  { fontSize: 12, fontWeight: '800' },
  lowStockQty:   { fontSize: 10, fontWeight: '700', marginTop: 2 },
  saleRow:       { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8 },
  saleName:      { fontSize: 13, fontWeight: '700' },
  saleTime:      { fontSize: 11, marginTop: 2 },
  saleAmount:    { fontSize: 14, fontWeight: '900' },
  emptyText:     { fontSize: 13, fontStyle: 'italic', marginBottom: 12 },
});
