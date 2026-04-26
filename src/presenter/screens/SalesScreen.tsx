import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, Alert, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../domain/useStore';
import { Sale } from '../../domain/models';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { FormLayout } from '../components/FormLayout';
import { ProductPicker } from '../components/ProductPicker';
import { useAppTheme } from '../../core/contexts/ThemeContext';
import { EmptyState } from '../components/EmptyState';
import { ListItemSkeleton } from '../components/Skeletons';
import { PDFService } from '../../data/PDFService';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function SalesScreen() {
    const { sales, products, addSale, deleteSale, loading } = useStore();
    const { colors, isDark } = useAppTheme();
    
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [quantity, setQuantity] = useState('');
    const [sellPriceOverride, setSellPriceOverride] = useState('');
    const [dateInput, setDateInput] = useState(() => new Date().toISOString().split('T')[0]);

    // Date filtering
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    const filteredSales = useMemo(() => {
        return sales.filter(s => {
            const saleDate = s.date.split('T')[0];
            return saleDate >= startDate && saleDate <= endDate;
        });
    }, [sales, startDate, endDate]);

    const handleProductSelect = (id: number) => {
        const p = products.find(x => x.id === id);
        setSelectedProductId(id);
        if (p) setSellPriceOverride(p.sell_price.toString());
    };

    const handleSave = async () => {
        if (!selectedProductId || !quantity || !sellPriceOverride) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        try {
            await addSale(
                selectedProductId, 
                new Date(dateInput).toISOString(), 
                parseInt(quantity, 10), 
                parseFloat(sellPriceOverride)
            );
            
            setModalVisible(false);
            setQuantity('');
            setSelectedProductId(null);
            Alert.alert('Success', 'Sale recorded successfully');
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to record sale');
        }
    };

    const handleGenerateInvoice = async (sale: Sale) => {
        try {
            const settingsStr = await AsyncStorage.getItem('app_settings');
            const settings = settingsStr ? JSON.parse(settingsStr) : { storeName: 'My Store', currency: 'SSP' };
            await PDFService.generateInvoice(sale, settings);
        } catch (e) {
            Alert.alert("Error", "Failed to generate PDF");
        }
    };

    const renderItem = ({ item }: { item: Sale }) => (
        <Card style={styles.saleCard}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.productName, { color: colors.text }]}>{item.product_name}</Text>
                    <Text style={[styles.dateText, { color: colors.textMuted }]}>{new Date(item.date).toLocaleString()}</Text>
                </View>
                <View style={styles.priceContainer}>
                    <Text style={[styles.totalPrice, { color: colors.primary }]}>SSP {(item.sell_price * item.quantity).toLocaleString()}</Text>
                    <Text style={[styles.qtyText, { color: colors.textSecondary }]}>{item.quantity} units x {item.sell_price}</Text>
                </View>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleGenerateInvoice(item)}>
                    <Feather name="file-text" size={14} color={colors.primary} />
                    <Text style={[styles.actionText, { color: colors.primary }]}>Invoice</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => deleteSale(item.id)}>
                    <Feather name="trash-2" size={14} color={colors.error} />
                    <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
                </TouchableOpacity>
            </View>
        </Card>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.headerAccent, { color: colors.primary }]}>REVENUE</Text>
                    <Text style={[styles.title, { color: colors.text }]}>Sales Ledger</Text>
                </View>
                <AppButton title="+ New Sale" onPress={() => setModalVisible(true)} style={styles.addButton} />
            </View>

            <View style={styles.dateFilter}>
                <View style={styles.dateInputWrapper}>
                    <Text style={[styles.filterLabel, { color: colors.textMuted }]}>FROM</Text>
                    <TextInput 
                        style={[styles.dateInput, { borderColor: colors.border, color: colors.text }]} 
                        value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD"
                    />
                </View>
                <View style={styles.dateInputWrapper}>
                    <Text style={[styles.filterLabel, { color: colors.textMuted }]}>TO</Text>
                    <TextInput 
                        style={[styles.dateInput, { borderColor: colors.border, color: colors.text }]} 
                        value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD"
                    />
                </View>
            </View>

            {loading ? (
                <View style={{ padding: 24 }}>
                    <ListItemSkeleton />
                    <ListItemSkeleton />
                </View>
            ) : (
                <FlatList
                    data={filteredSales}
                    keyExtractor={s => s.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <EmptyState 
                            icon="dollar-sign" 
                            title="No Sales" 
                            body="Transactions for the selected date range will appear here."
                            ctaLabel="Record Sale"
                            onCtaPress={() => setModalVisible(true)}
                        />
                    }
                />
            )}

            <Modal visible={modalVisible} animationType="slide">
                <FormLayout contentContainerStyle={[styles.modalContent, { backgroundColor: colors.surface }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>New Transaction</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={{ color: colors.primary, fontWeight: '700' }}>Cancel</Text></TouchableOpacity>
                    </View>

                    <ProductPicker value={selectedProductId} onSelect={handleProductSelect} products={products} />

                    <View style={[styles.row, { marginTop: 12 }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.label, { color: colors.textMuted }]}>QUANTITY</Text>
                            <TextInput 
                                style={[styles.input, { borderColor: colors.border, color: colors.text }]} 
                                placeholder="0" value={quantity} onChangeText={setQuantity} keyboardType="numeric"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.label, { color: colors.textMuted }]}>PRICE PER UNIT</Text>
                            <TextInput 
                                style={[styles.input, { borderColor: colors.border, color: colors.text }]} 
                                placeholder="0.00" value={sellPriceOverride} onChangeText={setSellPriceOverride} keyboardType="numeric"
                            />
                        </View>
                    </View>

                    <Text style={[styles.label, { color: colors.textMuted }]}>DATE</Text>
                    <TextInput 
                        style={[styles.input, { borderColor: colors.border, color: colors.text }]} 
                        value={dateInput} onChangeText={setDateInput} placeholder="YYYY-MM-DD"
                    />

                    <AppButton title="Confirm Transaction" onPress={handleSave} style={{ marginTop: 20 }} />
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
    dateFilter: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, marginBottom: 20 },
    dateInputWrapper: { flex: 1 },
    filterLabel: { fontSize: 9, fontWeight: '900', marginBottom: 4 },
    dateInput: { height: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 13 },
    list: { paddingHorizontal: 24, paddingBottom: 100 },
    saleCard: { marginBottom: 12, padding: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
    productName: { fontSize: 15, fontWeight: 'bold' },
    dateText: { fontSize: 11, marginTop: 2 },
    priceContainer: { alignItems: 'flex-end' },
    totalPrice: { fontSize: 16, fontWeight: '900' },
    qtyText: { fontSize: 11, marginTop: 2 },
    actions: { flexDirection: 'row', marginTop: 12, gap: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    actionText: { fontSize: 12, fontWeight: '700' },
    modalContent: { padding: 24, paddingTop: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 20, fontWeight: '900' },
    label: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
    input: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginBottom: 12 },
    row: { flexDirection: 'row', gap: 12 },
});
