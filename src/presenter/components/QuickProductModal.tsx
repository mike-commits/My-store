import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, Alert, TouchableOpacity } from 'react-native';
import { AppButton } from './AppButton';
import { FormLayout } from './FormLayout';
import { useAppTheme } from '../../core/contexts/ThemeContext';

interface QuickProductModalProps {
    visible: boolean;
    onClose: () => void;
    onAdd: (product: any) => Promise<void>;
}

export function QuickProductModal({ visible, onClose, onAdd }: QuickProductModalProps) {
    const [name, setName] = useState('');
    const [buyPrice, setBuyPrice] = useState('');
    const [sellPrice, setSellPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [dateInput, setDateInput] = useState(() => new Date().toISOString().split('T')[0]);
    const [buyUnit, setBuyUnit] = useState<'pcs' | 'doz'>('pcs');
    const { colors, isDark } = useAppTheme();

    const handleSave = async () => {
        if (!name || !buyPrice || !sellPrice) {
            Alert.alert('Error', 'Please fill required fields');
            return;
        }
        try {
            let finalBuyPrice = parseFloat(buyPrice);
            let finalQuantity = parseInt(quantity, 10) || 0;

            if (buyUnit === 'doz') {
                finalBuyPrice = finalBuyPrice / 12;
                finalQuantity = finalQuantity * 12;
            }

            await onAdd({
                name,
                category: 'Others',
                buy_price: finalBuyPrice,
                sell_price: parseFloat(sellPrice),
                quantity: finalQuantity,
                date: new Date(dateInput).toISOString(),
                notes: 'Quick manual add'
            });
            onClose();
            setName('');
            setBuyPrice('');
            setSellPrice('');
            setQuantity('');
            setBuyUnit('pcs');
            setDateInput(new Date().toISOString().split('T')[0]);
        } catch (e: any) {
            Alert.alert('Form Error', e.message || 'Could not save product');
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <FormLayout contentContainerStyle={[styles.modalContainer, { backgroundColor: colors.surface }]}>
                <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Manual Entry</Text>
                    <AppButton title="✕" type="ghost" onPress={onClose} />
                </View>
                <Text style={[styles.label, { color: colors.textMuted }]}>PRODUCT NAME</Text>
                <TextInput style={[styles.input, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border, color: colors.text }]} placeholder="Product Name" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />
                
                <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { color: colors.textMuted }]}>
                            BUY PRICE {buyUnit === 'doz' ? '(SSP/DOZ)' : '(SSP/PC)'}
                        </Text>
                        <TextInput style={[styles.input, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border, color: colors.text }]} placeholder="0" placeholderTextColor={colors.textMuted} value={buyPrice} onChangeText={setBuyPrice} keyboardType="numeric" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { color: colors.textMuted }]}>SELL PRICE (SSP/PC)</Text>
                        <TextInput style={[styles.input, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border, color: colors.text }]} placeholder="0" placeholderTextColor={colors.textMuted} value={sellPrice} onChangeText={setSellPrice} keyboardType="numeric" />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                        <View style={styles.labelRow}>
                            <Text style={[styles.label, { color: colors.textMuted }]}>QTY</Text>
                            <View style={[styles.unitToggle, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
                                <TouchableOpacity 
                                    onPress={() => setBuyUnit('pcs')}
                                    style={[styles.unitBtn, buyUnit === 'pcs' && { backgroundColor: colors.primary }]}
                                >
                                    <Text style={[styles.unitBtnText, buyUnit === 'pcs' ? { color: '#FFF' } : { color: colors.textMuted }]}>PCS</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={() => setBuyUnit('doz')}
                                    style={[styles.unitBtn, buyUnit === 'doz' && { backgroundColor: colors.primary }]}
                                >
                                    <Text style={[styles.unitBtnText, buyUnit === 'doz' ? { color: '#FFF' } : { color: colors.textMuted }]}>DOZ</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <TextInput style={[styles.input, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border, color: colors.text }]} placeholder={buyUnit === 'doz' ? "0 doz" : "0 pcs"} placeholderTextColor={colors.textMuted} value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { color: colors.textMuted }]}>DATE (YYYY-MM-DD)</Text>
                        <TextInput style={[styles.input, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border, color: colors.text }]} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} value={dateInput} onChangeText={setDateInput} />
                    </View>
                </View>
                
                <AppButton title="Create Product" onPress={handleSave} style={{ marginTop: 20 }} />
            </FormLayout>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: { padding: 24, paddingTop: 60 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
    modalTitle: { fontSize: 24, fontWeight: '900' },
    label: { fontSize: 10, fontWeight: '900', marginBottom: 12, letterSpacing: 1 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    unitToggle: { 
        flexDirection: 'row', 
        borderRadius: 10, 
        padding: 4,
        alignItems: 'center'
    },
    unitBtn: { 
        paddingHorizontal: 12, 
        paddingVertical: 5, 
        borderRadius: 8,
        minWidth: 44,
        alignItems: 'center'
    },
    unitBtnText: { 
        fontSize: 10, 
        fontWeight: '900'
    },
    input: { padding: 16, borderRadius: 12, borderWidth: 1, fontSize: 16, marginBottom: 20 },
    row: { flexDirection: 'row', gap: 16 }
});
