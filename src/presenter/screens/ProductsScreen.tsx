import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, Alert, TextInput, Platform, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../domain/useStore';
import { useNavigation } from '@react-navigation/native';
import { Product } from '../../domain/models';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { FormLayout } from '../components/FormLayout';
import { CategoryPicker } from '../components/CategoryPicker';
import { useAppTheme } from '../../core/contexts/ThemeContext';
import { SearchBar } from '../components/SearchBar';
import { EmptyState } from '../components/EmptyState';
import { ListItemSkeleton } from '../components/Skeletons';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { ImageUpload } from '../components/ImageUpload';
import { ProductSchema } from '../../domain/validation';

export function ProductsScreen() {
    const { products, addProduct, updateProduct, deleteProduct, loading } = useStore();
    const { colors, isDark } = useAppTheme();
    const navigation = useNavigation<any>();
    
    const [modalVisible, setModalVisible] = useState(false);
    const [scannerVisible, setScannerVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const [editingId, setEditingId] = useState<number | null>(null);
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Others');
    const [buyPrice, setBuyPrice] = useState('');
    const [sellPrice, setSellPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [notes, setNotes] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [buyUnit, setBuyUnit] = useState<'pcs' | 'doz'>('pcs');

    const CATEGORIES = ['All', 'Shoes (Men)', 'Shoes (Women)', 'Shoes (Kids)', 'Clothing (Men)', 'Clothing (Women)', 'Clothing (Kids)', 'Jewelry', 'Accessories', 'Others'];

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 p.category.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
            return matchesSearch && matchesCategory;
        }).sort((a, b) => b.id - a.id);
    }, [products, searchQuery, selectedCategory]);

    const handleSave = async () => {
        try {
            const finalBuyPrice = buyUnit === 'doz' ? parseFloat(buyPrice) / 12 : parseFloat(buyPrice);
            const finalQuantity = buyUnit === 'doz' ? parseInt(quantity, 10) * 12 : parseInt(quantity, 10);

            const productData = {
                name,
                category,
                buy_price: finalBuyPrice,
                sell_price: parseFloat(sellPrice),
                quantity: finalQuantity,
                notes,
                image_url: imageUrl,
                date: new Date().toISOString()
            };

            // Validation
            const result = ProductSchema.safeParse(productData);
            if (!result.success) {
                Alert.alert('Validation Error', result.error.errors[0].message);
                return;
            }

            if (editingId) {
                await updateProduct({ id: editingId, ...productData });
            } else {
                await addProduct(productData);
            }
            
            setModalVisible(false);
            resetForm();
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to save product');
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setName('');
        setCategory('Others');
        setBuyPrice('');
        setSellPrice('');
        setQuantity('');
        setNotes('');
        setImageUrl('');
        setBuyUnit('pcs');
    };

    const handleEdit = (p: Product) => {
        setEditingId(p.id);
        setName(p.name);
        setCategory(p.category);
        setBuyPrice(p.buy_price.toString());
        setSellPrice(p.sell_price.toString());
        setQuantity(p.quantity.toString());
        setNotes(p.notes || '');
        setImageUrl(p.image_url || '');
        setModalVisible(true);
    };

    const renderItem = ({ item }: { item: Product }) => (
        <Card style={styles.productCard} onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}>
            <View style={styles.cardHeader}>
                {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.productImage} />
                ) : (
                    <View style={[styles.imagePlaceholder, { backgroundColor: colors.border }]}>
                        <Text style={{ color: colors.textMuted }}>No Image</Text>
                    </View>
                )}
                <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={[styles.productName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.categoryText, { color: colors.textMuted }]}>{item.category}</Text>
                    <View style={styles.priceBadge}>
                        <Text style={[styles.priceText, { color: colors.primary }]}>SSP {item.sell_price.toLocaleString()}</Text>
                    </View>
                </View>
                <View style={[styles.stockBadge, { backgroundColor: item.quantity <= 10 ? colors.error + '20' : colors.success + '20' }]}>
                    <Text style={[styles.stockBadgeText, { color: item.quantity <= 10 ? colors.error : colors.success }]}>
                        {item.quantity} Left
                    </Text>
                </View>
            </View>
        </Card>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.headerAccent, { color: colors.primary }]}>INVENTORY</Text>
                    <Text style={[styles.title, { color: colors.text }]}>Stock Manager</Text>
                </View>
                <AppButton 
                    title="+ Add" 
                    onPress={() => { resetForm(); setModalVisible(true); }}
                    style={styles.addButton}
                />
            </View>

            <SearchBar 
                value={searchQuery} 
                onChangeText={setSearchQuery} 
                onBarcodePress={() => setScannerVisible(true)}
            />

            <View style={styles.filterBar}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={CATEGORIES}
                    keyExtractor={item => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity 
                            onPress={() => setSelectedCategory(item)}
                            style={[
                                styles.filterItem, 
                                { backgroundColor: selectedCategory === item ? colors.primary : colors.surface },
                                { borderColor: colors.border }
                            ]}
                        >
                            <Text style={[styles.filterText, { color: selectedCategory === item ? '#FFF' : colors.textSecondary }]}>{item}</Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={{ paddingHorizontal: 24 }}
                />
            </View>

            {loading ? (
                <View style={{ padding: 24 }}>
                    <ListItemSkeleton />
                    <ListItemSkeleton />
                    <ListItemSkeleton />
                </View>
            ) : (
                <FlatList
                    data={filteredProducts}
                    keyExtractor={p => p.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <EmptyState 
                            icon="box" 
                            title={searchQuery ? "No Matches" : "Empty Inventory"} 
                            body={searchQuery ? "Try searching for something else" : "Start by adding your first product to the store."}
                            ctaLabel={searchQuery ? "Clear Search" : "Add Product"}
                            onCtaPress={() => searchQuery ? setSearchQuery('') : setModalVisible(true)}
                        />
                    }
                />
            )}

            <BarcodeScannerModal 
                visible={scannerVisible} 
                onClose={() => setScannerVisible(false)} 
                onScan={(data) => { setSearchQuery(data); setScannerVisible(false); }} 
            />

            <Modal visible={modalVisible} animationType="slide">
                <FormLayout contentContainerStyle={[styles.modalContent, { backgroundColor: colors.surface }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{editingId ? 'Edit Product' : 'New Product'}</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={{ color: colors.primary, fontWeight: '700' }}>Cancel</Text></TouchableOpacity>
                    </View>

                    <ImageUpload value={imageUrl} onUpload={setImageUrl} />

                    <Text style={[styles.label, { color: colors.textMuted }]}>BASIC INFO</Text>
                    <TextInput 
                        style={[styles.input, { borderColor: colors.border, color: colors.text }]} 
                        placeholder="Product Name" 
                        value={name} onChangeText={setName}
                    />
                    
                    <CategoryPicker value={category} onSelect={setCategory} categories={CATEGORIES.slice(1)} />

                    <Text style={[styles.label, { color: colors.textMuted, marginTop: 12 }]}>PRICING & STOCK</Text>
                    <View style={styles.row}>
                        <TextInput 
                            style={[styles.input, { flex: 1, borderColor: colors.border, color: colors.text }]} 
                            placeholder={`Buy Price (${buyUnit})`} 
                            value={buyPrice} onChangeText={setBuyPrice} keyboardType="numeric"
                        />
                        <TextInput 
                            style={[styles.input, { flex: 1, borderColor: colors.border, color: colors.text }]} 
                            placeholder="Sell Price (pc)" 
                            value={sellPrice} onChangeText={setSellPrice} keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.row}>
                        <TextInput 
                            style={[styles.input, { flex: 1, borderColor: colors.border, color: colors.text }]} 
                            placeholder={`Qty (${buyUnit})`} 
                            value={quantity} onChangeText={setQuantity} keyboardType="numeric"
                        />
                        <View style={styles.unitToggle}>
                            <TouchableOpacity onPress={() => setBuyUnit('pcs')} style={[styles.unitBtn, buyUnit === 'pcs' && { backgroundColor: colors.primary }]}>
                                <Text style={{ color: buyUnit === 'pcs' ? '#FFF' : colors.textMuted }}>PCS</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setBuyUnit('doz')} style={[styles.unitBtn, buyUnit === 'doz' && { backgroundColor: colors.primary }]}>
                                <Text style={{ color: buyUnit === 'doz' ? '#FFF' : colors.textMuted }}>DOZ</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <AppButton title="Save Product" onPress={handleSave} style={{ marginTop: 20 }} />
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
    addButton: { borderRadius: 30, paddingHorizontal: 16 },
    filterBar: { marginBottom: 20 },
    filterItem: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1 },
    filterText: { fontSize: 13, fontWeight: '700' },
    list: { paddingHorizontal: 24, paddingBottom: 100 },
    productCard: { marginBottom: 12, padding: 12 },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    productImage: { width: 60, height: 60, borderRadius: 12 },
    imagePlaceholder: { width: 60, height: 60, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    productName: { fontSize: 15, fontWeight: 'bold' },
    categoryText: { fontSize: 12, marginTop: 2 },
    priceBadge: { marginTop: 4 },
    priceText: { fontWeight: '900', fontSize: 14 },
    stockBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    stockBadgeText: { fontSize: 10, fontWeight: 'bold' },
    modalContent: { padding: 24, paddingTop: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 20, fontWeight: '900' },
    label: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
    input: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginBottom: 12 },
    row: { flexDirection: 'row', gap: 12 },
    unitToggle: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4, height: 50, flex: 1 },
    unitBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
});
