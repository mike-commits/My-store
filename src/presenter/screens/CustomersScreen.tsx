import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, Alert,
  TouchableOpacity, Modal, TextInput, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { useStore }      from '../../domain/useStore';
import { Customer }      from '../../domain/models';
import { useAppTheme }   from '../../core/contexts/ThemeContext';
import { SkeletonCard }  from '../../core/components/SkeletonLoader';
import { EmptyState }    from '../../core/components/EmptyState';
import { Card }          from '../components/Card';
import { AppButton }     from '../components/AppButton';
import { FormLayout }    from '../components/FormLayout';
import { SearchBar }     from '../components/SearchBar';

export function CustomersScreen() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, loading, refreshAll } = useStore();
  const { colors, isDark } = useAppTheme();

  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setEditingId(null); setName(''); setPhone('');
    setEmail(''); setAddress(''); setNotes('');
  };

  const handleEdit = (c: Customer) => {
    setEditingId(c.id); setName(c.name); setPhone(c.phone || '');
    setEmail(c.email || ''); setAddress(c.address || '');
    setNotes(c.notes || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name) { Alert.alert('Error', 'Name is required'); return; }
    try {
      const data = { name, phone, email, address, notes };
      if (editingId) await updateCustomer(editingId, data);
      else await addCustomer(data);
      setModalVisible(false); resetForm();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save');
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete', 'Delete this customer and all their history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCustomer(id) },
    ]);
  };

  const onRefresh = async () => { setRefreshing(true); await refreshAll(); setRefreshing(false); };

  const filtered = useMemo(() =>
    customers.filter(c => {
      const q = searchQuery.toLowerCase();
      return c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)) || (c.email && c.email.toLowerCase().includes(q));
    }),
    [customers, searchQuery]
  );

  const renderItem = ({ item }: { item: Customer }) => (
    <Card style={styles.card}>
      <View style={styles.cardRow}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
          {item.phone && <Text style={[styles.subText, { color: colors.textSecondary }]}><Feather name="phone" size={12} /> {item.phone}</Text>}
          {item.email && <Text style={[styles.subText, { color: colors.textSecondary }]}><Feather name="mail" size={12} /> {item.email}</Text>}
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}><Feather name="edit-2" size={16} color={colors.primary} /></TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}><Feather name="trash-2" size={16} color={colors.error} /></TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerAccent, { color: colors.primary }]}>CRM</Text>
          <Text style={[styles.title, { color: colors.text }]}>Customers</Text>
        </View>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => { resetForm(); setModalVisible(true); }}>
          <Feather name="plus" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search customers..." />

      <FlatList
        data={loading ? [1,2,3,4,5] : filtered}
        keyExtractor={(item, index) => (typeof item === 'number' ? index.toString() : item.id.toString())}
        renderItem={loading ? () => <SkeletonCard /> : renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={!loading && <EmptyState icon="users" title="No customers found" message="Add your first customer to track their purchase history." />}
      />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <FormLayout contentContainerStyle={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{editingId ? 'Edit Customer' : 'New Customer'}</Text>
            <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}><Text style={{ color: colors.primary, fontWeight: '700' }}>Cancel</Text></TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: colors.textMuted }]}>BASIC INFO</Text>
          <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} placeholder="Full Name" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />
          <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} placeholder="Phone Number" placeholderTextColor={colors.textMuted} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} placeholder="Email Address" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          
          <Text style={[styles.label, { color: colors.textMuted, marginTop: 12 }]}>ADDITIONAL DETAILS</Text>
          <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} placeholder="Address" placeholderTextColor={colors.textMuted} value={address} onChangeText={setAddress} multiline />
          <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text, height: 100 }]} placeholder="Notes" placeholderTextColor={colors.textMuted} value={notes} onChangeText={setNotes} multiline />

          <AppButton title={editingId ? "Update Customer" : "Add Customer"} onPress={handleSave} style={{ marginTop: 24 }} />
          <View style={{ height: 100 }} />
        </FormLayout>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerAccent: { fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '900' },
  addBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 24, paddingBottom: 120 },
  card: { marginBottom: 12, padding: 16 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '900' },
  name: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  subText: { fontSize: 12, marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  modalContent: { padding: 24, paddingTop: 48 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  modalTitle: { fontSize: 24, fontWeight: '900' },
  label: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 12 },
  input: { height: 54, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, fontSize: 16 },
});
