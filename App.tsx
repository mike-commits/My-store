/**
 * App.tsx
 * ─────────────────────────────────────────────────────────────
 * Root component. Sets up providers, navigation, and auth gate.
 *
 * Provider order (outer → inner):
 *   ErrorBoundary → SafeAreaProvider → AuthProvider
 *   → ThemeProvider → UserProfileProvider → NavigationContainer
 *
 * Auth logic lives in AuthContext / AuthGuard:
 *   • Loading  → full-screen spinner
 *   • No session → <AuthScreen />
 *   • Session  → HomeTabs (floating bottom tab navigator)
 *                + ProductDetails and Reports stack screens
 * ─────────────────────────────────────────────────────────────
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar, Platform, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';

// ── Screens ───────────────────────────────────────────────────
import { DashboardScreen }    from './src/presenter/screens/DashboardScreen';
import { ProductsScreen }     from './src/presenter/screens/ProductsScreen';
import { ShipmentsScreen }    from './src/presenter/screens/ShipmentsScreen';
import { SalesScreen }        from './src/presenter/screens/SalesScreen';
import { ReportsScreen }      from './src/presenter/screens/ReportsScreen';
import { ProductDetailsScreen } from './src/presenter/screens/ProductDetailsScreen';
import { ProductFormScreen }    from './src/presenter/screens/ProductFormScreen';
import { SettingsScreen }       from './src/presenter/screens/SettingsScreen';
import { CustomersScreen }      from './src/presenter/screens/CustomersScreen';
import { AuthScreen }           from './src/presenter/screens/AuthScreen';

// ── Contexts & Components ─────────────────────────────────────
import { ThemeProvider, useAppTheme } from './src/core/contexts/ThemeContext';
import { AuthProvider }  from './src/core/contexts/AuthContext';
import { UserProfileProvider } from './src/core/contexts/UserProfileContext';
import { AuthGuard }     from './src/presenter/components/AuthGuard';
import { ErrorBoundary } from './src/presenter/components/ErrorBoundary';

const { width } = Dimensions.get('window');
const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ── Tab Navigator ─────────────────────────────────────────────
function HomeTabs() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  const isMobileWeb      = Platform.OS === 'web' && width < 768;
  const horizontalMargin = width < 375 ? 12 : 20;
  const floatingBottom   = isMobileWeb ? 30 : Math.max(insets.bottom, 15);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: true,
        tabBarStyle: {
          position:        'absolute',
          bottom:          floatingBottom,
          left:            horizontalMargin,
          right:           horizontalMargin,
          backgroundColor: colors.surface,
          borderTopWidth:  0,
          height:          72,
          borderRadius:    36,
          elevation:       10,
          shadowColor:     colors.text,
          shadowOffset:    { width: 0, height: 10 },
          shadowOpacity:   isDark ? 0.3 : 0.1,
          shadowRadius:    15,
          paddingBottom:   12,
          paddingTop:      8,
          borderWidth:     1,
          borderColor:     colors.border,
        },
        tabBarLabelStyle: { fontSize: 9, fontWeight: '700', marginTop: 2 },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Feather name="grid" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{
          title: 'Products',
          tabBarIcon: ({ color, size }) => <Feather name="box" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Shipments"
        component={ShipmentsScreen}
        options={{
          title: 'Shipments',
          tabBarIcon: ({ color, size }) => <Feather name="truck" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Sales"
        component={SalesScreen}
        options={{
          title: 'Sales',
          tabBarIcon: ({ color, size }) => <Feather name="dollar-sign" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Customers"
        component={CustomersScreen}
        options={{
          title: 'CRM',
          tabBarIcon: ({ color, size }) => <Feather name="users" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ── Main Navigator ────────────────────────────────────────────
function MainNavigator() {
  const { colors, isDark } = useAppTheme();

  return (
    <NavigationContainer>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <AuthGuard
        loadingFallback={null}   // AuthGuard renders its own spinner
        unauthFallback={<AuthScreen />}
      >
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Root"           component={HomeTabs} />
          <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
          <Stack.Screen name="ProductForm"    component={ProductFormScreen} />
          <Stack.Screen name="Reports"        component={ReportsScreen} />
          <Stack.Screen name="Settings"       component={SettingsScreen} />
        </Stack.Navigator>
      </AuthGuard>
    </NavigationContainer>
  );
}

// ── Root ──────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <ThemeProvider>
            <UserProfileProvider>
              <MainNavigator />
            </UserProfileProvider>
          </ThemeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
