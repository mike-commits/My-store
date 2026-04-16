import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, StyleProp } from 'react-native';
import { Theme } from '../../core/theme';
import { useAppTheme } from '../../core/contexts/ThemeContext';

interface CardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    onPress?: () => void;
}

export const Card = ({ children, style, onPress }: CardProps) => {
    const { colors } = useAppTheme();
    
    const cardStyle = [
        styles.card, 
        { 
            backgroundColor: colors.card,
            ...colors.cardShadow,
        },
        style
    ];

    if (onPress) {
        return (
            <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
                {children}
            </TouchableOpacity>
        );
    }
    return (
        <View style={cardStyle}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: Theme.borderRadius.lg,
        padding: Theme.spacing.md,
        marginBottom: Theme.spacing.md,
    }
});
