import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, Alert, TextInput, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../domain/useStore';
import { Shipment } from '../../domain/models';
import { Theme } from '../../core/theme';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { FormLayout } from '../components/FormLayout';
import { useAppTheme } from '../../core/contexts/ThemeContext';

export function ShipmentsScreen() {
    const { shipments, products, addShipment, deleteShipment, shipmentRepo, refreshAll } = useStore();
    const { colors, isDark } = useAppTheme();
    const [modalVisible, setModalVisible] = useState(false);
    
    // State for the new fields
    const [description, setDescription] = useState('');
    const [weightKg, setWeightKg] = useState('');
    const [amount, setAmount] = useState('');
    
    // Optional product link to update inventory
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [quantity, setQuantity] = useState('');
    const [dateInput, setDateInput] = useState(() => new Date().toISOString().split('T')[0]);
    
    useEffect(() => {
        refreshAll();
    }, [refreshAll]);

    const handleSave = async () => {
        if (!description && !selectedProductId) {
            Alert.alert('Error', 'Please enter product details or select a product');
            return;
        }

        try {
            const items = selectedProductId ? [{
                product_id: selectedProductId,
                quantity: parseInt(quantity, 10) || 0
            }] : [];

            await addShipment(
                new Date(dateInput).toISOString(), 
                'delivered', 
                items,
                parseFloat(amount) || 0,
                description,
                parseFloat(weightKg) || 0
            );
            
            setModalVisible(false);
            resetForm();
            Alert.alert('Success', 'Shipment record created');
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to save shipment');
        }
    };

    const resetForm = () => {
        setDescription('');
        setWeightKg('');
        setAmount('');
        setSelectedProductId(null);
        setQuantity('');
        setDateInput(new Date().toISOString().split('T')[0]);
    };

    const renderItem = ({ item }: { item: Shipment }) => {
        const items = shipmentRepo.getShipmentItems(item.id);

        return (
            <Card>
                <View style={styles.cardHeader}>
                    <Text style={[styles.shipmentId, { color: colors.textMuted }]}>SHIPMENT #{item.id}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5' }]}>
                        <Text style={[styles.statusText, { color: colors.success }]}>{item.status}</Text>
                    </View>
                </View>
                
                <View style={styles.summaryRow}>
                    <Text style={[styles.dateInfo, { color: colors.text }]}>{new Date(item.date).toLocaleDateString()}</Text>
                    {item.weight_kg ? (
                        <View style={[styles.weightBadge, { backgroundColor: isDark ? colors.primaryLight : '#F3E8FF' }]}>
                            <Text style={[styles.weightText, { color: colors.primary }]}>{item.weight_kg} KG</Text>
                        </View>
                    ) : null}
                </View>

                {item.description ? (
                    <View style={[styles.descriptionContainer, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border }]}>
                        <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>{item.description}</Text>
                    </View>
                ) : null}

                {items.length > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                {items.length > 0 && <Text style={[styles.itemsTitle, { color: colors.textMuted }]}>Inventory Updates</Text>}
                {items.map(shipItem => (
                    <View key={shipItem.id} style={styles.itemRow}>
                        <Text style={[styles.itemText, { color: colors.primary }]}>{shipItem.product_name}</Text>
                        <Text style={[styles.itemQty, { color: colors.primary }]}>+{shipItem.quantity}</Text>
                    </View>
                ))}

                <View style={[styles.footerRow, { borderTopWidth: items.length > 0 ? 0 : 1, borderTopColor: colors.border, paddingTop: items.length > 0 ? 0 : 12 }]}>
                    <Text style={[styles.costText, { color: colors.text }]}>Cost: SSP {item.shipping_cost?.toFixed(2) || '0.00'}</Text>
                    <View style={styles.cardActions}>
                        <AppButton 
                            title="Delete" 
                            type="ghost" 
                            onPress={() => handleDelete(item.id)} 
                            style={styles.actionBtn}
                            textStyle={{ fontSize: 13, color: colors.error }}
                        />
                    </View>
                </View>
            </Card>
        );
    };

    const handleDelete = (id: number) => {
        const performDelete = () => {
            deleteShipment(id);
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Delete this shipment record?')) {
                performDelete();
            }
        } else {
            Alert.alert('Confirm Delete', 'Delete this shipment record?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: performDelete },
            ]);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.headerAccent, { color: colors.primary }]}>STORES & LOGISTICS</Text>
                    <Text style={[styles.title, { color: colors.text }]}>Shipments</Text>
                    <Text style={[styles.subtitle, { color: colors.textMuted }]}>{shipments.length} Records Logged</Text>
                </View>
                <AppButton 
                    title="+ Log New" 
                    onPress={() => { resetForm(); setModalVisible(true); }}
                    style={{ borderRadius: 30, paddingHorizontal: 20 }}
                />
            </View>

            <FlatList
                data={shipments}
                keyExtractor={s => s.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textMuted }]}>No shipment history found.</Text>}
            />
            
            <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
                <FormLayout contentContainerStyle={[styles.modalContainer, { backgroundColor: colors.surface }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>New Shipment</Text>
                        <AppButton title="✕" type="ghost" onPress={() => setModalVisible(false)} />
                    </View>

                    <View style={styles.formSection}>
                        <Text style={[styles.label, { color: colors.textMuted }]}>DETAILS OF THE PRODUCTS</Text>
                        <TextInput 
                            style={[styles.input, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border, color: colors.text, height: 100, textAlignVertical: 'top' }]} 
                            placeholder="Describe the items received..." 
                            placeholderTextColor={colors.textMuted}
                            value={description} 
                            onChangeText={setDescription} 
                            multiline
                        />
                        
                        <Text style={[styles.label, { color: colors.textMuted }]}>DATE OF SHIPMENT (YYYY-MM-DD)</Text>
                        <TextInput 
                            style={[styles.input, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border, color: colors.text }]} 
                            placeholder="YYYY-MM-DD" 
                            placeholderTextColor={colors.textMuted}
                            value={dateInput} 
                            onChangeText={setDateInput} 
                        />

                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.label, { color: colors.textMuted }]}>NUMBERS OF KILOS</Text>
                                <TextInput 
                                    style={[styles.input, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border, color: colors.text }]} 
                                    placeholder="0 kg" 
                                    placeholderTextColor={colors.textMuted}
                                    value={weightKg} 
                                    onChangeText={setWeightKg} 
                                    keyboardType="numeric" 
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.label, { color: colors.textMuted }]}>AMOUNT (SSP)</Text>
                                <TextInput 
                                    style={[styles.input, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border, color: colors.text }]} 
                                    placeholder="0.00" 
                                    placeholderTextColor={colors.textMuted}
                                    value={amount} 
                                    onChangeText={setAmount} 
                                    keyboardType="numeric" 
                                />
                            </View>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    
                    <View style={[styles.formSection, { marginTop: 20 }]}>
                        <Text style={[styles.label, { color: colors.textMuted }]}>LINK TO INVENTORY (OPTIONAL)</Text>
                        <Text style={[styles.hint, { color: colors.textMuted }]}>Select a product to auto-update stock count</Text>
                        
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productScroll}>
                            {products.map(p => (
                                <AppButton 
                                    key={p.id}
                                    title={p.name}
                                    type={selectedProductId === p.id ? "primary" : "outline"}
                                    onPress={() => setSelectedProductId(selectedProductId === p.id ? null : p.id)}
                                    style={styles.productChip}
                                    textStyle={{ fontSize: 12, color: selectedProductId === p.id ? '#FFF' : colors.text }}
                                />
                            ))}
                        </ScrollView>

                        {selectedProductId && (
                            <View style={{ marginTop: 12 }}>
                                <Text style={[styles.label, { color: colors.textMuted }]}>QUANTITY TO ADD</Text>
                                <TextInput 
                                    style={[styles.input, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border, color: colors.text }]} 
                                    placeholder="0" 
                                    placeholderTextColor={colors.textMuted}
                                    value={quantity} 
                                    onChangeText={setQuantity} 
                                    keyboardType="numeric" 
                                />
                            </View>
                        )}
                    </View>

                    <View style={styles.modalActions}>
                        <AppButton title="Cancel" type="outline" style={{ flex: 1 }} onPress={() => setModalVisible(false)} />
                        <AppButton title="Save Shipment" style={{ flex: 2 }} onPress={handleSave} />
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
    
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    shipmentId: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 9, textTransform: 'uppercase', fontWeight: '900' },
    
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    dateInfo: { fontSize: 14, fontWeight: 'bold' },
    weightBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    weightText: { fontSize: 11, fontWeight: '900' },
    
    descriptionContainer: { padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1 },
    descriptionText: { fontSize: 14, lineHeight: 20 },
    
    divider: { height: 1, marginVertical: 12 },
    itemsTitle: { fontSize: 10, fontWeight: '900', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    itemText: { fontSize: 13, fontWeight: '700' },
    itemQty: { fontWeight: '900', fontSize: 13 },
    
    footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    costText: { fontSize: 13, fontWeight: '900' },
    
    cardActions: { flexDirection: 'row', gap: 10 },
    actionBtn: { paddingVertical: 4, paddingHorizontal: 8 },
    emptyText: { textAlign: 'center', marginTop: 100, fontWeight: '600' },

    modalContainer: { padding: 24, paddingTop: 60 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 24, fontWeight: '900' },
    formSection: { marginBottom: 20 },
    label: { fontSize: 11, fontWeight: '900', marginBottom: 12, letterSpacing: 1 },
    hint: { fontSize: 12, marginBottom: 12, marginTop: -8 },
    productScroll: { flexDirection: 'row', marginBottom: 10 },
    productChip: { marginRight: 8, paddingHorizontal: 16, height: 40, borderRadius: 20 },
    row: { flexDirection: 'row', gap: 16 },
    input: { 
        padding: 16, 
        borderRadius: 12, 
        borderWidth: 1, 
        fontSize: 16,
        marginBottom: 16
    },
    modalActions: { flexDirection: 'row', gap: 16, marginTop: 20, paddingBottom: 40 }
});
;
