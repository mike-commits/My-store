import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useAppTheme } from '../../core/contexts/ThemeContext';

interface SkeletonProps {
    width?: number | string;
    height?: number | string;
    borderRadius?: number;
    style?: any;
}

export function Skeleton({ width, height, borderRadius = 8, style }: SkeletonProps) {
    const { colors, isDark } = useAppTheme();
    const animatedValue = new Animated.Value(0);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    opacity,
                },
                style,
            ]}
        />
    );
}

export function ListItemSkeleton() {
    const { colors } = useAppTheme();
    return (
        <View style={[styles.listContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.listRow}>
                <View style={styles.textCol}>
                    <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
                    <Skeleton width="40%" height={12} />
                </View>
                <Skeleton width={80} height={20} />
            </View>
        </View>
    );
}

export function CardSkeleton() {
    const { colors } = useAppTheme();
    return (
        <View style={[styles.cardContainer, { backgroundColor: colors.surface }]}>
            <Skeleton width="40%" height={12} style={{ marginBottom: 12 }} />
            <Skeleton width="70%" height={24} style={{ marginBottom: 24 }} />
            <View style={styles.listRow}>
                <Skeleton width="30%" height={14} />
                <Skeleton width="30%" height={14} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    listContainer: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    listRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    textCol: {
        flex: 1,
        marginRight: 16,
    },
    cardContainer: {
        padding: 24,
        borderRadius: 20,
        marginBottom: 16,
    },
});
