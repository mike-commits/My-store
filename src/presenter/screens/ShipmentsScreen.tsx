/**
 * src/presenter/screens/ShipmentsScreen.tsx
 * Full rewrite — status filter tabs (All/Pending/In Transit/Delivered),
 * FlatList with RefreshControl, status badges, skeleton loaders, empty state.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, Modal, Alert, TextInput,
  TouchableOpacity, ScrollView, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { useStore }     from '../../domain/useStore';
import { Shipment, ShipmentItem } from '../../domain/models';
import { useAppTheme }  from '../../core/contexts/ThemeContext';
import { StatusBadge, BadgeStatus }  from '../../core/components/StatusBadge';
import { SkeletonCard } from '../../core/components/SkeletonLoader';
import { EmptyState }   from '../../core/components/EmptyState';
import { Card }         from '../components/Card';
import { AppButton }    from '../components/AppButton';
import { FormLayout }   from '../components/FormLayout';

type StatusFilter = 'All' | 'pending' | 'in_transit' | 'delivered';

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'All',        label: 'All' },
  { key: 'pending',    label: 'Pending' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'delivered',  label: 'Delivered' },
];

function badgeForStatus(status: string): BadgeStatus {
  if (status === 'delivered')  return 'success';
  if (status === 'in_transit') return 'info';
  if (status === 'pending')    return 'warning';
  return 'neutral';
}

export function ShipmentsScreen() {
  const { shipments, products, addShipment, deleteShipment, loading, refreshAll } = useStore();
  const { colors } = useAppTheme();

  const [activeTab,    setActiveTab]    = useState<StatusFilter>('All');
  const [refreshing,   setRefreshing]   = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Form state
  const [description,        setDescription]        = useState('');
  const [weightKg,           setWeightKg]           = useState('');
  const [amount,             setAmount]             = useState('');
  const [selectedProductId,  setSelectedProductId]  = useState<number | null>(null);
  const [quantity,           setQuantity]           = useState('');
  const [shipUnit,           setShipUnit]           = useState<'pcs' | 'doz'>('pcs');
  const [dateInput,          setDateInput]          = useState(() => new Date().toISOString().split('T')[0]);

  const resetForm = () => {
    setDescription(''); setWeightKg(''); setAmount('');
    setSelectedProductId(null); setQuantity(''); setShipUnit('pcs');
    setDateInput(new Date().toISOString().split('T')[0]);
  };

  const handleSave = async () => {
    if (!description && !selectedProductId) {
      Alert.alert('Error', 'Please fill in shipment details.');
      return;
    }
    try {
      let finalQty = parseInt(quantity, 10) || 0;
      if (shipUnit === 'doz') finalQty *= 12;
      const items = selectedProductId ? [{ product_id: selectedProductId, quantity: finalQty }] : [];
      await addShipment(new Date(dateInput).toISOString(), 'pending', items, parseFloat(amount) || 0, description, parseFloat(weightKg) || 0);
      setModalVisible(false);
      resetForm();
      Alert.alert('Success', 'Shipment logged.');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save');
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Remove', 'Remove this shipment log?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteShipment(id) },
    ]);
  };

  const onRefresh = async () => { setRefreshing(true); await refreshAll(); setRefreshing(false); };

  const filtered = useMemo(() =>
    shipments.filter(s => activeTab === 'All' || s.status === activeTab),
    [shipments, activeTab]
  );

  const renderItem = ({ item }: { item: Shipment }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{item.description || `Shipment #${item.id}`}</Text>
          <Text style={[styles.cardDate, { color: colors.textMuted }]}>{new Date(item.date).toLocaleDateString()}</Text>
        </View>
        <StatusBadge status={badgeForStatus(item.status)} label={item.status.replace('_', ' ')} size="sm" />
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Weight</Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>{item.weight_kg ?? 0} kg</Text>
        </View>
        <View style={styles.metric}>
          <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Cost</Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>SSP {(item.shipping_cost ?? 0).toLocaleString()}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Items</Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>{item.items?.length ?? 0}</Text>
        </View>
      </View>

      {item.items && item.items.length > 0 && (
        <View style={[styles.itemsList, { borderTopColor: colors.border }]}>
          {item.items.map((it, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={[styles.itemName, { color: colors.textSecondary }]}>{it.product_name ?? `Product #${it.product_id}`}</Text>
              <Text style={[styles.itemQty, { color: colors.primary }]}>+{it.quantity} units</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
        <Feather name="trash-2" size={13} color={colors.error} />
        <Text style={[styles.deleteBtnText, { color: colors.error }]}>Remove</Text>
      </TouchableOpacity>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerAccent, { color: colors.primary }]}>LOGISTICS</Text>
          <Text style={[styles.title, { color: colors.text }]}>Shipments</Text>
        </View>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => setModalVisible(true)}>
          <Feather name="plus" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Status tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsBar} contentContainerStyle={styles.tabsContent}>
        {STATUS_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, { borderColor: colors.border }, activeTab === tab.key && { backgroundColor: colors.primary, borderColor: colors.primary }]}
          >
            <Text style={[styles.tabText, { color: activeTab === tab.key ? '#FFF' : colors.textSecondary }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={{ padding: 24, gap: 12 }}>
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={s => s.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="truck"
              title="No Shipments"
              subtitle={activeTab === 'All' ? 'Log incoming inventory shipments here.' : `No ${activeTab.replace('_', ' ')} shipments.`}
              actionLabel="Log Shipment"
              onAction={() => setModalVisible(true)}
            />
          }
        />
      )}

      {/* Add modal */}
      <Modal visible={modalVisible} animationType="slide">
        <FormLayout contentContainerStyle={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Log Shipment</Text>
            <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: colors.textMuted }]}>DESCRIPTION</Text>
          <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} placeholder="e.g. New stock from Dubai" placeholderTextColor={colors.textMuted} value={description} onChangeText={setDescription} />

          <View style={styles.row}>
            <TextInput style={[styles.input, { flex: 1, borderColor: colors.border, color: colors.text }]} placeholder="Weight (kg)" placeholderTextColor={colors.textMuted} value={weightKg} onChangeText={setWeightKg} keyboardType="numeric" />
            <TextInput style={[styles.input, { flex: 1, borderColor: colors.border, color: colors.text }]} placeholder="Shipping Cost" placeholderTextColor={colors.textMuted} value={amount} onChangeText={setAmount} keyboardType="numeric" />
          </View>

          <Text style={[styles.label, { color: colors.textMuted }]}>DATE</Text>
          <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} value={dateInput} onChangeText={setDateInput} />

          <Text style={[styles.label, { color: colors.textMuted, marginTop: 8 }]}>INVENTORY SYNC (OPTIONAL)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {products.map(p => (
              <TouchableOpacity
                key={p.id}
                onPress={() => setSelectedProductId(selectedProductId === p.id ? null : p.id)}
                style={[styles.productChip, { borderColor: colors.border }, selectedProductId === p.id && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              >
                <Text style={{ color: selectedProductId === p.id ? '#FFF' : colors.textSecondary, fontSize: 12, fontWeight: '700' }}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {selectedProductId && (
            <View style={styles.row}>
              <TextInput style={[styles.input, { flex: 1, borderColor: colors.border, color: colors.text }]} placeholder="Qty to Add" placeholderTextColor={colors.textMuted} value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
              <View style={[styles.unitToggle, { backgroundColor: colors.background }]}>
                {(['pcs', 'doz'] as const).map(u => (
                  <TouchableOpacity key={u} onPress={() => setShipUnit(u)} style={[styles.unitBtn, shipUnit === u && { backgroundColor: colors.primary }]}>
                    <Text style={{ color: shipUnit === u ? '#FFF' : colors.textMuted, fontWeight: '700', fontSize: 12 }}>{u.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <AppButton title="Confirm Shipment" onPress={handleSave} style={{ marginTop: 20 }} />
          <View style={{ height: 80 }} />
        </FormLayout>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header:       { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerAccent: { fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  title:        { fontSize: 26, fontWeight: '900' },
  addBtn:       { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  tabsBar:      { maxHeight: 52 },
  tabsContent:  { paddingHorizontal: 24, gap: 10, alignItems: 'center', paddingBottom: 8 },
  tab:          { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  tabText:      { fontSize: 13, fontWeight: '700' },
  list:         { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 100 },
  card:         { marginBottom: 16, padding: 16 },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTitle:    { fontSize: 15, fontWeight: '800' },
  cardDate:     { fontSize: 12, marginTop: 2 },
  metricsRow:   { flexDirection: 'row', gap: 16 },
  metric:       { flex: 1 },
  metricLabel:  { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  metricValue:  { fontSize: 14, fontWeight: '800' },
  itemsList:    { marginTop: 14, paddingTop: 12, borderTopWidth: 1, gap: 4 },
  itemRow:      { flexDirection: 'row', justifyContent: 'space-between' },
  itemName:     { fontSize: 13, fontWeight: '600' },
  itemQty:      { fontSize: 13, fontWeight: '900' },
  deleteBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 14, alignSelf: 'flex-end' },
  deleteBtnText:{ fontSize: 12, fontWeight: '700' },
  modalContent: { padding: 24, paddingTop: 48 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle:   { fontSize: 20, fontWeight: '900' },
  label:        { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
  input:        { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginBottom: 12 },
  row:          { flexDirection: 'row', gap: 12 },
  productChip:  { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  unitToggle:   { flexDirection: 'row', borderRadius: 12, padding: 4, height: 50, flex: 1 },
  unitBtn:      { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
});
