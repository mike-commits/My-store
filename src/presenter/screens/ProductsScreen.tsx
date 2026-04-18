import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, Alert, TextInput, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../domain/useStore';
import { useNavigation } from '@react-navigation/native';
import { Product } from '../../domain/models';
import { Theme } from '../../core/theme';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { FormLayout } from '../components/FormLayout';
import { CategoryPicker } from '../components/CategoryPicker';
import { useAppTheme } from '../../core/contexts/ThemeContext';

export function ProductsScreen() {
    const { products, addProduct, updateProduct, deleteProduct, refreshAll } = useStore();
    const { colors, isDark } = useAppTheme();
    const navigation = useNavigation<any>();
    const [modalVisible, setModalVisible] = useState(false);
    
    const [editingId, setEditingId] = useState<number | null>(null);
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Others');
    const [buyPrice, setBuyPrice] = useState('');
    const [sellPrice, setSellPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [notes, setNotes] = useState('');
    const [dateInput, setDateInput] = useState(() => new Date().toISOString().split('T')[0]);
    const [buyUnit, setBuyUnit] = useState<'pcs' | 'doz'>('pcs');

    const CATEGORIES = [
        'Shoes (Men)', 'Shoes (Women)', 'Shoes (Kids)',
        'Clothing (Men)', 'Clothing (Women)', 'Clothing (Kids)',
        'Jewelry', 'Accessories', 'Others'
    ];

    useEffect(() => {
        refreshAll();
    }, [refreshAll]);

    const resetForm = () => {
        setEditingId(null);
        setName('');
        setCategory('Others');
        setBuyPrice('');
        setSellPrice('');
        setQuantity('');
        setNotes('');
        setBuyUnit('pcs');
        setDateInput(new Date().toISOString().split('T')[0]);
    };

    const handleSave = async () => {
        if (!name || !category || !buyPrice || !sellPrice || !quantity) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        try {
            let finalBuyPrice = parseFloat(buyPrice);
            let finalQuantity = parseInt(quantity, 10);

            if (buyUnit === 'doz') {
                finalBuyPrice = finalBuyPrice / 12;
                finalQuantity = finalQuantity * 12;
            }

            const productData = {
                name,
                category,
                buy_price: finalBuyPrice,
                sell_price: parseFloat(sellPrice),
                quantity: finalQuantity,
                notes,
                date: new Date(dateInput).toISOString()
            };

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

    const handleEdit = (p: Product) => {
        setEditingId(p.id);
        setName(p.name);
        setCategory(p.category);
        setBuyPrice(p.buy_price.toString());
        setSellPrice(p.sell_price.toString());
        setQuantity(p.quantity.toString());
        setNotes(p.notes || '');
        setDateInput(p.date ? new Date(p.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        setModalVisible(true);
    };

    const handleDelete = (id: number) => {
        const performDelete = async () => {
            try {
                await deleteProduct(id);
            } catch (e: any) {
                Alert.alert('Error', e.message || 'Failed to delete product');
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure? This will remove the product and its history.')) {
                performDelete();
            }
        } else {
            Alert.alert('Confirm Delete', 'Are you sure? This will remove the product and its history.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: performDelete },
            ]);
        }
    };

    const renderItem = ({ item }: { item: Product }) => {
        return (
            <Card>
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.productName, { color: colors.text }]}>{item.name}</Text>
                        <Text style={[styles.categoryText, { color: colors.textMuted }]}>{item.category}</Text>
                    </View>
                    <View style={[styles.stockBadge, { backgroundColor: isDark ? colors.primaryLight : '#F5F3FF' }]}>
                        <Text style={[styles.stockBadgeText, { color: colors.primary }]}>{item.quantity} in stock</Text>
                    </View>
                </View>

                {item.notes ? (
                    <View style={[styles.notesContainer, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border }]}>
                        <Text style={[styles.notesText, { color: colors.textSecondary }]}>{item.notes}</Text>
                    </View>
                ) : null}
                
                <View style={[styles.detailsRow, { borderTopColor: colors.border }]}>
                    <View style={styles.detailItem}>
                        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Buy Price</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>SSP {item.buy_price.toFixed(2)}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Sell Price</Text>
                        <Text style={[styles.detailValue, { color: colors.primary }]}>SSP {item.sell_price.toFixed(2)}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Margin</Text>
                        <Text style={[styles.detailValue, { color: colors.secondary }]}>
                            SSP {(item.sell_price - item.buy_price).toFixed(2)}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardActions}>
                    <AppButton 
                        title="Review" 
                        type="primary" 
                        onPress={() => navigation.navigate('ProductDetails', { productId: item.id })} 
                        style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
                        textStyle={{ fontSize: 13 }}
                    />
                    <AppButton 
                        title="Edit" 
                        type="outline" 
                        onPress={() => handleEdit(item)} 
                        style={styles.actionBtn}
                        textStyle={{ fontSize: 13 }}
                    />
                    <AppButton 
                        title="Delete" 
                        type="ghost" 
                        onPress={() => handleDelete(item.id)} 
                        style={styles.actionBtn}
                        textStyle={{ fontSize: 13, color: colors.error }}
                    />
                </View>
            </Card>
        )
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.headerAccent, { color: colors.primary }]}>INVENTORY</Text>
                    <Text style={[styles.title, { color: colors.text }]}>All Products</Text>
                    <Text style={[styles.subtitle, { color: colors.textMuted }]}>{products.length} Items Listed</Text>
                </View>
                <AppButton 
                    title="+ Add New" 
                    onPress={() => { resetForm(); setModalVisible(true); }}
                    style={{ borderRadius: 30, paddingHorizontal: 20 }}
                />
            </View>

            <FlatList
                data={products}
                keyExtractor={p => p.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textMuted }]}>Standing by for first product...</Text>}
            />
            <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
                <FormLayout contentContainerStyle={[styles.modalContainer, { backgroundColor: colors.surface }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{editingId ? 'Edit Product' : 'New Product'}</Text>
                        <AppButton title="✕" type="ghost" onPress={() => setModalVisible(false)} />
                    </View>

                    <View style={styles.formSection}>
                        <Text style={[styles.label, { color: colors.textMuted }]}>PRODUCT NAME</Text>
                        <TextInput 
                            style={[styles.input, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border, color: colors.text }]} 
                            placeholder="e.g. Premium T-Shirt" 
                            placeholderTextColor={colors.textMuted}
                            value={name} 
                            onChangeText={setName} 
                        />

                        <CategoryPicker 
                            value={category} 
                            onSelect={setCategory} 
                            categories={CATEGORIES} 
                        />

                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <View style={styles.labelRow}>
                                    <Text style={[styles.label, { color: colors.textMuted }]}>QTY</Text>
                                    <View style={styles.unitToggle}>
                                        <TouchableOpacity 
                                            onPress={() => setBuyUnit('pcs')}
                                            style={[styles.unitBtn, buyUnit === 'pcs' && styles.activeUnitBtn]}
                                        >
                                            <Text style={[styles.unitBtnText, buyUnit === 'pcs' && styles.activeUnitText]}>PCS</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            onPress={() => setBuyUnit('doz')}
                                            style={[styles.unitBtn, buyUnit === 'doz' && styles.activeUnitBtn]}
                                        >
                                            <Text style={[styles.unitBtnText, buyUnit === 'doz' && styles.activeUnitText]}>DOZ</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <TextInput 
                                    style={[styles.input, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border, color: colors.text }]} 
                                    placeholder={buyUnit === 'doz' ? "0 doz" : "0 pcs"} 
                                    placeholderTextColor={colors.textMuted}
                                    value={quantity} 
                                    onChangeText={setQuantity} 
                                    keyboardType="numeric" 
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.label, { color: colors.textMuted }]}>
                                    BUY PRICE {buyUnit === 'doz' ? '(SSP/DOZ)' : '(SSP/PC)'}
                                </Text>
                                <TextInput 
                                    style={[styles.input, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border, color: colors.text }]} 
                                    placeholder="0" 
                                    placeholderTextColor={colors.textMuted}
                                    value={buyPrice} 
                                    onChangeText={setBuyPrice} 
                                    keyboardType="numeric" 
                                />
                            </View>
                        </View>

                        <Text style={[styles.label, { color: colors.textMuted }]}>SELL PRICE (SSP/PC)</Text>
                        <TextInput 
                            style={[styles.input, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border, color: colors.text }]} 
                            placeholder="0" 
                            placeholderTextColor={colors.textMuted}
                            value={sellPrice} 
                            onChangeText={setSellPrice} 
                            keyboardType="numeric" 
                        />

                        <Text style={[styles.label, { color: colors.textMuted }]}>DATE ADDED (YYYY-MM-DD)</Text>
                        <TextInput 
                            style={[styles.input, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border, color: colors.text }]} 
                            placeholder="YYYY-MM-DD" 
                            placeholderTextColor={colors.textMuted}
                            value={dateInput} 
                            onChangeText={setDateInput} 
                        />

                        <Text style={[styles.label, { color: colors.textMuted }]}>NOTES & DESCRIPTION</Text>
                        <TextInput 
                            style={[styles.input, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border, color: colors.text, height: 100, textAlignVertical: 'top' }]} 
                            placeholder="Add categorize details, size, or special notes here..." 
                            placeholderTextColor={colors.textMuted}
                            value={notes} 
                            onChangeText={setNotes} 
                            multiline
                        />
                    </View>

                    <View style={styles.modalActions}>
                        <AppButton title="Cancel" type="outline" style={{ flex: 1 }} onPress={() => setModalVisible(false)} />
                        <AppButton title={editingId ? "Update Product" : "Save Product"} style={{ flex: 2 }} onPress={handleSave} />
                    </View>
                </FormLayout>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { 
        paddingHorizontal: 24, 
        paddingTop: 40,
        paddingBottom: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end'
    },
    headerAccent: { fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
    title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
    subtitle: { fontSize: 13, marginTop: 4 },
    list: { paddingHorizontal: 20, paddingBottom: 100 },
    
    productName: { fontSize: 16, fontWeight: 'bold' },
    categoryText: { fontSize: 12, marginTop: 2 },
    stockBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    stockBadgeText: { fontSize: 11, fontWeight: 'bold' },
    detailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingVertical: 10, borderTopWidth: 1 },
    detailItem: { flex: 1 },
    detailLabel: { fontSize: 9, textTransform: 'uppercase', marginBottom: 2, fontWeight: 'bold' },
    detailValue: { fontSize: 14, fontWeight: '900' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, gap: 10 },
    actionBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
    emptyText: { textAlign: 'center', marginTop: 100, fontWeight: '600' },

    notesContainer: { padding: 12, borderRadius: 12, marginTop: 12, borderWidth: 1 },
    notesText: { fontSize: 13, lineHeight: 18, fontStyle: 'italic' },

    modalContainer: { padding: 24, paddingTop: 60 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
    modalTitle: { fontSize: 24, fontWeight: '900' },
    formSection: { marginBottom: 24 },
    label: { fontSize: 11, fontWeight: '900', marginBottom: 12, letterSpacing: 1 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    unitToggle: { 
        flexDirection: 'row', 
        backgroundColor: '#F1F5F9', // Sleek slate gray
        borderRadius: 10, 
        padding: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    unitBtn: { 
        paddingHorizontal: 12, 
        paddingVertical: 6, 
        borderRadius: 8,
        minWidth: 44,
        alignItems: 'center'
    },
    unitBtnText: { 
        fontSize: 10, 
        fontWeight: '800', 
        color: '#64748B',
        letterSpacing: 0.5
    },
    activeUnitBtn: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    activeUnitText: {
        color: '#000000', // Or colors.primary
    },
    row: { flexDirection: 'row', gap: 16 },
    input: { 
        padding: 16, 
        borderRadius: 12, 
        borderWidth: 1, 
        fontSize: 16,
        marginBottom: 16,
    },
    modalActions: { flexDirection: 'row', gap: 16, marginTop: 24, paddingBottom: 40 }
});
