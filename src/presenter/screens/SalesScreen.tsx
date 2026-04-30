import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Modal, Alert, TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useStore }      from '../../domain/useStore';
import { Product }       from '../../domain/models';
import { useAppTheme }   from '../../core/contexts/ThemeContext';
import { EmptyState }    from '../../core/components/EmptyState';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { AppButton }     from '../components/AppButton';

// Proper POS Cart Redesign!
interface CartItem {
  product: Product;
  quantity: number;
}
export function SalesScreen() {
  const { products, addSale } = useStore();
  const { colors } = useAppTheme();
  const route = useRoute<any>();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [scannerVisible, setScannerVisible] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState(false);

  // Cart Management
  const addToCart = (product: Product) => {
    if (product.quantity <= 0) {
      Alert.alert('Out of Stock', 'Cannot add out of stock items.');
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          Alert.alert('Limit Reached', 'Not enough stock available.');
          return prev;
        }
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  // Handle pre-selection
  useEffect(() => {
    const preId = route.params?.preSelectedId;
    if (preId) {
      const p = products.find(prod => prod.id === preId);
      if (p) addToCart(p);
    }
  }, [route.params?.preSelectedId, products]);

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null; // Marked for removal
          if (newQty > item.product.quantity) {
             Alert.alert('Limit Reached', 'Not enough stock available.');
             return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      const dateIso = new Date().toISOString();
      // Process each item as a sale (since addSale currently accepts one product)
      for (const item of cart) {
        await addSale(item.product.id, dateIso, item.quantity, item.product.sell_price);
      }
      setCart([]);
      setCheckoutModal(false);
      Alert.alert('Success', 'Sale processed successfully!');
    } catch (err: any) {
      Alert.alert('Checkout Failed', err.message);
    }
  };

  const handleScan = (data: string) => {
    setScannerVisible(false);
    // Dummy scan logic: search product name or barcode if added
    const matched = products.find(p => p.name.toLowerCase().includes(data.toLowerCase()));
    if (matched) {
      addToCart(matched);
    } else {
      Alert.alert('Not Found', `No product matched barcode: ${data}`);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.sell_price * item.quantity), 0);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerAccent, { color: colors.primary }]}>POS TERMINAL</Text>
          <Text style={[styles.title, { color: colors.text }]}>New Sale</Text>
        </View>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setScannerVisible(true)}>
          <Feather name="maximize" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.mainLayout}>
        {/* Left/Top side: Product Picker */}
        <View style={styles.productSection}>
          <TextInput
            style={[styles.searchInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
            placeholder="Search products..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <FlatList
            data={filteredProducts}
            keyExtractor={p => p.id.toString()}
            numColumns={2}
            columnWrapperStyle={{ gap: 12 }}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.productCard, { backgroundColor: colors.surface, borderColor: colors.border, opacity: item.quantity === 0 ? 0.5 : 1 }]}
                onPress={() => addToCart(item)}
              >
                <Text style={[styles.pName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
                <Text style={[styles.pPrice, { color: colors.primary }]}>SSP {item.sell_price}</Text>
                <Text style={[styles.pStock, { color: colors.textMuted }]}>{item.quantity} in stock</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<EmptyState icon="box" title="No products" subtitle="Add inventory to start selling." />}
          />
        </View>

        {/* Floating Cart Button (Mobile view) */}
        {cart.length > 0 && (
          <View style={[styles.floatingCart, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cartSummaryText, { color: colors.textMuted }]}>{cart.length} items</Text>
              <Text style={[styles.cartSummaryTotal, { color: colors.text }]}>SSP {cartTotal.toLocaleString()}</Text>
            </View>
            <TouchableOpacity style={[styles.checkoutBtn, { backgroundColor: colors.primary }]} onPress={() => setCheckoutModal(true)}>
              <Text style={styles.checkoutBtnText}>View Cart</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Cart & Checkout Modal */}
      <Modal visible={checkoutModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Current Cart</Text>
            <TouchableOpacity onPress={() => setCheckoutModal(false)}>
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={cart}
            keyExtractor={c => c.product.id.toString()}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item }) => (
              <View style={[styles.cartItem, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cName, { color: colors.text }]}>{item.product.name}</Text>
                  <Text style={[styles.cPrice, { color: colors.primary }]}>SSP {(item.product.sell_price * item.quantity).toLocaleString()}</Text>
                </View>
                <View style={[styles.qtyControl, { backgroundColor: colors.background }]}>
                  <TouchableOpacity onPress={() => updateQuantity(item.product.id, -1)} style={styles.qtyBtn}>
                    <Feather name="minus" size={16} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.qtyText, { color: colors.text }]}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => updateQuantity(item.product.id, 1)} style={styles.qtyBtn}>
                    <Feather name="plus" size={16} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, color: colors.textMuted }}>Cart is empty.</Text>}
          />

          <View style={[styles.checkoutFooter, { borderTopColor: colors.border }]}>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total Amount</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>SSP {cartTotal.toLocaleString()}</Text>
            </View>
            <AppButton title="Complete Payment" onPress={handleCheckout} disabled={cart.length === 0} />
          </View>
        </View>
      </Modal>

      <BarcodeScannerModal visible={scannerVisible} onClose={() => setScannerVisible(false)} onScan={handleScan} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  header:         { padding: 24, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerAccent:   { fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  title:          { fontSize: 26, fontWeight: '900' },
  iconBtn:        { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  mainLayout:     { flex: 1, paddingHorizontal: 24 },
  productSection: { flex: 1 },
  searchInput:    { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, fontSize: 15 },
  productCard:    { flex: 1, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 12, justifyContent: 'space-between' },
  pName:          { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  pPrice:         { fontSize: 14, fontWeight: '900', marginBottom: 4 },
  pStock:         { fontSize: 10, fontWeight: '600' },
  floatingCart:   { position: 'absolute', bottom: 100, left: 24, right: 24, borderRadius: 20, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', elevation: 10, shadowOpacity: 0.2, shadowRadius: 10 },
  cartSummaryText:{ fontSize: 12, fontWeight: '700', marginBottom: 2 },
  cartSummaryTotal:{ fontSize: 18, fontWeight: '900' },
  checkoutBtn:    { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  checkoutBtnText:{ color: '#FFF', fontWeight: '800', fontSize: 14 },
  modalContainer: { flex: 1, padding: 24, paddingTop: 40 },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle:     { fontSize: 22, fontWeight: '900' },
  cartItem:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  cName:          { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  cPrice:         { fontSize: 14, fontWeight: '900' },
  qtyControl:     { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 4 },
  qtyBtn:         { padding: 8 },
  qtyText:        { fontSize: 14, fontWeight: '800', paddingHorizontal: 12 },
  checkoutFooter: { paddingTop: 20, borderTopWidth: 1 },
  totalRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  totalLabel:     { fontSize: 16, fontWeight: '600' },
  totalValue:     { fontSize: 24, fontWeight: '900' },
});
