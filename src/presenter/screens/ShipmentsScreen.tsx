import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, Alert, TextInput, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../domain/useStore';
import { Shipment } from '../../domain/models';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { FormLayout } from '../components/FormLayout';
import { useAppTheme } from '../../core/contexts/ThemeContext';
import { EmptyState } from '../components/EmptyState';
import { ListItemSkeleton } from '../components/Skeletons';

export function ShipmentsScreen() {
    const { shipments, products, addShipment, deleteShipment, loading } = useStore();
    const { colors, isDark } = useAppTheme();
    const [modalVisible, setModalVisible] = useState(false);
    
    const [description, setDescription] = useState('');
    const [weightKg, setWeightKg] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [quantity, setQuantity] = useState('');
    const [shipUnit, setShipUnit] = useState<'pcs' | 'doz'>('pcs');
    const [dateInput, setDateInput] = useState(() => new Date().toISOString().split('T')[0]);

    const handleSave = async () => {
        if (!description && !selectedProductId) {
            Alert.alert('Error', 'Please fill in shipment details');
            return;
        }

        try {
            let finalQty = parseInt(quantity, 10) || 0;
            if (shipUnit === 'doz') finalQty *= 12;

            const items = selectedProductId ? [{
                product_id: selectedProductId,
                quantity: finalQty
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
            Alert.alert('Success', 'Shipment logged successfully');
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
        setShipUnit('pcs');
        setDateInput(new Date().toISOString().split('T')[0]);
    };

    const renderItem = ({ item }: { item: Shipment }) => (
        <Card style={styles.shipmentCard}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={[styles.shipmentTitle, { color: colors.text }]}>{item.description || `Shipment #${item.id}`}</Text>
                    <Text style={[styles.dateText, { color: colors.textMuted }]}>{new Date(item.date).toLocaleDateString()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                    <Text style={[styles.statusText, { color: colors.success }]}>Delivered</Text>
                </View>
            </View>
            
            <View style={styles.metricsRow}>
                <View style={styles.metric}>
                    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Weight</Text>
                    <Text style={[styles.metricValue, { color: colors.text }]}>{item.weight_kg || 0} kg</Text>
                </View>
                <View style={styles.metric}>
                    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Cost</Text>
                    <Text style={[styles.metricValue, { color: colors.text }]}>SSP {item.shipping_cost?.toLocaleString()}</Text>
                </View>
            </View>

            {item.items && item.items.length > 0 && (
                <View style={[styles.itemsList, { borderTopColor: colors.border }]}>
                    {item.items.map((it, idx) => (
                        <View key={idx} style={styles.itemRow}>
                            <Text style={[styles.itemName, { color: colors.textSecondary }]}>{it.product_name}</Text>
                            <Text style={[styles.itemQty, { color: colors.primary }]}>+{it.quantity} units</Text>
                        </View>
                    ))}
                </View>
            )}

            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                <Text style={{ color: colors.error, fontSize: 12, fontWeight: '700' }}>Remove Log</Text>
            </TouchableOpacity>
        </Card>
    );

    const handleDelete = (id: number) => {
        Alert.alert('Confirm', 'Remove this shipment log?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteShipment(id) }
        ]);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.headerAccent, { color: colors.primary }]}>LOGISTICS</Text>
                    <Text style={[styles.title, { color: colors.text }]}>Shipments</Text>
                </View>
                <AppButton title="+ Log New" onPress={() => setModalVisible(true)} style={styles.addButton} />
            </View>

            {loading ? (
                <View style={{ padding: 24 }}>
                    <ListItemSkeleton />
                    <ListItemSkeleton />
                </View>
            ) : (
                <FlatList
                    data={shipments}
                    keyExtractor={s => s.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <EmptyState 
                            icon="truck" 
                            title="No Shipments" 
                            body="Keep track of your incoming inventory and shipping costs here."
                            ctaLabel="Log First Shipment"
                            onCtaPress={() => setModalVisible(true)}
                        />
                    }
                />
            )}

            <Modal visible={modalVisible} animationType="slide">
                <FormLayout contentContainerStyle={[styles.modalContent, { backgroundColor: colors.surface }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Log Shipment</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={{ color: colors.primary, fontWeight: '700' }}>Cancel</Text></TouchableOpacity>
                    </View>

                    <Text style={[styles.label, { color: colors.textMuted }]}>SHIPMENT DETAILS</Text>
                    <TextInput 
                        style={[styles.input, { borderColor: colors.border, color: colors.text }]} 
                        placeholder="Description (e.g. New Stock from Dubai)" 
                        value={description} onChangeText={setDescription}
                    />

                    <View style={styles.row}>
                        <TextInput 
                            style={[styles.input, { flex: 1, borderColor: colors.border, color: colors.text }]} 
                            placeholder="Weight (kg)" 
                            value={weightKg} onChangeText={setWeightKg} keyboardType="numeric"
                        />
                        <TextInput 
                            style={[styles.input, { flex: 1, borderColor: colors.border, color: colors.text }]} 
                            placeholder="Shipping Cost (SSP)" 
                            value={amount} onChangeText={setAmount} keyboardType="numeric"
                        />
                    </View>

                    <Text style={[styles.label, { color: colors.textMuted, marginTop: 12 }]}>INVENTORY SYNC (OPTIONAL)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                        {products.map(p => (
                            <TouchableOpacity 
                                key={p.id}
                                onPress={() => setSelectedProductId(selectedProductId === p.id ? null : p.id)}
                                style={[styles.chip, { backgroundColor: selectedProductId === p.id ? colors.primary : colors.background, borderColor: colors.border }]}
                            >
                                <Text style={{ color: selectedProductId === p.id ? '#FFF' : colors.textSecondary }}>{p.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {selectedProductId && (
                        <View style={styles.row}>
                            <TextInput 
                                style={[styles.input, { flex: 1, borderColor: colors.border, color: colors.text }]} 
                                placeholder="Qty to Add" 
                                value={quantity} onChangeText={setQuantity} keyboardType="numeric"
                            />
                            <View style={styles.unitToggle}>
                                <TouchableOpacity onPress={() => setShipUnit('pcs')} style={[styles.unitBtn, shipUnit === 'pcs' && { backgroundColor: colors.primary }]}>
                                    <Text style={{ color: shipUnit === 'pcs' ? '#FFF' : colors.textSecondary }}>PCS</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setShipUnit('doz')} style={[styles.unitBtn, shipUnit === 'doz' && { backgroundColor: colors.primary }]}>
                                    <Text style={{ color: shipUnit === 'doz' ? '#FFF' : colors.textSecondary }}>DOZ</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    <AppButton title="Confirm Log" onPress={handleSave} style={{ marginTop: 20 }} />
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
    list: { paddingHorizontal: 24, paddingBottom: 100 },
    shipmentCard: { marginBottom: 16, padding: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    shipmentTitle: { fontSize: 16, fontWeight: 'bold' },
    dateText: { fontSize: 12, marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
    metricsRow: { flexDirection: 'row', marginTop: 16, gap: 24 },
    metric: { flex: 1 },
    metricLabel: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
    metricValue: { fontSize: 15, fontWeight: '800', marginTop: 2 },
    itemsList: { marginTop: 16, paddingTop: 12, borderTopWidth: 1 },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    itemName: { fontSize: 13, fontWeight: '600' },
    itemQty: { fontSize: 13, fontWeight: '900' },
    deleteBtn: { marginTop: 16, alignSelf: 'flex-end' },
    modalContent: { padding: 24, paddingTop: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 20, fontWeight: '900' },
    label: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
    input: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginBottom: 12 },
    row: { flexDirection: 'row', gap: 12 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1 },
    unitToggle: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4, height: 50, flex: 1 },
    unitBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
});
