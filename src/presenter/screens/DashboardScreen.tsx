import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../domain/useStore';
import { useNavigation } from '@react-navigation/native';
import { Theme } from '../../core/theme';
import { Card } from '../components/Card';
import { QuickProductModal } from '../components/QuickProductModal';
import { useAppTheme } from '../../core/contexts/ThemeContext';

const { width } = Dimensions.get('window');

export function DashboardScreen() {
    const { products, sales, stats, refreshAll, addProduct } = useStore();
    const { colors, isDark, toggleTheme } = useAppTheme();
    const navigation = useNavigation<any>();

    const [productModalVisible, setProductModalVisible] = useState(false);
    
    useEffect(() => {
        refreshAll();
    }, [refreshAll]);

    const totalItems = products.length;
    const totalStockCount = products.reduce((sum, p) => sum + p.quantity, 0);
    const lowStockItems = products.filter(p => p.quantity <= 10);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.surface }]}>
                <View>
                    <Text style={[styles.headerAccent, { color: colors.primary }]}>BUSINESS INTELLIGENCE</Text>
                    <Text style={[styles.title, { color: colors.text }]}>Operation Center</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={[styles.themeToggle, { backgroundColor: isDark ? colors.primaryLight : '#F3E8FF' }]} onPress={toggleTheme}>
                        <Text style={styles.themeToggleIcon}>{isDark ? '☀️' : '🌙'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.userProfile, { backgroundColor: isDark ? colors.primaryLight : '#F3E8FF' }]}>
                        <Text style={[styles.userInitial, { color: colors.primary }]}>M</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={false}
            >
                {/* Main Financial Card */}
                <Card style={styles.heroCard}>
                    <Text style={styles.heroLabel}>TOTAL NET PROFIT</Text>
                    <Text style={styles.heroValue}>SSP {stats.netProfit.toLocaleString()}</Text>
                    <View style={styles.heroBadge}>
                        <Text style={styles.heroBadgeText}>{stats.profitMargin.toFixed(1)}% MARGIN</Text>
                    </View>
                </Card>

                <Text style={[styles.sectionHeader, { color: colors.text }]}>Quick Actions</Text>
                <View style={styles.actionRow}>
                    <TouchableOpacity 
                        style={[styles.actionCard, { backgroundColor: isDark ? '#1E293B' : '#EEF2FF' }]}
                        onPress={() => setProductModalVisible(true)}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#4F46E5' }]}>
                            <Text style={styles.actionIconText}>+</Text>
                        </View>
                        <Text style={[styles.actionLabel, { color: colors.text }]}>Add Product</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.actionCard, { backgroundColor: isDark ? '#1E293B' : '#ECFDF5' }]}
                        onPress={() => navigation.navigate('Sell')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#10B981' }]}>
                            <Text style={styles.actionIconText}>$</Text>
                        </View>
                        <Text style={[styles.actionLabel, { color: colors.text }]}>Record Sale</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.actionCard, { backgroundColor: isDark ? '#1E293B' : '#FFF7ED' }]}
                        onPress={() => navigation.navigate('Logistics')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#F97316' }]}>
                            <Text style={styles.actionIconText}>📦</Text>
                        </View>
                        <Text style={[styles.actionLabel, { color: colors.text }]}>Log Shipment</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.gridRow}>
                    <Card style={styles.gridCard}>
                        <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Sales Revenue</Text>
                        <Text style={[styles.gridValue, { color: colors.text }]}>SSP {stats.totalSalesRevenue.toLocaleString()}</Text>
                        <Text style={[styles.gridCaption, { color: colors.textMuted }]}>{sales.length} orders total</Text>
                    </Card>
                    <Card style={styles.gridCard}>
                        <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Inventory Value</Text>
                        <Text style={[styles.gridValue, { color: colors.secondary }]}>SSP {stats.totalInventoryValue.toLocaleString()}</Text>
                        <Text style={[styles.gridCaption, { color: colors.textMuted }]}>{totalItems} items listed</Text>
                    </Card>
                </View>

                <Text style={[styles.sectionHeader, { color: colors.text }]}>Inventory Performance</Text>
                <Card style={styles.statsCard}>
                    <View style={styles.statLine}>
                        <View style={styles.statInfo}>
                            <Text style={[styles.statLabelMain, { color: colors.text }]}>Stock Level</Text>
                            <Text style={[styles.statSubText, { color: colors.textMuted }]}>Total units in warehouse</Text>
                        </View>
                        <Text style={[styles.statBigValue, { color: colors.text }]}>{totalStockCount}</Text>
                    </View>
                    <View style={styles.statLine}>
                        <View style={styles.statInfo}>
                            <Text style={[styles.statLabelMain, { color: colors.text }]}>Low Stock Alerts</Text>
                            <Text style={[styles.statSubText, { color: colors.textMuted }]}>{lowStockItems.length} items below threshold</Text>
                        </View>
                        <Text style={[styles.statBigValue, { color: lowStockItems.length > 0 ? colors.error : colors.text }]}>{lowStockItems.length}</Text>
                    </View>
                </Card>

                {products.length > 0 && <Text style={[styles.sectionHeader, { color: colors.text }]}>Recent Inventory</Text>}
                {products.sort((a, b) => b.id - a.id).slice(0, 5).map(product => (
                    <Card 
                        key={product.id} 
                        style={styles.recentProductCard}
                        onPress={() => navigation.navigate('ProductDetails', { productId: product.id })}
                    >
                        <View style={[styles.recentProductIcon, { backgroundColor: isDark ? colors.primaryLight : '#F3E8FF' }]}>
                            <Text style={[styles.recentProductIconText, { color: colors.primary }]}>{product.name[0]}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.recentProductName, { color: colors.text }]}>{product.name}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.recentProductPrice, { color: colors.primary }]}>SSP {product.sell_price.toFixed(0)}</Text>
                            <Text style={[styles.recentProductQty, { color: product.quantity <= 10 ? colors.error : colors.textMuted }]}>
                                {product.quantity} left
                            </Text>
                        </View>
                    </Card>
                ))}

                <View style={{ height: 120 }} />
            </ScrollView>

            <QuickProductModal 
                visible={productModalVisible} 
                onClose={() => setProductModalVisible(false)} 
                onAdd={addProduct} 
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { 
        paddingHorizontal: 24, 
        paddingTop: 60, 
        paddingBottom: 20, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
    },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerAccent: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 2 },
    title: { fontSize: 26, fontWeight: '900', letterSpacing: -1 },
    themeToggle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    themeToggleIcon: { fontSize: 18 },
    userProfile: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    userInitial: { fontWeight: 'bold' },

    scrollContent: { padding: 24 },
    heroCard: { backgroundColor: '#7C3AED', padding: 24, borderRadius: 24, marginBottom: 32 },
    heroLabel: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5, marginBottom: 8 },
    heroValue: { fontSize: 32, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1 },
    heroBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginTop: 16 },
    heroBadgeText: { fontSize: 10, fontWeight: '900', color: '#FFFFFF' },

    sectionHeader: { fontSize: 13, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 },
    
    actionRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
    actionCard: { flex: 1, padding: 16, borderRadius: 20, alignItems: 'center' },
    actionIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    actionIconText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
    actionLabel: { fontSize: 10, fontWeight: '900', textAlign: 'center' },

    gridRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
    gridCard: { flex: 1, padding: 20, borderRadius: 20 },
    gridLabel: { fontSize: 11, fontWeight: '800', marginBottom: 12 },
    gridValue: { fontSize: 16, fontWeight: '900' },
    gridCaption: { fontSize: 10, marginTop: 4, fontWeight: '600' },

    statsCard: { padding: 24, borderRadius: 24, marginBottom: 32 },
    statLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
    statInfo: { flex: 1 },
    statLabelMain: { fontSize: 14, fontWeight: '800' },
    statSubText: { fontSize: 11, marginTop: 2 },
    statBigValue: { fontSize: 20, fontWeight: '900' },

    recentProductCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12, gap: 16 },
    recentProductIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    recentProductIconText: { fontWeight: '900', fontSize: 16 },
    recentProductName: { fontSize: 14, fontWeight: '700' },
    recentProductPrice: { fontSize: 13, fontWeight: '900' },
    recentProductQty: { fontSize: 10, marginTop: 2, fontWeight: '700' },
});
