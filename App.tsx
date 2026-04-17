import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ActivityIndicator, StatusBar } from 'react-native';
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
                tabBarShowLabel: true,
                tabBarStyle: {
                    backgroundColor: colors.primary,
                    borderTopWidth: 0,
                    paddingTop: 10,
                    minHeight: 65,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '800',
                    marginTop: 4,
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
            <Tab.Screen name="Logistics" component={ShipmentsScreen} options={{ 
                title: 'Shipment',
                tabBarIcon: ({ color, size }) => <Feather name="truck" size={size} color={color} /> 
            }} />
            <Tab.Screen name="Sell" component={SalesScreen} options={{ 
                title: 'Sales',
                tabBarIcon: ({ color, size }) => <Feather name="dollar-sign" size={size} color={color} /> 
            }} />
            <Tab.Screen name="Stats" component={ReportsScreen} options={{ 
                title: 'Reports',
                tabBarIcon: ({ color, size }) => <Feather name="pie-chart" size={size} color={color} /> 
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
