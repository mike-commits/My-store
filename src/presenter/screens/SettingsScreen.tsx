/**
 * src/presenter/screens/SettingsScreen.tsx
 * User profile, store configuration, theme toggle, and sign-out.
 * Replaces the old Settings tab referenced in App.tsx.
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAppTheme }           from '../../core/contexts/ThemeContext';
import { useAuth }               from '../../core/contexts/AuthContext';
import { supabase }              from '../../data/supabase';

type FeatherName = React.ComponentProps<typeof Feather>['name'];

interface SettingRowProps {
  icon:     FeatherName;
  label:    string;
  value?:   string;
  right?:   React.ReactNode;
  onPress?: () => void;
  color?:   string;
}

export function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useAppTheme();
  const { user } = useAuth();

  const meta      = user?.user_metadata as { full_name?: string; store_name?: string } | undefined;
  const email     = user?.email ?? '—';
  const fullName  = meta?.full_name ?? '—';
  const storeName = meta?.store_name ?? '—';
  const initials  = fullName !== '—' ? fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() : '?';

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await supabase.auth.signOut();
      }},
    ]);
  };

  const handleClearCache = async () => {
    try {
      await AsyncStorage.clear();
      Alert.alert('Done', 'Local cache cleared. Restart the app to reload data.');
    } catch {
      Alert.alert('Error', 'Failed to clear cache.');
    }
  };

  const SettingRow = ({ icon, label, value, right, onPress, color }: SettingRowProps) => (
    <TouchableOpacity
      disabled={!onPress}
      onPress={onPress}
      style={[styles.settingRow, { borderBottomColor: colors.border }]}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.settingIcon, { backgroundColor: (color ?? colors.primary) + '18' }]}>
        <Feather name={icon} size={16} color={color ?? colors.primary} />
      </View>
      <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
      <View style={styles.settingRight}>
        {value && <Text style={[styles.settingValue, { color: colors.textMuted }]} numberOfLines={1}>{value}</Text>}
        {right}
        {onPress && !right && <Feather name="chevron-right" size={16} color={colors.textMuted} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.pageHeader}>
          <Text style={[styles.headerAccent, { color: colors.primary }]}>CONFIGURATION</Text>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        </View>

        {/* Avatar + identity card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: colors.text }]}>{fullName}</Text>
            <Text style={[styles.profileStore, { color: colors.primary }]}>{storeName}</Text>
            <Text style={[styles.profileEmail, { color: colors.textMuted }]}>{email}</Text>
          </View>
        </View>

        {/* Appearance */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>APPEARANCE</Text>
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow
            icon="moon"
            label="Dark Mode"
            right={<Switch value={isDark} onValueChange={toggleTheme} trackColor={{ true: colors.primary }} thumbColor="#FFF" />}
          />
        </View>

        {/* Account */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ACCOUNT</Text>
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow icon="user"   label="Full Name"   value={fullName} />
          <SettingRow icon="shopping-bag" label="Store Name" value={storeName} />
          <SettingRow icon="mail"   label="Email"       value={email} />
        </View>

        {/* Data */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>DATA</Text>
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow icon="refresh-cw" label="Clear Local Cache" onPress={handleClearCache} color={colors.warning} />
        </View>

        {/* Danger zone */}
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.error + '40', marginTop: 12 }]}>
          <SettingRow icon="log-out" label="Sign Out" onPress={handleSignOut} color={colors.error} />
        </View>

        {/* Version */}
        <Text style={[styles.versionText, { color: colors.textMuted }]}>My Store • v1.0.0</Text>
        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1 },
  scroll:        { paddingHorizontal: 24 },
  pageHeader:    { paddingTop: 8, marginBottom: 24 },
  headerAccent:  { fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  title:         { fontSize: 26, fontWeight: '900' },
  profileCard:   { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 28 },
  avatar:        { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  avatarText:    { color: '#FFF', fontWeight: '900', fontSize: 18 },
  profileName:   { fontSize: 16, fontWeight: '900' },
  profileStore:  { fontSize: 12, fontWeight: '700', marginTop: 2 },
  profileEmail:  { fontSize: 12, marginTop: 2 },
  sectionTitle:  { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10, marginTop: 20 },
  group:         { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  settingRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  settingIcon:   { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  settingLabel:  { flex: 1, fontSize: 14, fontWeight: '600' },
  settingRight:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingValue:  { fontSize: 13, maxWidth: 120 },
  versionText:   { textAlign: 'center', fontSize: 12, marginTop: 32 },
});
