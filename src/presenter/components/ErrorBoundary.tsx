/**
 * src/presenter/components/ErrorBoundary.tsx
 * ─────────────────────────────────────────────────────────────
 * React class-based error boundary. Catches render errors and
 * shows a fallback UI with a retry button.
 * Accepts an optional `fallback` prop to override the default
 * error screen.
 * ─────────────────────────────────────────────────────────────
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface Props {
  children:  ReactNode;
  /** Optional custom fallback UI. Rendered instead of the default screen. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error:    Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (__DEV__) {
      console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }
  }

  public render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <View style={styles.container}>
        <Feather name="alert-triangle" size={48} color="#EF4444" style={styles.icon} />
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>
          {this.state.error?.message ?? 'An unexpected error occurred.'}
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => this.setState({ hasError: false, error: null })}
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FAF9FF',
  },
  icon:       { marginBottom: 20 },
  title:      { fontSize: 22, fontWeight: '900', color: '#1F2937', marginBottom: 12, textAlign: 'center' },
  message:    { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  button:     { backgroundColor: '#7C3AED', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
