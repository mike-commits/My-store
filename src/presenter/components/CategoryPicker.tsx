import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, FlatList } from 'react-native';
import { AppButton } from './AppButton';
import { useAppTheme } from '../../core/contexts/ThemeContext';

interface CategoryPickerProps {
    value: string;
    onSelect: (category: string) => void;
    categories: string[];
}

export function CategoryPicker({ value, onSelect, categories }: CategoryPickerProps) {
    const [pickerVisible, setPickerVisible] = useState(false);
    const { colors, isDark } = useAppTheme();

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: colors.textMuted }]}>CATEGORY</Text>
            <AppButton 
                title={value || 'Select Category'} 
                type="outline" 
                onPress={() => setPickerVisible(true)}
                style={styles.dropdownTrigger}
                textStyle={{ color: value ? colors.text : colors.textMuted }}
            />

            <Modal visible={pickerVisible} transparent animationType="fade">
                <View style={styles.dropdownModalOverlay}>
                    <View style={[styles.dropdownModalContent, { backgroundColor: colors.surface, ...colors.cardShadow }]}>
                        <View style={styles.dropdownHeader}>
                            <Text style={[styles.dropdownTitle, { color: colors.text }]}>Select Category</Text>
                            <AppButton title="✕" type="ghost" onPress={() => setPickerVisible(false)} />
                        </View>
                        <FlatList 
                            data={categories}
                            keyExtractor={item => item}
                            renderItem={({ item }) => (
                                <AppButton 
                                    title={item} 
                                    type={item === value ? 'primary' : 'ghost'}
                                    onPress={() => {
                                        onSelect(item);
                                        setPickerVisible(false);
                                    }}
                                    style={styles.dropdownOption}
                                    textStyle={{ textAlign: 'left', width: '100%', color: item === value ? '#FFF' : colors.text }}
                                />
                            )}
                            style={{ maxHeight: 400 }}
                        />
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
