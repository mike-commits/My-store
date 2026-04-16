import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../domain/useStore';
import { Product, Sale, ShipmentItem } from '../../domain/models';
import { Theme } from '../../core/theme';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { useAppTheme } from '../../core/contexts/ThemeContext';

export function ProductDetailsScreen({ route, navigation }: any) {
    const { productId } = route.params;
    const { products, getProductShipments, getProductSales } = useStore();
    const { colors, isDark } = useAppTheme();
    
    const [shipments, setShipments] = useState<(ShipmentItem & { date: string })[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    
    const product = products.find(p => p.id === productId);

    useEffect(() => {
        if (productId) {
            setShipments(getProductShipments(productId));
            setSales(getProductSales(productId));
        }
    }, [productId, products]);

    if (!product) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.text }}>Product not found</Text>
                <AppButton title="Go Back" onPress={() => navigation.goBack()} />
            </View>
        );
    }

    const totalSold = sales.reduce((sum, s) => sum + s.quantity, 0);
    const totalRevenue = sales.reduce((sum, s) => sum + (s.quantity * s.sell_price), 0);
    const totalCost = totalSold * product.buy_price;
    const estProfit = totalRevenue - totalCost;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.surface }]}>
                <AppButton title="←" type="ghost" onPress={() => navigation.goBack()} style={styles.backBtn} />
                <View>
                    <Text style={[styles.headerAccent, { color: colors.primary }]}>{product.category}</Text>
                    <Text style={[styles.title, { color: colors.text }]}>{product.name}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.statsRow}>
                    <Card style={[styles.statCard, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.7)' }]}>STOCK</Text>
                        <Text style={[styles.statValue, { color: '#FFFFFF' }]}>{product.quantity}</Text>
                        <Text style={[styles.statCaption, { color: 'rgba(255,255,255,0.8)' }]}>Units Available</Text>
                    </Card>
                    <Card style={[styles.statCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>SOLD</Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>{totalSold}</Text>
                        <Text style={[styles.statCaption, { color: colors.textSecondary }]}>Total Units</Text>
                    </Card>
                </View>

                <Card style={[styles.financeCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Financial Performance</Text>
                    <View style={styles.financeRow}>
                        <View style={styles.financeItem}>
                            <Text style={[styles.financeLabel, { color: colors.textMuted }]}>Total Revenue</Text>
                            <Text style={[styles.financeValue, { color: colors.text }]}>SSP {totalRevenue.toLocaleString()}</Text>
                        </View>
                        <View style={styles.financeItem}>
                            <Text style={[styles.financeLabel, { color: colors.textMuted }]}>Est. Profit</Text>
                            <Text style={[styles.financeValue, { color: colors.success }]}>SSP {estProfit.toLocaleString()}</Text>
                        </View>
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.priceRow}>
                        <View>
                            <Text style={[styles.priceLabel, { color: colors.textMuted }]}>Buy Price</Text>
                            <Text style={[styles.priceValue, { color: colors.textSecondary }]}>SSP {product.buy_price.toFixed(2)}</Text>
                        </View>
                        <View>
                            <Text style={[styles.priceLabel, { color: colors.textMuted }]}>Sell Price</Text>
                            <Text style={[styles.priceValue, { color: colors.textSecondary }]}>SSP {product.sell_price.toFixed(2)}</Text>
                        </View>
                        <View>
                            <Text style={[styles.priceLabel, { color: colors.textMuted }]}>Margin</Text>
                            <Text style={[styles.priceValue, { color: colors.secondary }]}>
                                SSP {(product.sell_price - product.buy_price).toFixed(2)}
                            </Text>
                        </View>
                    </View>
                </Card>

                <Text style={[styles.sectionHeader, { color: colors.text }]}>Activity History</Text>
                
                <View style={styles.historyContainer}>
                    <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.activeTab, { borderBottomColor: colors.primary, color: colors.primary }]}>All Activity</Text>
                    </View>

                    {[...sales.map(s => ({ ...s, type: 'sale' })), ...shipments.map(s => ({ ...s, type: 'shipment' }))]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((item: any, idx) => (
                            <View key={idx} style={[styles.historyItem, { backgroundColor: colors.surface }]}>
                                <View style={[styles.historyIcon, { backgroundColor: item.type === 'sale' ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5') : (isDark ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF') }]}>
                                    <Text>{item.type === 'sale' ? '💰' : '📦'}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.historyTitle, { color: colors.text }]}>
                                        {item.type === 'sale' ? 'Sale Processed' : 'Stock Received'}
                                    </Text>
                                    <Text style={[styles.historyDate, { color: colors.textMuted }]}>{new Date(item.date).toLocaleDateString()}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[styles.historyQty, { color: item.type === 'sale' ? colors.error : colors.success }]}>
                                        {item.type === 'sale' ? '-' : '+'}{item.quantity}
                                    </Text>
                                    <Text style={[styles.historyMeta, { color: colors.textMuted }]}>
                                        {item.type === 'sale' ? `SSP ${item.sell_price.toFixed(0)}` : 'Inventory In'}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    
                    {sales.length === 0 && shipments.length === 0 && (
                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>No activity recorded for this product.</Text>
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { 
        paddingHorizontal: 20, 
        paddingTop: 40, 
        paddingBottom: 20, 
        flexDirection: 'row', 
        alignItems: 'center',
        gap: 12
    },
    backBtn: { width: 40, height: 40, padding: 0 },
    headerAccent: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },
    title: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
    content: { padding: 20 },
    
    statsRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
    statCard: { flex: 1, padding: 20, borderRadius: 24 },
    statLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    statValue: { fontSize: 28, fontWeight: '900', marginVertical: 4 },
    statCaption: { fontSize: 11, fontWeight: '600' },

    financeCard: { padding: 24, borderRadius: 24 },
    sectionTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5, marginBottom: 20, textTransform: 'uppercase' },
    financeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    financeItem: { flex: 1 },
    financeLabel: { fontSize: 11, marginBottom: 4, fontWeight: '600' },
    financeValue: { fontSize: 18, fontWeight: '900' },
    divider: { height: 1, marginVertical: 16 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
    priceLabel: { fontSize: 9, textTransform: 'uppercase', marginBottom: 4, fontWeight: 'bold' },
    priceValue: { fontSize: 14, fontWeight: '800' },

    sectionHeader: { fontSize: 15, fontWeight: '900', marginTop: 32, marginBottom: 16 },
    historyContainer: { gap: 12 },
    tabs: { flexDirection: 'row', borderBottomWidth: 1, marginBottom: 8 },
    activeTab: { paddingBottom: 8, borderBottomWidth: 2, fontWeight: '900', fontSize: 12 },
    
    historyItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, gap: 12 },
    historyIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    historyTitle: { fontSize: 13, fontWeight: '800' },
    historyDate: { fontSize: 11, marginTop: 2 },
    historyQty: { fontSize: 14, fontWeight: '900' },
    historyMeta: { fontSize: 10, marginTop: 2, fontWeight: '600' },
    
    emptyText: { textAlign: 'center', marginTop: 40, fontStyle: 'italic' }
});
