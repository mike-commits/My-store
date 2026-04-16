import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView } from 'react-native';
import { AppButton } from './AppButton';
import { useAppTheme } from '../../core/contexts/ThemeContext';
import { Product } from '../../domain/models';

interface ProductPickerProps {
    value?: number | null;
    onSelect: (productId: number) => void;
    products: Product[];
    label?: string;
}

export function ProductPicker({ value, onSelect, products, label = 'SELECT PRODUCT' }: ProductPickerProps) {
    const [pickerVisible, setPickerVisible] = useState(false);
    const { colors } = useAppTheme();
    const selectedProduct = products.find(p => p.id === value);

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
            <AppButton 
                title={selectedProduct ? selectedProduct.name : 'Select Product'} 
                type="outline" 
                onPress={() => setPickerVisible(true)}
                style={styles.dropdownTrigger}
                textStyle={{ color: selectedProduct ? colors.text : colors.textMuted }}
            />

            <Modal visible={pickerVisible} transparent animationType="fade">
                <View style={[styles.dropdownModalOverlay]}>
                    <View style={[styles.dropdownModalContent, { backgroundColor: colors.surface, ...colors.cardShadow }]}>
                        <View style={styles.dropdownHeader}>
                            <Text style={[styles.dropdownTitle, { color: colors.text }]}>Select Product</Text>
                            <AppButton title="✕" type="ghost" onPress={() => setPickerVisible(false)} />
                        </View>
                        <ScrollView style={{ maxHeight: 400 }}>
                            {products.map(p => (
                                <AppButton 
                                    key={p.id}
                                    title={`${p.name} (Stock: ${p.quantity})`} 
                                    type={value === p.id ? 'primary' : 'ghost'}
                                    onPress={() => {
                                        onSelect(p.id);
                                        setPickerVisible(false);
                                    }}
                                    style={styles.dropdownOption}
                                    textStyle={{ textAlign: 'left', width: '100%', color: value === p.id ? '#FFF' : colors.text }}
                                />
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginBottom: 8 },
    label: { fontSize: 11, fontWeight: '900', marginBottom: 12, letterSpacing: 1 },
    dropdownTrigger: { marginBottom: 16, justifyContent: 'flex-start', paddingHorizontal: 16, height: 56, borderRadius: 12 },
    dropdownModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
    dropdownModalContent: { borderRadius: 24, padding: 24 },
    dropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    dropdownTitle: { fontSize: 18, fontWeight: '900' },
    dropdownOption: { marginBottom: 8, paddingVertical: 12, borderRadius: 12 },
});
