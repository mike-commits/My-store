import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { supabase } from '../../data/supabase';
import { useAppTheme } from '../../core/contexts/ThemeContext';
import { AuthSchema } from '../../domain/validation';
import { AppButton } from '../components/AppButton';

interface SignupScreenProps {
    onBackToLogin: () => void;
}

export function SignupScreen({ onBackToLogin }: SignupScreenProps) {
    const { colors } = useAppTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignup = async () => {
        try {
            setError(null);
            setLoading(true);

            const result = AuthSchema.safeParse({ email, password });
            if (!result.success) {
                setError(result.error.errors[0].message);
                return;
            }

            const { data, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;

            if (data.user && !data.session) {
                Alert.alert("Success", "Please check your email for the confirmation link.");
                onBackToLogin();
            }
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
                    <Text style={[styles.title, { color: colors.text }]}>Join Us</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Create your retail management account</Text>
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
                        <Text style={[styles.hint, { color: colors.textMuted }]}>Must be at least 6 characters</Text>
                    </View>

                    {error && (
                        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                    )}

                    <AppButton
                        title="Sign Up"
                        onPress={handleSignup}
                        loading={loading}
                        style={styles.signupButton}
                    />

                    <TouchableOpacity 
                        style={styles.loginLink}
                        onPress={onBackToLogin}
                    >
                        <Text style={{ color: colors.textSecondary }}>
                            Already have an account? <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Login</Text>
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
    hint: { fontSize: 12 },
    errorText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
    signupButton: { height: 56, borderRadius: 16, backgroundColor: '#10B981' },
    loginLink: { alignItems: 'center', marginTop: 12 },
});
