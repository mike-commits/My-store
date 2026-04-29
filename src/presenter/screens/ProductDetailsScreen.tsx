import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useStore }    from '../../domain/useStore';
import { useAppTheme } from '../../core/contexts/ThemeContext';
import { Card }        from '../components/Card';
import { StockBadge }  from '../../core/components/StockBadge';

export function ProductDetailsScreen() {
  const { products, sales } = useStore();
  const { colors, isDark } = useAppTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const productId = route.params?.productId;

  const product = useMemo(() => products.find(p => p.id === productId), [products, productId]);

  const productSales = useMemo(() => 
    sales.filter(s => s.product_id === productId)
         .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  [sales, productId]);

  const totalSold = productSales.reduce((acc, s) => acc + s.quantity, 0);

  if (!product) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text }}>Product not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { borderColor: colors.border }]}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('ProductForm', { productId })} style={[styles.editBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Feather name="edit-2" size={16} color={colors.primary} />
          <Text style={[styles.editBtnText, { color: colors.primary }]}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.heroSection}>
          <View style={[styles.imagePlaceholder, { backgroundColor: isDark ? colors.surface : colors.border }]}>
            <Feather name="image" size={48} color={colors.textMuted} />
          </View>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
              <Text style={[styles.category, { color: colors.textSecondary }]}>{product.category}</Text>
            </View>
            <StockBadge qty={product.quantity} />
          </View>
        </View>

        <Card style={styles.pricingCard}>
          <View style={styles.priceRow}>
            <View style={styles.priceItem}>
              <Text style={[styles.priceLabel, { color: colors.textMuted }]}>Selling Price</Text>
              <Text style={[styles.priceValue, { color: colors.primary }]}>SSP {product.sell_price.toLocaleString()}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.priceItem}>
              <Text style={[styles.priceLabel, { color: colors.textMuted }]}>Cost Price</Text>
              <Text style={[styles.priceValue, { color: colors.text }]}>SSP {product.buy_price.toLocaleString()}</Text>
            </View>
          </View>
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Sales History</Text>
        {productSales.length === 0 ? (
          <Text style={{ color: colors.textMuted, fontStyle: 'italic' }}>No sales recorded for this item.</Text>
        ) : (
          <View style={{ gap: 8 }}>
            {productSales.slice(0, 10).map(s => (
              <View key={s.id} style={[styles.saleRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View>
                  <Text style={[styles.saleDate, { color: colors.text }]}>{new Date(s.date).toLocaleDateString()}</Text>
                  <Text style={[styles.saleQty, { color: colors.textSecondary }]}>{s.quantity} units</Text>
                </View>
                <Text style={[styles.saleTotal, { color: colors.success }]}>
                  + SSP {(s.quantity * s.sell_price).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1 },
  header:           { flexDirection: 'row', justifyContent: 'space-between', padding: 24, paddingBottom: 12 },
  backBtn:          { width: 44, height: 44, borderRadius: 22, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  editBtn:          { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1 },
  editBtnText:      { fontWeight: '700', fontSize: 13 },
  scroll:           { paddingHorizontal: 24, paddingBottom: 60 },
  heroSection:      { marginBottom: 24 },
  imagePlaceholder: { height: 220, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  titleRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  productName:      { fontSize: 24, fontWeight: '900', marginBottom: 4 },
  category:         { fontSize: 14, fontWeight: '600' },
  pricingCard:      { padding: 20, borderRadius: 20, marginBottom: 32 },
  priceRow:         { flexDirection: 'row', alignItems: 'center' },
  priceItem:        { flex: 1, alignItems: 'center' },
  priceLabel:       { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },
  priceValue:       { fontSize: 18, fontWeight: '900' },
  divider:          { width: 1, height: 40 },
  sectionTitle:     { fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  saleRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1 },
  saleDate:         { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  saleQty:          { fontSize: 12 },
  saleTotal:        { fontSize: 15, fontWeight: '900' },
});
