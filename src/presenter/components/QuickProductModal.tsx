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
        backgroundColor: '#F1F5F9',
        borderRadius: 8, 
        padding: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    unitBtn: { 
        paddingHorizontal: 12, 
        paddingVertical: 5, 
        borderRadius: 6,
        minWidth: 40,
        alignItems: 'center'
    },
    unitBtnText: { 
        fontSize: 10, 
        fontWeight: '800', 
        color: '#64748B'
    },
    activeUnitBtn: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    activeUnitText: {
        color: '#000',
    },
    input: { padding: 16, borderRadius: 12, borderWidth: 1, fontSize: 16, marginBottom: 20 },
    row: { flexDirection: 'row', gap: 16 }
});
