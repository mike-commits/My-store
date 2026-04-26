import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar, Platform, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';

// Screens
import { DashboardScreen } from './src/presenter/screens/DashboardScreen';
import { ProductsScreen } from './src/presenter/screens/ProductsScreen';
import { ShipmentsScreen } from './src/presenter/screens/ShipmentsScreen';
import { SalesScreen } from './src/presenter/screens/SalesScreen';
import { ReportsScreen } from './src/presenter/screens/ReportsScreen';
import { ProductDetailsScreen } from './src/presenter/screens/ProductDetailsScreen';
import { SettingsScreen } from './src/presenter/screens/SettingsScreen';

// Contexts & Components
import { ThemeProvider, useAppTheme } from './src/core/contexts/ThemeContext';
import { AuthProvider } from './src/core/contexts/AuthContext';
import { AuthGuard } from './src/presenter/components/AuthGuard';
import { ErrorBoundary } from './src/presenter/components/ErrorBoundary';

const { width } = Dimensions.get('window');
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeTabs() {
    const { colors } = useAppTheme();
    const insets = useSafeAreaInsets();
    
    const isMobileWeb = Platform.OS === 'web' && width < 768;
    const horizontalMargin = width < 375 ? 12 : 20;
    const floatingBottom = isMobileWeb ? 30 : Math.max(insets.bottom, 15);

    return (
        <Tab.Navigator 
            screenOptions={{ 
                headerShown: false,
                tabBarActiveTintColor: '#FFFFFF',
                tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
                tabBarShowLabel: true,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: floatingBottom,
                    left: horizontalMargin,
                    right: horizontalMargin,
                    backgroundColor: colors.primary,
                    borderTopWidth: 0,
                    height: 72,
                    borderRadius: 36,
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.3,
                    shadowRadius: 15,
                    paddingBottom: 12,
                    paddingTop: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.15)',
                },
                tabBarLabelStyle: {
                    fontSize: 9,
                    fontWeight: '700',
                    marginTop: 2,
                },
            }}
        >
            <Tab.Screen name="Dash" component={DashboardScreen} options={{ 
                title: 'Home',
                tabBarIcon: ({ color, size }) => <Feather name="grid" size={size} color={color} /> 
            }} />
            <Tab.Screen name="Items" component={ProductsScreen} options={{ 
                title: 'Products',
                tabBarIcon: ({ color, size }) => <Feather name="box" size={size} color={color} /> 
            }} />
            <Tab.Screen name="Shipments" component={ShipmentsScreen} options={{ 
                title: 'Shipments',
                tabBarIcon: ({ color, size }) => <Feather name="truck" size={size} color={color} /> 
            }} />
            <Tab.Screen name="Sell" component={SalesScreen} options={{ 
                title: 'Sales',
                tabBarIcon: ({ color, size }) => <Feather name="dollar-sign" size={size} color={color} /> 
            }} />
            <Tab.Screen name="Settings" component={SettingsScreen} options={{ 
                title: 'Settings',
                tabBarIcon: ({ color, size }) => <Feather name="settings" size={size} color={color} /> 
            }} />
        </Tab.Navigator>
    );
}

function MainNavigator() {
    const { colors, isDark } = useAppTheme();

    return (
        <NavigationContainer>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
            <AuthGuard>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Root" component={HomeTabs} />
                    <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
                    <Stack.Screen name="Reports" component={ReportsScreen} />
                </Stack.Navigator>
            </AuthGuard>
        </NavigationContainer>
    );
}

export default function App() {
    return (
        <ErrorBoundary>
            <SafeAreaProvider>
                <AuthProvider>
                    <ThemeProvider>
                        <MainNavigator />
                    </ThemeProvider>
                </AuthProvider>
            </SafeAreaProvider>
        </ErrorBoundary>
    );
}
