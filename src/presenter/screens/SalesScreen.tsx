import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, Alert, TextInput, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../domain/useStore';
import { Sale } from '../../domain/models';
import { Theme } from '../../core/theme';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { FormLayout } from '../components/FormLayout';
import { ProductPicker } from '../components/ProductPicker';
import { useAppTheme } from '../../core/contexts/ThemeContext';

export function SalesScreen() {
    const { sales, products, addSale, deleteSale, refreshAll } = useStore();
    const { colors, isDark } = useAppTheme();
    const [modalVisible, setModalVisible] = useState(false);
    
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [quantity, setQuantity] = useState('');
    const [sellPriceOverride, setSellPriceOverride] = useState('');
    const [dateInput, setDateInput] = useState(() => new Date().toISOString().split('T')[0]);

    useEffect(() => {
        refreshAll();
    }, [refreshAll]);

    const handleProductSelect = (id: number) => {
        const p = products.find(x => x.id === id);
        setSelectedProductId(id);
        if (p) {
            setSellPriceOverride(p.sell_price.toString());
        }
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
            setDateInput(new Date().toISOString().split('T')[0]);
            Alert.alert('Success', 'Sale recorded successfully');
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to record sale');
        }
    };

    const renderItem = ({ item }: { item: Sale }) => (
        <Card>
            <View style={styles.cardHeader}>
                <Text style={[styles.productName, { color: colors.text }]}>{item.product_name}</Text>
                <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5' }]}>
                    <Text style={[styles.badgeText, { color: colors.success }]}>+SSP {(item.sell_price * item.quantity).toFixed(2)}</Text>
                </View>
            </View>
            <Text style={[styles.saleInfo, { color: colors.textSecondary }]}>
                {item.quantity} units · SSP {item.sell_price} each
            </Text>
            <Text style={[styles.dateInfo, { color: colors.textMuted }]}>{new Date(item.date).toLocaleDateString()} · {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
                <AppButton 
                    title="Delete Transaction" 
                    type="ghost" 
                    onPress={() => handleDelete(item.id)} 
                    style={styles.actionBtn}
                    textStyle={{ fontSize: 13, color: colors.error }}
                />
            </View>
        </Card>
    );

    const handleDelete = (id: number) => {
        const performDelete = async () => {
            await deleteSale(id);
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Delete this transaction?')) {
                performDelete();
            }
        } else {
            Alert.alert('Confirm Delete', 'Delete this transaction?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: performDelete },
            ]);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.headerAccent, { color: colors.primary }]}>REVENUE & GROWTH</Text>
                    <Text style={[styles.title, { color: colors.text }]}>Sales Ledger</Text>
                    <Text style={[styles.subtitle, { color: colors.textMuted }]}>{sales.length} Transactions</Text>
                </View>
                <AppButton 
                    title="New Sale" 
                    onPress={() => setModalVisible(true)}
                    style={{ borderRadius: 30, paddingHorizontal: 20 }}
                />
            </View>

            <FlatList
                data={sales}
                keyExtractor={s => s.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>Recording history...</Text>
                }
            />
            <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
                <FormLayout contentContainerStyle={[styles.modalContainer, { backgroundColor: colors.surface }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>New Sale</Text>
                        <AppButton title="✕" type="ghost" onPress={() => setModalVisible(false)} />
                    </View>

                    <ProductPicker 
                        value={selectedProductId} 
                        onSelect={handleProductSelect} 
                        products={products} 
                    />

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textMuted }]}>QUANTITY</Text>
                            <TextInput 
                                style={[styles.input, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border, color: colors.text }]} 
                                placeholder="0" 
                                placeholderTextColor={colors.textMuted}
                                value={quantity} 
                                onChangeText={setQuantity} 
                                keyboardType="numeric" 
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textMuted }]}>DATE (YYYY-MM-DD)</Text>
                            <TextInput 
                                style={[styles.input, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border, color: colors.text }]} 
                                placeholder="YYYY-MM-DD" 
                                placeholderTextColor={colors.textMuted}
                                value={dateInput} 
                                onChangeText={setDateInput} 
                            />
                        </View>
                    </View>
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textMuted }]}>UNIT PRICE (SSP)</Text>
                            <TextInput 
                                style={[styles.input, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border, color: colors.text }]} 
                                placeholder="0.00" 
                                placeholderTextColor={colors.textMuted}
                                value={sellPriceOverride} 
                                onChangeText={setSellPriceOverride} 
                                keyboardType="numeric" 
                            />
                        </View>
                    </View>

                    <View style={styles.modalActions}>
                        <AppButton title="Cancel" type="outline" style={{ flex: 1 }} onPress={() => setModalVisible(false)} />
                        <AppButton title="Confirm Sale" style={{ flex: 2 }} onPress={handleSave} />
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
    
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    productName: { fontSize: 16, fontWeight: 'bold', flex: 1 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 12, fontWeight: 'bold' },
    saleInfo: { marginBottom: 4, fontSize: 14, fontWeight: '600' },
    dateInfo: { fontSize: 11, fontWeight: '600' },
    cardActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15, borderTopWidth: 1, paddingTop: 10 },
    actionBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
    emptyText: { textAlign: 'center', marginTop: 100, fontWeight: '600' },

    modalContainer: { padding: 24, paddingTop: 60 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 24, fontWeight: '900' },
    label: { fontSize: 11, fontWeight: '900', marginBottom: 12, letterSpacing: 1 },
    form: { flexDirection: 'row', gap: 16, marginBottom: 24 },
    inputGroup: { flex: 1 },
    input: { 
        padding: 16, 
        borderRadius: 12, 
        borderWidth: 1, 
        fontSize: 16,
    },
    modalActions: { flexDirection: 'row', gap: 16, paddingBottom: 20 }
});
