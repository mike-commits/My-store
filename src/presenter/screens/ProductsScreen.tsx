/**
 * src/presenter/screens/ProductsScreen.tsx
 * Full product list with search, category filter, StatusBadge stock levels,
 * loading skeletons, empty state, and add/edit modal.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, Alert,
  TouchableOpacity, Image, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useStore }      from '../../domain/useStore';
import { Product }       from '../../domain/models';
import { useAppTheme }   from '../../core/contexts/ThemeContext';
import { StatusBadge, BadgeStatus }   from '../../core/components/StatusBadge';
import { SkeletonCard }  from '../../core/components/SkeletonLoader';
import { EmptyState }    from '../../core/components/EmptyState';
import { Card }          from '../components/Card';
import { AppButton }     from '../components/AppButton';
import { SearchBar }     from '../components/SearchBar';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { ProductSchema } from '../../domain/validation';

const CATEGORIES = [
  'All', 'Shoes (Men)', 'Shoes (Women)', 'Shoes (Kids)',
  'Clothing (Men)', 'Clothing (Women)', 'Clothing (Kids)',
  'Jewelry', 'Accessories', 'Others',
];

function qtyStatus(qty: number): BadgeStatus {
  if (qty === 0) return 'danger';
  if (qty <= 10) return 'warning';
  return 'success';
}

export function ProductsScreen() {
  const { products, addProduct, updateProduct, deleteProduct, loading, refreshAll } = useStore();
  const { colors } = useAppTheme();
  const navigation = useNavigation<any>();

  const [scannerVisible, setScannerVisible] = useState(false);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [selectedCat,    setSelectedCat]    = useState('All');
  const [refreshing,     setRefreshing]     = useState(false);

  const handleDelete = (id: number) => {
    Alert.alert('Delete', 'Delete this product and all its records?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteProduct(id) },
    ]);
  };

  const onRefresh = async () => { setRefreshing(true); await refreshAll(); setRefreshing(false); };

  const filtered = useMemo(() =>
    products.filter(p => {
      const q = searchQuery.toLowerCase();
      return (p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)) &&
             (selectedCat === 'All' || p.category === selectedCat);
    }).sort((a, b) => b.id - a.id),
    [products, searchQuery, selectedCat]
  );

  const renderItem = ({ item }: { item: Product }) => (
    <Card style={styles.productCard} onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}>
      <View style={styles.cardRow}>
        {(item as any).image_url
          ? <Image source={{ uri: (item as any).image_url }} style={styles.productImage} />
          : <View style={[styles.imgPlaceholder, { backgroundColor: colors.border }]}><Feather name="image" size={20} color={colors.textMuted} /></View>
        }
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.productName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.categoryText, { color: colors.textMuted }]}>{item.category}</Text>
          <Text style={[styles.priceText, { color: colors.primary }]}>SSP {item.sell_price.toLocaleString()}</Text>
        </View>
        <View style={styles.cardRight}>
          <StatusBadge status={qtyStatus(item.quantity)} label={`${item.quantity}`} size="sm" />
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => navigation.navigate('ProductForm', { productId: item.id })} style={styles.cardActionBtn}><Feather name="edit-2" size={14} color={colors.primary} /></TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.cardActionBtn}><Feather name="trash-2" size={14} color={colors.error} /></TouchableOpacity>
          </View>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View><Text style={[styles.headerAccent, { color: colors.primary }]}>INVENTORY</Text>
        <Text style={[styles.title, { color: colors.text }]}>Products</Text></View>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('ProductForm')}>
          <Feather name="plus" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <SearchBar value={searchQuery} onChangeText={setSearchQuery} onBarcodePress={() => setScannerVisible(true)} />

      <FlatList
        horizontal showsHorizontalScrollIndicator={false} data={CATEGORIES} keyExtractor={i => i}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelectedCat(item)}
            style={[styles.chip, { borderColor: colors.border }, selectedCat === item ? { backgroundColor: colors.primary } : { backgroundColor: colors.surface }]}>
            <Text style={[styles.chipText, { color: selectedCat === item ? '#FFF' : colors.textSecondary }]}>{item}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.chipBar} style={{ marginBottom: 16 }}
      />

      {loading ? (
        <View style={{ padding: 24, gap: 12 }}>{[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}</View>
      ) : (
        <FlatList
          data={filtered} keyExtractor={p => p.id.toString()} renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState icon="box"
              title={searchQuery ? 'No Matches' : 'Empty Inventory'}
              subtitle={searchQuery ? 'Try a different search term.' : 'Add your first product to get started.'}
              actionLabel={searchQuery ? 'Clear Search' : 'Add Product'}
              onAction={() => searchQuery ? setSearchQuery('') : setModalVisible(true)}
            />
          }
        />
      )}

      <BarcodeScannerModal visible={scannerVisible} onClose={() => setScannerVisible(false)} onScan={d => { setSearchQuery(d); setScannerVisible(false); }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerAccent: { fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '900' },
  addBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  chipBar: { paddingHorizontal: 24 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginRight: 8, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '700' },
  list: { paddingHorizontal: 24, paddingBottom: 100 },
  productCard: { marginBottom: 12, padding: 12 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  productImage: { width: 58, height: 58, borderRadius: 12 },
  imgPlaceholder: { width: 58, height: 58, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  productName: { fontSize: 14, fontWeight: '800' },
  categoryText: { fontSize: 11, marginTop: 2 },
  priceText: { fontSize: 13, fontWeight: '900', marginTop: 4 },
  cardRight: { alignItems: 'flex-end', gap: 8 },
  cardActions: { flexDirection: 'row', gap: 8 },
  cardActionBtn: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
});
