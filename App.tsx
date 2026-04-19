import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, ActivityIndicator, StatusBar, Platform, Dimensions } from 'react-native';
import { DashboardScreen } from './src/presenter/screens/DashboardScreen';
import { ProductsScreen } from './src/presenter/screens/ProductsScreen';
import { ShipmentsScreen } from './src/presenter/screens/ShipmentsScreen';
import { SalesScreen } from './src/presenter/screens/SalesScreen';
import { ReportsScreen } from './src/presenter/screens/ReportsScreen';
import { ProductDetailsScreen } from './src/presenter/screens/ProductDetailsScreen';
import { initDb } from './src/data/database';
import { ThemeProvider, useAppTheme } from './src/core/contexts/ThemeContext';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeTabs() {
    const { colors } = useAppTheme();
    const insets = useSafeAreaInsets();
    
    // Adaptive padding for floating layout
    const isMobileWeb = Platform.OS === 'web' && width < 768;
    const horizontalMargin = width < 375 ? 12 : 20; // Thinner margins on small phones
    const floatingBottom = isMobileWeb ? 30 : Math.max(insets.bottom, 15);
    const tabBarHeight = 72;

    return (
        <Tab.Navigator 
            screenOptions={{ 
                headerShown: false,
                tabBarActiveTintColor: '#FFFFFF',
                tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
                tabBarShowLabel: true,
                tabBarLabelPosition: 'below-icon',
                tabBarStyle: {
                    position: 'absolute',
                    bottom: floatingBottom,
                    left: horizontalMargin,
                    right: horizontalMargin,
                    backgroundColor: colors.primary,
                    borderTopWidth: 0,
                    height: tabBarHeight,
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
                tabBarItemStyle: {
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 2,
                },
                tabBarLabelStyle: {
                    fontSize: 9,
                    fontWeight: '700',
                    marginTop: 2,
                    textAlign: 'center',
                },
            }}
        >
            <Tab.Screen name="Dash" component={DashboardScreen} options={{ 
                title: 'Home',
                tabBarIcon: ({ color, size }) => <Feather name="grid" size={24} color={color} /> 
            }} />
            <Tab.Screen name="Items" component={ProductsScreen} options={{ 
                title: 'Products',
                tabBarIcon: ({ color, size }) => <Feather name="box" size={24} color={color} /> 
            }} />
            <Tab.Screen name="Logistics" component={ShipmentsScreen} options={{ 
                title: 'Shipment',
                tabBarIcon: ({ color, size }) => <Feather name="truck" size={24} color={color} /> 
            }} />
            <Tab.Screen name="Sell" component={SalesScreen} options={{ 
                title: 'Sales',
                tabBarIcon: ({ color, size }) => <Feather name="dollar-sign" size={24} color={color} /> 
            }} />
            <Tab.Screen name="Stats" component={ReportsScreen} options={{ 
                title: 'Reports',
                tabBarIcon: ({ color, size }) => <Feather name="pie-chart" size={24} color={color} /> 
            }} />
        </Tab.Navigator>
    );
}

function MainNavigator() {
    const { colors, isDark } = useAppTheme();
    const [dbInitialized, setDbInitialized] = useState(false);

    useEffect(() => {
        // Local database initialization is no longer required with Supabase migration
        setDbInitialized(true);
    }, []);

    if (!dbInitialized) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 16, color: colors.textSecondary }}>Configuring Store...</Text>
            </View>
        );
    }

    return (
        <NavigationContainer>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Root" component={HomeTabs} />
                <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default function App() {
    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <MainNavigator />
            </ThemeProvider>
        </SafeAreaProvider>
    );
}
