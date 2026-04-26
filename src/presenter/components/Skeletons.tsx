import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useAppTheme } from '../../core/contexts/ThemeContext';

interface SkeletonProps {
    width?: number | string;
    height: number;
    borderRadius?: number;
    style?: any;
}

export function Skeleton({ width = '100%', height, borderRadius = 8, style }: SkeletonProps) {
    const { colors, isDark } = useAppTheme();
    const pulseAnim = new Animated.Value(0.3);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 0.7,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.3,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const backgroundColor = isDark ? '#1E293B' : '#E2E8F0';

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor,
                    opacity: pulseAnim,
                },
                style,
            ]}
        />
    );
}

export function CardSkeleton() {
    return (
        <View style={styles.card}>
            <Skeleton height={20} width="60%" style={{ marginBottom: 12 }} />
            <Skeleton height={40} width="80%" style={{ marginBottom: 16 }} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
                <Skeleton height={24} width={80} borderRadius={6} />
                <Skeleton height={24} width={80} borderRadius={6} />
            </View>
        </View>
    );
}

export function ListItemSkeleton() {
    return (
        <View style={styles.listItem}>
            <Skeleton height={40} width={40} borderRadius={12} />
            <View style={{ flex: 1, gap: 6 }}>
                <Skeleton height={16} width="70%" />
                <Skeleton height={12} width="40%" />
            </View>
            <View style={{ gap: 6, alignItems: 'flex-end' }}>
                <Skeleton height={16} width={60} />
                <Skeleton height={12} width={40} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 24,
        borderRadius: 24,
        backgroundColor: 'rgba(0,0,0,0.02)',
        marginBottom: 20,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 16,
        marginBottom: 12,
    },
});
