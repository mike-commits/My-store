import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../domain/useStore';
import { useNavigation } from '@react-navigation/native';
import { Card } from '../components/Card';
import { QuickProductModal } from '../components/QuickProductModal';
import { useAppTheme } from '../../core/contexts/ThemeContext';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Feather } from '@expo/vector-icons';

export function DashboardScreen() {
    const { products, sales, stats, refreshAll, addProduct } = useStore();
    const { colors, isDark, toggleTheme } = useAppTheme();
    const navigation = useNavigation<any>();

    const [productModalVisible, setProductModalVisible] = useState(false);
    const [chartWidth, setChartWidth] = useState(Dimensions.get('window').width - 48);

    const onLayout = (event: any) => {
        const { width } = event.nativeEvent.layout;
        setChartWidth(width);
    };

    const hexToRgba = (hex: string, opacity: number = 1) => {
        if (!hex || !hex.startsWith('#')) return `rgba(0,0,0,${opacity})`;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    const salesTrendData = useMemo(() => {
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
        });

        const dailyRevenue = last7Days.map(date => {
            return sales
                .filter(s => s.date.startsWith(date))
                .reduce((sum, s) => sum + (s.sell_price * s.quantity), 0);
        });

        return {
            labels: last7Days.map(d => {
                const parts = d.split('-');
                return `${parts[1]}/${parts[2]}`;
            }),
            datasets: [
                {
                    data: dailyRevenue.some(v => v > 0) ? dailyRevenue : [0,0,0,0,0,0,0],
                    color: (opacity = 1) => hexToRgba(colors.primary, opacity),
                    strokeWidth: 4,
                }
            ],
            legend: ["Revenue (Daily)"]
        };
    }, [sales, colors.primary]);

    const productPieData = useMemo(() => {
        const chartColors = ['#8B5CF6', '#10B981', '#3B82F6', '#F59E0B', '#EC4899'];
        return products
            .map((p, idx) => ({
                name: p.name.substring(0, 10),
                revenue: sales.filter(s => s.product_id === p.id).reduce((sum, s) => sum + (s.sell_price * s.quantity), 0),
                color: chartColors[idx % chartColors.length],
                legendFontColor: colors.textSecondary,
                legendFontSize: 11
            }))
            .filter(p => p.revenue > 0)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
    }, [products, sales, colors.textSecondary]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.headerAccent, { color: colors.primary }]}>OVERVIEW</Text>
                    <Text style={[styles.title, { color: colors.text }]}>Operation Center</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={[styles.settingsBtn, { backgroundColor: colors.surface }]}>
                    <Feather name="settings" size={20} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} onLayout={onLayout} showsVerticalScrollIndicator={false}>
                <Card style={styles.heroCard}>
                    <Text style={styles.heroLabel}>NET PROFIT</Text>
                    <Text style={styles.heroValue}>SSP {stats.netProfit.toLocaleString()}</Text>
                    <View style={styles.heroStats}>
                        <View>
                            <Text style={styles.heroSubLabel}>REVENUE</Text>
                            <Text style={styles.heroSubValue}>SSP {stats.totalRevenue.toLocaleString()}</Text>
                        </View>
                        <View style={styles.heroDivider} />
                        <View>
                            <Text style={styles.heroSubLabel}>CASH FLOW</Text>
                            <Text style={styles.heroSubValue}>SSP {stats.availableCash.toLocaleString()}</Text>
                        </View>
                    </View>
                </Card>

                {stats.lowStockCount > 0 && (
                    <TouchableOpacity onPress={() => navigation.navigate('Items')} style={[styles.alertBar, { backgroundColor: colors.error + '15', borderColor: colors.error + '40' }]}>
                        <Feather name="alert-triangle" size={18} color={colors.error} />
                        <Text style={[styles.alertText, { color: colors.error }]}>{stats.lowStockCount} items are running low on stock!</Text>
                    </TouchableOpacity>
                )}

                <View style={styles.actionRow}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surface }]} onPress={() => setProductModalVisible(true)}>
                        <View style={[styles.iconBox, { backgroundColor: colors.primary }]}>
                            <Feather name="plus" size={20} color="#FFF" />
                        </View>
                        <Text style={[styles.actionLabel, { color: colors.text }]}>Add Item</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surface }]} onPress={() => navigation.navigate('Sell')}>
                        <View style={[styles.iconBox, { backgroundColor: colors.success }]}>
                            <Feather name="dollar-sign" size={20} color="#FFF" />
                        </View>
                        <Text style={[styles.actionLabel, { color: colors.text }]}>Record Sale</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surface }]} onPress={() => navigation.navigate('Shipments')}>
                        <View style={[styles.iconBox, { backgroundColor: colors.warning }]}>
                            <Feather name="truck" size={20} color="#FFF" />
                        </View>
                        <Text style={[styles.actionLabel, { color: colors.text }]}>Log Ship</Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Revenue Trend</Text>
                <Card style={styles.chartCard}>
                    {chartWidth > 0 && (
                        <LineChart
                            data={salesTrendData}
                            width={chartWidth - 48}
                            height={180}
                            chartConfig={{
                                backgroundGradientFrom: colors.surface,
                                backgroundGradientTo: colors.surface,
                                color: (opacity = 1) => hexToRgba(colors.primary, opacity),
                                labelColor: (opacity = 1) => colors.textMuted,
                                decimalPlaces: 0,
                                propsForDots: { r: "0" },
                                propsForBackgroundLines: { strokeDasharray: "5", stroke: colors.border }
                            }}
                            bezier
                            style={{ borderRadius: 16 }}
                        />
                    )}
                </Card>

                {productPieData.length > 0 && (
                    <Card style={styles.chartCard}>
                        <PieChart
                            data={productPieData}
                            width={chartWidth - 48}
                            height={160}
                            chartConfig={{ color: () => colors.primary }}
                            accessor="revenue"
                            backgroundColor="transparent"
                            paddingLeft="0"
                            absolute
                        />
                    </Card>
                )}

                <TouchableOpacity 
                    onPress={() => navigation.navigate('Reports')}
                    style={[styles.reportsLink, { backgroundColor: colors.primary }]}
                >
                    <Text style={styles.reportsLinkText}>View Detailed Business Reports</Text>
                    <Feather name="chevron-right" size={20} color="#FFF" />
                </TouchableOpacity>

                <View style={{ height: 100 }} />
            </ScrollView>

            <QuickProductModal visible={productModalVisible} onClose={() => setProductModalVisible(false)} onAdd={addProduct} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerAccent: { fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
    title: { fontSize: 24, fontWeight: '900' },
    settingsBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
    scrollContent: { padding: 24 },
    heroCard: { backgroundColor: '#7C3AED', padding: 24, borderRadius: 24, marginBottom: 20 },
    heroLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    heroValue: { color: '#FFF', fontSize: 32, fontWeight: '900', marginVertical: 12 },
    heroStats: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 8 },
    heroSubLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 8, fontWeight: '900' },
    heroSubValue: { color: '#FFF', fontSize: 14, fontWeight: '800', marginTop: 2 },
    heroDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.2)' },
    alertBar: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 24 },
    alertText: { fontSize: 13, fontWeight: '700' },
    actionRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
    actionBtn: { flex: 1, padding: 12, borderRadius: 16, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
    iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    actionLabel: { fontSize: 11, fontWeight: '800' },
    sectionTitle: { fontSize: 14, fontWeight: '900', textTransform: 'uppercase', marginBottom: 16 },
    chartCard: { padding: 12, borderRadius: 20, marginBottom: 16, alignItems: 'center' },
    reportsLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderRadius: 16, marginTop: 8 },
    reportsLinkText: { color: '#FFF', fontSize: 15, fontWeight: '800' }
});
