/**
 * src/presenter/screens/SalesScreen.tsx
 * Full rewrite — segmented date control, summary bar, FlatList with
 * RefreshControl, PDF receipt generation, SkeletonLoader, EmptyState.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, Modal, Alert, TextInput,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useStore }      from '../../domain/useStore';
import { Sale }          from '../../domain/models';
import { useAppTheme }   from '../../core/contexts/ThemeContext';
import { SkeletonCard }  from '../../core/components/SkeletonLoader';
import { EmptyState }    from '../../core/components/EmptyState';
import { Card }          from '../components/Card';
import { AppButton }     from '../components/AppButton';
import { FormLayout }    from '../components/FormLayout';
import { ProductPicker } from '../components/ProductPicker';
import { PDFService }    from '../../data/PDFService';
import { SaleSchema }    from '../../domain/validation';

type DateRange = 'today' | 'week' | 'month' | 'all';
const DATE_SEGMENTS: { key: DateRange; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all',   label: 'All Time' },
];

function filterByRange(sales: Sale[], range: DateRange): Sale[] {
  const now  = new Date();
  const today = now.toISOString().split('T')[0];
  if (range === 'today') return sales.filter(s => s.date.startsWith(today));
  if (range === 'week') {
    const start = new Date(now); start.setDate(start.getDate() - 6);
    return sales.filter(s => new Date(s.date) >= start);
  }
  if (range === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    return sales.filter(s => s.date >= start);
  }
  return sales;
}

export function SalesScreen() {
  const { sales, products, addSale, deleteSale, loading, refreshAll } = useStore();
  const { colors } = useAppTheme();

  const [range,          setRange]          = useState<DateRange>('week');
  const [refreshing,     setRefreshing]     = useState(false);
  const [modalVisible,   setModalVisible]   = useState(false);

  // New sale form
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [quantity,          setQuantity]          = useState('');
  const [sellPriceOverride, setSellPriceOverride] = useState('');
  const [dateInput,         setDateInput]         = useState(() => new Date().toISOString().split('T')[0]);

  const handleProductSelect = (id: number) => {
    const p = products.find(x => x.id === id);
    setSelectedProductId(id);
    if (p) setSellPriceOverride(p.sell_price.toString());
  };

  const handleSave = async () => {
    if (!selectedProductId || !quantity || !sellPriceOverride) {
      Alert.alert('Error', 'Please fill all fields.'); return;
    }
    try {
      const finalQty   = parseInt(quantity, 10);
      const finalPrice = parseFloat(sellPriceOverride);

      const result = SaleSchema.safeParse({
        product_id: selectedProductId, quantity: finalQty,
        sell_price: finalPrice, date: new Date(dateInput).toISOString(),
      });
      if (!result.success) { Alert.alert('Validation Error', result.error.issues[0]?.message || 'Invalid data'); return; }

      await addSale(selectedProductId, new Date(dateInput).toISOString(), finalQty, finalPrice);
      setModalVisible(false);
      setQuantity(''); setSelectedProductId(null); setSellPriceOverride('');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to record sale');
    }
  };

  const handleGenerateInvoice = async (sale: Sale) => {
    try {
      const settingsStr = await AsyncStorage.getItem('app_settings');
      const settings = settingsStr ? JSON.parse(settingsStr) : { storeName: 'My Store', currency: 'SSP' };
      await PDFService.generateInvoice(sale, settings);
    } catch { Alert.alert('Error', 'Failed to generate PDF'); }
  };

  const onRefresh = async () => { setRefreshing(true); await refreshAll(); setRefreshing(false); };

  const filtered = useMemo(() => filterByRange(
    [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    range
  ), [sales, range]);

  const todayTotal = useMemo(() => {
    const t = new Date().toISOString().split('T')[0];
    return sales.filter(s => s.date.startsWith(t)).reduce((sum, s) => sum + s.sell_price * s.quantity, 0);
  }, [sales]);

  const renderItem = ({ item }: { item: Sale }) => (
    <Card style={styles.saleCard}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.productName, { color: colors.text }]}>{item.product_name ?? 'Product'}</Text>
          <Text style={[styles.dateText, { color: colors.textMuted }]}>{new Date(item.date).toLocaleString()}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.totalPrice, { color: colors.primary }]}>SSP {(item.sell_price * item.quantity).toLocaleString()}</Text>
          <Text style={[styles.qtyText, { color: colors.textSecondary }]}>{item.quantity} × SSP {item.sell_price}</Text>
        </View>
      </View>
      <View style={[styles.actions, { borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleGenerateInvoice(item)}>
          <Feather name="file-text" size={14} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>Receipt</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => {
          Alert.alert('Delete Sale', 'Remove this sale record?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteSale(item.id) },
          ]);
        }}>
          <Feather name="trash-2" size={14} color={colors.error} />
          <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerAccent, { color: colors.primary }]}>REVENUE</Text>
          <Text style={[styles.title, { color: colors.text }]}>Sales</Text>
        </View>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => setModalVisible(true)}>
          <Feather name="plus" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Today's summary bar */}
      <View style={[styles.summaryBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Today's Revenue</Text>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>SSP {todayTotal.toLocaleString()}</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Transactions</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{filtered.length}</Text>
        </View>
      </View>

      {/* Date segmented control */}
      <View style={styles.segmentRow}>
        {DATE_SEGMENTS.map(seg => (
          <TouchableOpacity
            key={seg.key}
            onPress={() => setRange(seg.key)}
            style={[styles.segment, { borderColor: colors.border }, range === seg.key && { backgroundColor: colors.primary, borderColor: colors.primary }]}
          >
            <Text style={[styles.segmentText, { color: range === seg.key ? '#FFF' : colors.textSecondary }]}>{seg.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ padding: 24, gap: 12 }}><SkeletonCard /><SkeletonCard /><SkeletonCard /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={s => s.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="dollar-sign"
              title="No Sales Yet"
              subtitle="Tap '+ New Sale' to record your first transaction."
              actionLabel="Record Sale"
              onAction={() => setModalVisible(true)}
            />
          }
        />
      )}

      {/* New Sale modal */}
      <Modal visible={modalVisible} animationType="slide">
        <FormLayout contentContainerStyle={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>New Sale</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={{ color: colors.primary, fontWeight: '700' }}>Cancel</Text></TouchableOpacity>
          </View>

          <ProductPicker value={selectedProductId} onSelect={handleProductSelect} products={products} />

          <View style={[styles.row, { marginTop: 12 }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.textMuted }]}>QUANTITY</Text>
              <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} placeholder="0" placeholderTextColor={colors.textMuted} value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.textMuted }]}>PRICE / UNIT</Text>
              <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} placeholder="0.00" placeholderTextColor={colors.textMuted} value={sellPriceOverride} onChangeText={setSellPriceOverride} keyboardType="numeric" />
            </View>
          </View>

          {quantity && sellPriceOverride && (
            <View style={[styles.totalPreview, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
              <Text style={[styles.totalPreviewText, { color: colors.primary }]}>
                Total: SSP {(parseFloat(sellPriceOverride || '0') * parseInt(quantity || '0', 10)).toLocaleString()}
              </Text>
            </View>
          )}

          <Text style={[styles.label, { color: colors.textMuted }]}>DATE</Text>
          <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={dateInput} onChangeText={setDateInput} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} />

          <AppButton title="Confirm Transaction" onPress={handleSave} style={{ marginTop: 20 }} />
          <View style={{ height: 80 }} />
        </FormLayout>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1 },
  header:             { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerAccent:       { fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  title:              { fontSize: 26, fontWeight: '900' },
  addBtn:             { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  summaryBar:         { flexDirection: 'row', marginHorizontal: 24, borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  summaryItem:        { flex: 1, alignItems: 'center' },
  summaryLabel:       { fontSize: 10, fontWeight: '700', marginBottom: 4 },
  summaryValue:       { fontSize: 18, fontWeight: '900' },
  summaryDivider:     { width: 1, marginHorizontal: 12 },
  segmentRow:         { flexDirection: 'row', marginHorizontal: 24, gap: 8, marginBottom: 16 },
  segment:            { flex: 1, paddingVertical: 8, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  segmentText:        { fontSize: 11, fontWeight: '700' },
  list:               { paddingHorizontal: 24, paddingBottom: 100 },
  saleCard:           { marginBottom: 12, padding: 16 },
  cardHeader:         { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  productName:        { fontSize: 15, fontWeight: '800' },
  dateText:           { fontSize: 11, marginTop: 2 },
  totalPrice:         { fontSize: 16, fontWeight: '900' },
  qtyText:            { fontSize: 11, marginTop: 2 },
  actions:            { flexDirection: 'row', gap: 20, paddingTop: 12, borderTopWidth: 1 },
  actionBtn:          { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText:         { fontSize: 12, fontWeight: '700' },
  modalContent:       { padding: 24, paddingTop: 48 },
  modalHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle:         { fontSize: 20, fontWeight: '900' },
  label:              { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
  input:              { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginBottom: 12 },
  row:                { flexDirection: 'row', gap: 12 },
  totalPreview:       { borderRadius: 12, borderWidth: 1, padding: 14, alignItems: 'center', marginBottom: 16 },
  totalPreviewText:   { fontSize: 16, fontWeight: '900' },
});
