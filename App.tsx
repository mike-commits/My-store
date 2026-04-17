import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ActivityIndicator, StatusBar, Platform } from 'react-native';
import { DashboardScreen } from './src/presenter/screens/DashboardScreen';
import { ProductsScreen } from './src/presenter/screens/ProductsScreen';
import { ShipmentsScreen } from './src/presenter/screens/ShipmentsScreen';
import { SalesScreen } from './src/presenter/screens/SalesScreen';
import { ReportsScreen } from './src/presenter/screens/ReportsScreen';
import { ProductDetailsScreen } from './src/presenter/screens/ProductDetailsScreen';
import { initDb } from './src/data/database';
import { ThemeProvider, useAppTheme } from './src/core/contexts/ThemeContext';
import { Feather } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeTabs() {
    const { colors } = useAppTheme();
    return (
        <Tab.Navigator 
            screenOptions={{ 
                headerShown: false,
                tabBarActiveTintColor: '#FFFFFF',
                tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
                tabBarShowLabel: false,
                tabBarStyle: {
                    backgroundColor: colors.primary,
                    borderTopWidth: 0,
                    height: Platform.OS === 'web' ? 85 : 65,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                },
            }}
        >
            <Tab.Screen name="Dash" component={DashboardScreen} options={{ 
                tabBarIcon: ({ color, size }) => (
                    <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: Platform.OS === 'web' ? 25 : 0 }}>
                        <Feather name="grid" size={20} color={color} />
                        <Text style={{ color, fontSize: 10, fontWeight: '800', marginTop: 4 }}>Home</Text>
                    </View>
                )
            }} />
            <Tab.Screen name="Items" component={ProductsScreen} options={{ 
                tabBarIcon: ({ color, size }) => (
                    <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: Platform.OS === 'web' ? 25 : 0 }}>
                        <Feather name="box" size={20} color={color} />
                        <Text style={{ color, fontSize: 10, fontWeight: '800', marginTop: 4 }}>Items</Text>
                    </View>
                )
            }} />
            <Tab.Screen name="Logistics" component={ShipmentsScreen} options={{ 
                tabBarIcon: ({ color, size }) => (
                    <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: Platform.OS === 'web' ? 25 : 0 }}>
                        <Feather name="truck" size={20} color={color} />
                        <Text style={{ color, fontSize: 10, fontWeight: '800', marginTop: 4 }}>Freight</Text>
                    </View>
                )
            }} />
            <Tab.Screen name="Sell" component={SalesScreen} options={{ 
                tabBarIcon: ({ color, size }) => (
                    <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: Platform.OS === 'web' ? 25 : 0 }}>
                        <Feather name="dollar-sign" size={20} color={color} />
                        <Text style={{ color, fontSize: 10, fontWeight: '800', marginTop: 4 }}>Sales</Text>
                    </View>
                )
            }} />
            <Tab.Screen name="Stats" component={ReportsScreen} options={{ 
                tabBarIcon: ({ color, size }) => (
                    <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: Platform.OS === 'web' ? 25 : 0 }}>
                        <Feather name="pie-chart" size={20} color={color} />
                        <Text style={{ color, fontSize: 10, fontWeight: '800', marginTop: 4 }}>Stats</Text>
                    </View>
                )
            }} />
        </Tab.Navigator>
    );
}

function MainNavigator() {
    const { colors, isDark } = useAppTheme();
    const [dbInitialized, setDbInitialized] = useState(false);

    useEffect(() => {
        try {
            initDb();
            setDbInitialized(true);
        } catch (e) {
            console.error("Database initialization failed:", e);
        }
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
