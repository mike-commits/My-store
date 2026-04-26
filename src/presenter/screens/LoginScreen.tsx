import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { supabase } from '../../data/supabase';
import { useAppTheme } from '../../core/contexts/ThemeContext';
import { AuthSchema } from '../../domain/validation';
import { AppButton } from '../components/AppButton';
import { SignupScreen } from './SignupScreen';

export function LoginScreen() {
    const { colors, isDark } = useAppTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSignup, setShowSignup] = useState(false);

    if (showSignup) {
        return <SignupScreen onBackToLogin={() => setShowSignup(false)} />;
    }

    const handleLogin = async () => {
        try {
            setError(null);
            setLoading(true);

            // Validation
            const result = AuthSchema.safeParse({ email, password });
            if (!result.success) {
                setError(result.error.errors[0].message);
                return;
            }

            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Log in to your retail manager</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
                        <TextInput
                            style={[styles.input, { 
                                backgroundColor: colors.surface, 
                                color: colors.text,
                                borderColor: colors.border
                            }]}
                            placeholder="you@example.com"
                            placeholderTextColor={colors.textMuted}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
                        <TextInput
                            style={[styles.input, { 
                                backgroundColor: colors.surface, 
                                color: colors.text,
                                borderColor: colors.border
                            }]}
                            placeholder="••••••••"
                            placeholderTextColor={colors.textMuted}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    {error && (
                        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                    )}

                    <AppButton
                        title="Login"
                        onPress={handleLogin}
                        loading={loading}
                        style={styles.loginButton}
                    />

                    <TouchableOpacity 
                        style={styles.signupLink}
                        onPress={() => setShowSignup(true)}
                    >
                        <Text style={{ color: colors.textSecondary }}>
                            Don't have an account? <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Sign Up</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    header: { marginBottom: 40 },
    title: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
    subtitle: { fontSize: 16, marginTop: 8 },
    form: { gap: 20 },
    inputGroup: { gap: 8 },
    label: { fontSize: 14, fontWeight: '600' },
    input: {
        height: 56,
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        fontSize: 16,
    },
    errorText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
    loginButton: { height: 56, borderRadius: 16 },
    signupLink: { alignItems: 'center', marginTop: 12 },
});
