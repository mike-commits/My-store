import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Modal, Alert, TextInput,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { useStore }      from '../../domain/useStore';
import { Shipment }      from '../../domain/models';
import { useAppTheme }   from '../../core/contexts/ThemeContext';
import { useSupabaseQuery } from '../../core/hooks/useSupabaseQuery';
import { supabase }      from '../../data/supabase';
import { SkeletonCard }  from '../../core/components/SkeletonCard';
import { EmptyState }    from '../../core/components/EmptyState';
import { Card }          from '../components/Card';
import { AppButton }     from '../components/AppButton';
import { FormLayout }    from '../components/FormLayout';
import { ShipmentSchema } from '../../domain/validation';

function statusColor(status: string) {
  if (status === 'shipped') return '#D97706';
  if (status === 'delivered') return '#16A34A';
  return '#6B7280';
}

export function ShipmentsScreen() {
  const { addShipment, updateShipmentStatus, deleteShipment } = useStore();
  const { colors } = useAppTheme();

  const { data: shipmentsData, loading, error, refetch } = useSupabaseQuery<Shipment[]>(async () => {
    const { data, error } = await supabase.from('shipments').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  });
  
  const shipments = shipmentsData || [];

  const [modalVisible, setModalVisible] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [totalCost,    setTotalCost]    = useState('');
  const [shipDate,     setShipDate]     = useState(() => new Date().toISOString().split('T')[0]);

  const handleSave = async () => {
    if (!supplierName || !totalCost) { Alert.alert('Error', 'Supplier and cost required.'); return; }
    try {
      const cost = parseFloat(totalCost);
      const res = ShipmentSchema.safeParse({ supplier_name: supplierName, total_cost: cost, status: 'shipped', date: new Date(shipDate).toISOString() });
      if (!res.success) { Alert.alert('Error', 'Invalid data'); return; }

      await addShipment(supplierName, cost, new Date(shipDate).toISOString(), 'shipped');
      await refetch();
      setModalVisible(false); setSupplierName(''); setTotalCost('');
    } catch (e: unknown) { Alert.alert('Error', 'Failed to add shipment'); }
  };

  const renderItem = ({ item }: { item: Shipment }) => (
    <Card style={styles.shipCard}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.supplierName, { color: colors.text }]}>{item.supplier_name}</Text>
        <Text style={[styles.dateText, { color: colors.textMuted }]}>{new Date(item.date).toLocaleDateString()}</Text>
        <Text style={[styles.costText, { color: colors.primary }]}>SSP {(item.total_cost ?? 0).toLocaleString()}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 12 }}>
        <TouchableOpacity
          style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '15', borderColor: statusColor(item.status) }]}
          onPress={() => {
            const next = item.status === 'shipped' ? 'delivered' : 'shipped';
            updateShipmentStatus(item.id, next).then(() => refetch());
          }}
        >
          <Text style={[styles.statusText, { color: statusColor(item.status) }]}>{item.status.toUpperCase()}</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => {
            setSupplierName(item.supplier_name || '');
            setTotalCost((item.total_cost ?? 0).toString());
            setShipDate(item.date.split('T')[0]);
            setModalVisible(true);
            // In a full implementation, we'd set an editingId here
            Alert.alert('Edit', 'Edit mode active. Save to update (Note: this adds a new record for now in this preview).');
          }}>
            <Feather name="edit-2" size={14} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Delete', 'Delete?', [{text:'Cancel'},{text:'Delete', onPress: async () => { await deleteShipment(item.id); refetch(); }}])}>
            <Feather name="trash-2" size={14} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerAccent, { color: colors.primary }]}>LOGISTICS</Text>
          <Text style={[styles.title, { color: colors.text }]}>Shipments</Text>
        </View>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => setModalVisible(true)}>
          <Feather name="plus" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading && !shipmentsData ? (
        <View style={{ padding: 24, gap: 12 }}>{[1,2,3,4].map(i => <SkeletonCard key={i} height={100} />)}</View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={{ color: colors.error }}>{error}</Text>
          <TouchableOpacity onPress={refetch} style={[styles.retryBtn, { borderColor: colors.border }]}><Text style={{ color: colors.text }}>Retry</Text></TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={shipments}
          keyExtractor={s => s.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="truck"
              title="No shipments"
              subtitle="Track your incoming orders and stock deliveries."
              actionLabel="Add shipment"
              onAction={() => setModalVisible(true)}
            />
          }
        />
      )}

      <Modal visible={modalVisible} animationType="slide">
        <FormLayout contentContainerStyle={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>New Shipment</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={{ color: colors.primary, fontWeight: '700' }}>Cancel</Text></TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: colors.textMuted }]}>SUPPLIER / VENDOR</Text>
          <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={supplierName} onChangeText={setSupplierName} placeholder="e.g. Acme Corp" placeholderTextColor={colors.textMuted} />

          <Text style={[styles.label, { color: colors.textMuted }]}>TOTAL COST (SSP)</Text>
          <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={totalCost} onChangeText={setTotalCost} keyboardType="numeric" placeholder="0.00" placeholderTextColor={colors.textMuted} />

          <Text style={[styles.label, { color: colors.textMuted }]}>EXPECTED DATE</Text>
          <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={shipDate} onChangeText={setShipDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} />

          <AppButton title="Create Shipment" onPress={handleSave} style={{ marginTop: 20 }} />
        </FormLayout>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1 },
  header:        { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerAccent:  { fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  title:         { fontSize: 26, fontWeight: '900' },
  addBtn:        { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  list:          { paddingHorizontal: 24, paddingBottom: 100 },
  shipCard:      { flexDirection: 'row', padding: 16, marginBottom: 12, alignItems: 'center' },
  supplierName:  { fontSize: 16, fontWeight: '800' },
  dateText:      { fontSize: 12, marginTop: 4 },
  costText:      { fontSize: 14, fontWeight: '900', marginTop: 8 },
  statusBadge:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  statusText:    { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  retryBtn:      { marginTop: 12, padding: 10, borderWidth: 1, borderRadius: 8 },
  modalContent:  { padding: 24, paddingTop: 48 },
  modalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle:    { fontSize: 20, fontWeight: '900' },
  label:         { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
  input:         { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginBottom: 16 },
});
