import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Switch, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../core/contexts/ThemeContext';
import { useAuth } from '../../core/contexts/AuthContext';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function SettingsScreen() {
    const { colors, isDark, toggleTheme } = useAppTheme();
    const { user, signOut } = useAuth();
    
    const [storeName, setStoreName] = useState('My Retail Store');
    const [currency, setCurrency] = useState('SSP');
    const [taxRate, setTaxRate] = useState('0');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const saved = await AsyncStorage.getItem('app_settings');
            if (saved) {
                const data = JSON.parse(saved);
                setStoreName(data.storeName || 'My Retail Store');
                setCurrency(data.currency || 'SSP');
                setTaxRate(data.taxRate || '0');
                setNotificationsEnabled(data.notificationsEnabled ?? true);
            }
        } catch (e) {
            console.error('Failed to load settings', e);
        }
    };

    const saveSettings = async () => {
        try {
            const data = { storeName, currency, taxRate, notificationsEnabled };
            await AsyncStorage.setItem('app_settings', JSON.stringify(data));
            Alert.alert("Success", "Settings saved successfully");
        } catch (e) {
            Alert.alert("Error", "Failed to save settings");
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Store Information</Text>
                <Card style={styles.card}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Store Name</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            value={storeName}
                            onChangeText={setStoreName}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Currency Code</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            value={currency}
                            onChangeText={setCurrency}
                            placeholder="e.g. USD, SSP, EUR"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Tax Rate (%)</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            value={taxRate}
                            onChangeText={setTaxRate}
                            keyboardType="numeric"
                        />
                    </View>
                </Card>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>
                <Card style={styles.card}>
                    <View style={styles.settingRow}>
                        <View>
                            <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
                            <Text style={[styles.settingSub, { color: colors.textMuted }]}>Switch between light and dark themes</Text>
                        </View>
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{ false: '#CBD5E1', true: colors.primary }}
                        />
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.settingRow}>
                        <View>
                            <Text style={[styles.settingLabel, { color: colors.text }]}>Notifications</Text>
                            <Text style={[styles.settingSub, { color: colors.textMuted }]}>Low stock and delivery alerts</Text>
                        </View>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={setNotificationsEnabled}
                            trackColor={{ false: '#CBD5E1', true: colors.primary }}
                        />
                    </View>
                </Card>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
                <Card style={styles.card}>
                    <View style={styles.accountRow}>
                        <Feather name="user" size={20} color={colors.textSecondary} />
                        <Text style={[styles.accountEmail, { color: colors.text }]}>{user?.email}</Text>
                    </View>
                    <TouchableOpacity 
                        style={[styles.logoutButton, { borderColor: colors.error }]}
                        onPress={signOut}
                    >
                        <Feather name="log-out" size={18} color={colors.error} />
                        <Text style={[styles.logoutText, { color: colors.error }]}>Sign Out</Text>
                    </TouchableOpacity>
                </Card>

                <AppButton
                    title="Save All Changes"
                    onPress={saveSettings}
                    style={styles.saveButton}
                />
                
                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 24 },
    title: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
    scrollContent: { paddingHorizontal: 24 },
    sectionTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', marginTop: 24, marginBottom: 12 },
    card: { padding: 20, borderRadius: 20 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
    input: { height: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 15 },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    settingLabel: { fontSize: 15, fontWeight: '700' },
    settingSub: { fontSize: 12, marginTop: 2 },
    divider: { height: 1, marginVertical: 16 },
    accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
    accountEmail: { fontSize: 15, fontWeight: '600' },
    logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
    logoutText: { fontWeight: '800', fontSize: 14 },
    saveButton: { marginTop: 32, height: 56, borderRadius: 16 },
});
