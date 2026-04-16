import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { Theme } from '../../core/theme';
import { useAppTheme } from '../../core/contexts/ThemeContext';

interface ButtonProps {
    title: string;
    onPress: () => void;
    type?: 'primary' | 'secondary' | 'outline' | 'ghost';
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
}

export const AppButton = ({ title, onPress, type = 'primary', style, textStyle }: ButtonProps) => {
    const { colors } = useAppTheme();

    const getButtonStyle = () => {
        switch (type) {
            case 'secondary': return { backgroundColor: colors.secondary };
            case 'outline': return { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary };
            case 'ghost': return { backgroundColor: 'transparent' };
            default: return { backgroundColor: colors.primary };
        }
    };

    const getTextStyle = () => {
        switch (type) {
            case 'outline': return { color: colors.primary };
            case 'ghost': return { color: colors.textSecondary };
            default: return { color: '#FFF' };
        }
    };

    return (
        <TouchableOpacity style={[styles.button, getButtonStyle(), style]} onPress={onPress}>
            <Text style={[styles.text, getTextStyle(), textStyle]}>{title}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: Theme.spacing.md,
        paddingHorizontal: Theme.spacing.xl,
        borderRadius: Theme.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
    }
});
