import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../../core/contexts/ThemeContext';

interface EmptyStateProps {
    icon: keyof typeof Feather.glyphMap;
    title: string;
    body: string;
    ctaLabel?: string;
    onCtaPress?: () => void;
}

export function EmptyState({ icon, title, body, ctaLabel, onCtaPress }: EmptyStateProps) {
    const { colors, isDark } = useAppTheme();

    return (
        <View style={styles.container}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.surface }]}>
                <Feather name={icon} size={32} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>{body}</Text>
            {ctaLabel && onCtaPress && (
                <TouchableOpacity 
                    style={[styles.ctaButton, { backgroundColor: colors.primary }]}
                    onPress={onCtaPress}
                >
                    <Text style={styles.ctaText}>{ctaLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        marginTop: 40,
    },
    iconBox: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    body: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    ctaButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    ctaText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
