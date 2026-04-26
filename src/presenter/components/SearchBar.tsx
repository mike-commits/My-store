import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../../core/contexts/ThemeContext';

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    onBarcodePress?: () => void;
}

export function SearchBar({ value, onChangeText, placeholder = "Search...", onBarcodePress }: SearchBarProps) {
    const { colors, isDark } = useAppTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Feather name="search" size={20} color={colors.textMuted} style={styles.icon} />
            <TextInput
                style={[styles.input, { color: colors.text }]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.textMuted}
            />
            {onBarcodePress && (
                <TouchableOpacity onPress={onBarcodePress} style={styles.barcodeBtn}>
                    <Feather name="maximize" size={20} color={colors.primary} />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 56,
        borderRadius: 16,
        borderWidth: 1,
        marginHorizontal: 24,
        marginBottom: 20,
    },
    icon: { marginRight: 12 },
    input: { flex: 1, fontSize: 16, height: '100%' },
    barcodeBtn: { padding: 8 },
});
