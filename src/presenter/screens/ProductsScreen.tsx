import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useBottomTabPadding } from '../../core/hooks/useBottomTabPadding';

import { useAppTheme }   from '../../core/contexts/ThemeContext';
import { useStore }      from '../../domain/useStore';
import { supabase } from '../../data/supabase';
import { SkeletonCard } from '../../core/components/SkeletonCard';
import { EmptyState } from '../../core/components/EmptyState';
import { StockBadge } from '../../core/components/StockBadge';
import { Product } from '../../domain/models';

type SortOption = 'nameAsc' | 'priceDesc' | 'stockAsc';

export function ProductsScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation<any>();
  const { products, loading, error, refreshAll } = useStore();
  const bottomPad = useBottomTabPadding();

  const [filterModal, setFilterModal] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('nameAsc');
  const [stockFilter, setStockFilter] = useState<'all' | 'inStock' | 'lowStock' | 'outOfStock'>('all');

  // Sort & Filter logic
  const processedProducts = useMemo(() => {
    let list = [...(products || [])];

    if (stockFilter === 'inStock') list = list.filter(p => p.quantity > 10);
    if (stockFilter === 'lowStock') list = list.filter(p => p.quantity > 0 && p.quantity <= 10);
    if (stockFilter === 'outOfStock') list = list.filter(p => p.quantity === 0);

    list.sort((a, b) => {
      if (sortOption === 'nameAsc') return a.name.localeCompare(b.name);
      if (sortOption === 'priceDesc') return b.sell_price - a.sell_price;
      if (sortOption === 'stockAsc') return a.quantity - b.quantity;
      return 0;
    });

    return list;
  }, [products, sortOption, stockFilter]);

  const activeFilters = (stockFilter !== 'all' ? 1 : 0);

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
    >
      <View style={styles.cardInfo}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.cardPrice, { color: colors.primary }]}>SSP {item.sell_price.toLocaleString()}</Text>
        <StockBadge qty={item.quantity} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity 
          style={[styles.sellBtn, { backgroundColor: colors.success + '20', borderColor: colors.success }]}
          onPress={() => navigation.navigate('Sales', { preSelectedId: item.id })}
        >
          <Feather name="shopping-cart" size={16} color={colors.success} />
          <Text style={{ color: colors.success, fontWeight: '700', fontSize: 12 }}>Sell</Text>
        </TouchableOpacity>
        <Feather name="chevron-right" size={20} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Products</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setFilterModal(true)}
          >
            <Feather name="sliders" size={20} color={colors.text} />
            {activeFilters > 0 && (
              <View style={[styles.badgeContainer, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{activeFilters}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('ProductForm')}
          >
            <Feather name="plus" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {loading && !products ? (
        <View style={styles.list}>
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} height={90} style={{ marginBottom: 12 }} />)}
        </View>
      ) : error ? ( 
        <View style={styles.center}>
          <Text style={{ color: colors.error, textAlign: 'center', marginBottom: 8 }}>{error}</Text>
          <TouchableOpacity onPress={refreshAll} style={[styles.retryBtn, { borderColor: colors.border }]}><Text style={{ color: colors.text }}>Retry</Text></TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={processedProducts}
          keyExtractor={item => item.id.toString()}
          renderItem={renderProduct}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad }]}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refreshAll} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="box"
              title="No products yet"
              subtitle="Start building your inventory to track sales and stock."
              actionLabel="Add Product"
              onAction={() => navigation.navigate('ProductForm')}
            />
          }
        />
      )}

      {/* Filter Bottom Sheet */}
      <Modal visible={filterModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Sort & Filter</Text>
              <TouchableOpacity onPress={() => setFilterModal(false)}>
                <Feather name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.filterLabel, { color: colors.textMuted }]}>SORT BY</Text>
            <View style={styles.filterRow}>
              {[
                { key: 'nameAsc', label: 'Name A-Z' },
                { key: 'priceDesc', label: 'Price High-Low' },
                { key: 'stockAsc', label: 'Stock Low-High' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.filterChip, { borderColor: colors.border, backgroundColor: sortOption === opt.key ? colors.primary + '20' : 'transparent' }]}
                  onPress={() => setSortOption(opt.key as SortOption)}
                >
                  <Text style={{ color: sortOption === opt.key ? colors.primary : colors.text, fontWeight: '600' }}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.filterLabel, { color: colors.textMuted }]}>STOCK STATUS</Text>
            <View style={styles.filterRow}>
              {[
                { key: 'all', label: 'All' },
                { key: 'inStock', label: 'In Stock' },
                { key: 'lowStock', label: 'Low Stock' },
                { key: 'outOfStock', label: 'Out of Stock' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.filterChip, { borderColor: colors.border, backgroundColor: stockFilter === opt.key ? colors.primary + '20' : 'transparent' }]}
                  onPress={() => setStockFilter(opt.key as any)}
                >
                  <Text style={{ color: stockFilter === opt.key ? colors.primary : colors.text, fontWeight: '600' }}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity style={[styles.applyBtn, { backgroundColor: colors.primary }]} onPress={() => setFilterModal(false)}>
              <Text style={styles.applyBtnText}>Apply Options</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 16 },
  title: { fontSize: 26, fontWeight: '900' },
  iconBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  badgeContainer: { position: 'absolute', top: -4, right: -4, borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  addBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 24, paddingTop: 8 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  cardInfo: { flex: 1, gap: 6 },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardPrice: { fontSize: 14, fontWeight: '800' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  retryBtn: { marginTop: 12, padding: 10, borderWidth: 1, borderRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 300 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  filterLabel: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12, marginTop: 16 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  applyBtn: { marginTop: 32, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  applyBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  sellBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 }
});
