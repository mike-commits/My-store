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
    const { colors } = useAppTheme();

    return (
        <View style={styles.container}>
            <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
                <Feather name={icon} size={48} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>{body}</Text>
            
            {ctaLabel && onCtaPress && (
                <TouchableOpacity 
                    style={[styles.button, { backgroundColor: colors.primary }]}
                    onPress={onCtaPress}
                >
                    <Text style={styles.buttonText}>{ctaLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 8,
        textAlign: 'center',
    },
    body: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 32,
    },
    button: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 15,
    },
});
