/**
 * src/presenter/screens/AuthScreen.tsx
 * ─────────────────────────────────────────────────────────────
 * Unified authentication screen combining Sign In and Create
 * Account modes. Handles:
 *   - Email / Password sign-in via Supabase Auth
 *   - Account creation with Full Name and Store Name, followed
 *     by an INSERT into user_profiles
 *   - Forgot password flow via resetPasswordForEmail
 * ─────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../../core/contexts/ThemeContext';
import { supabase } from '../../data/supabase';

type Mode = 'signin' | 'signup';

export function AuthScreen() {
  const { colors } = useAppTheme();

  const [mode,      setMode]      = useState<Mode>('signin');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [fullName,  setFullName]  = useState('');
  const [storeName, setStoreName] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const resetError = () => setError(null);

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }
    if (mode === 'signup' && (!fullName.trim() || !storeName.trim())) {
      setError('Full name and store name are required.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error: authErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authErr) throw authErr;
      } else {
        const { data, error: signUpErr } = await supabase.auth.signUp({ email: email.trim(), password });
        if (signUpErr) throw signUpErr;

        // Create user_profiles row
        if (data?.user?.id) {
          const { error: profileErr } = await supabase
            .from('user_profiles')
            .insert({
              id:         data.user.id,
              full_name:  fullName.trim(),
              store_name: storeName.trim(),
              role:       'owner',
            });
          if (profileErr) console.error('[AuthScreen] Profile insert:', profileErr.message);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password ──────────────────────────────────────
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Enter your email address first, then tap Forgot Password.');
      return;
    }
    setLoading(true);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (resetErr) throw resetErr;
      Alert.alert('Check your inbox', `A password reset link has been sent to ${email.trim()}.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Reset failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Input style helper ────────────────────────────────────
  const inputStyle = [
    styles.input,
    { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text },
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo / Icon */}
        <View style={[styles.logoBox, { backgroundColor: colors.primary }]}>
          <Feather name="shopping-bag" size={48} color="#FFFFFF" />
        </View>

        <Text style={[styles.heading, { color: colors.text }]}>
          {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
        </Text>
        <Text style={[styles.subheading, { color: colors.textMuted }]}>
          {mode === 'signin'
            ? 'Sign in to your store manager'
            : 'Set up your store in seconds'}
        </Text>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Sign-up extra fields */}
          {mode === 'signup' && (
            <>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
              <TextInput
                style={inputStyle}
                placeholder="Jane Doe"
                placeholderTextColor={colors.textMuted}
                value={fullName}
                onChangeText={(t) => { setFullName(t); resetError(); }}
                autoCapitalize="words"
              />
              <Text style={[styles.label, { color: colors.textSecondary }]}>Store Name</Text>
              <TextInput
                style={inputStyle}
                placeholder="My Awesome Store"
                placeholderTextColor={colors.textMuted}
                value={storeName}
                onChangeText={(t) => { setStoreName(t); resetError(); }}
                autoCapitalize="words"
              />
            </>
          )}

          {/* Email */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
          <TextInput
            style={inputStyle}
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={(t) => { setEmail(t); resetError(); }}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          {/* Password */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
          <TextInput
            style={inputStyle}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={(t) => { setPassword(t); resetError(); }}
            secureTextEntry
          />

          {/* Error message */}
          {error !== null && (
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Forgot password (sign-in only) */}
          {mode === 'signin' && (
            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn}>
              <Text style={[styles.forgotText, { color: colors.primary }]}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Toggle mode */}
        <TouchableOpacity
          style={styles.toggleBtn}
          onPress={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); resetError(); }}
        >
          <Text style={[styles.toggleText, { color: colors.textMuted }]}>
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <Text style={{ color: colors.primary, fontWeight: '800' }}>
              {mode === 'signin' ? 'Create one' : 'Sign In'}
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  scroll:       { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logoBox:      { width: 88, height: 88, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  heading:      { fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 6 },
  subheading:   { fontSize: 14, textAlign: 'center', marginBottom: 32 },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    gap: 4,
  },
  label:       { fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 8 },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    marginBottom: 4,
  },
  errorText:   { fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 8, marginBottom: 4 },
  submitBtn: {
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  forgotBtn:     { alignItems: 'center', marginTop: 12 },
  forgotText:    { fontSize: 13, fontWeight: '600' },
  toggleBtn:     { marginTop: 24 },
  toggleText:    { fontSize: 14 },
});
