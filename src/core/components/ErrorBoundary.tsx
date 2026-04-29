import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../contexts/ThemeContext';

interface Props {
  children: ReactNode;
  colors: any;
}

interface State {
  hasError: boolean;
}

class ErrorBoundaryInner extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const { colors } = this.props;
      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Feather name="alert-circle" size={64} color={colors.error} />
          <Text style={[styles.title, { color: colors.text }]}>Something went wrong</Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={styles.buttonText}>Try again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={() => {/* Add reload app logic if needed */}}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Reload app</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

export function ErrorBoundary(props: { children: ReactNode }) {
  const { colors } = useAppTheme();
  return <ErrorBoundaryInner colors={colors} {...props} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
});
