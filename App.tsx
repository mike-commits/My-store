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
                tabBarStyle: {
                    backgroundColor: colors.primary,
                    borderTopWidth: 0,
                    paddingBottom: 5,
                    height: 65,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: 'bold',
                    marginBottom: 5
                }
            }}
        >
            <Tab.Screen name="Dash" component={DashboardScreen} options={{ title: 'Dashboard' }} />
            <Tab.Screen name="Items" component={ProductsScreen} options={{ title: 'Products' }} />
            <Tab.Screen name="Logistics" component={ShipmentsScreen} options={{ title: 'Shipment' }} />
            <Tab.Screen name="Sell" component={SalesScreen} options={{ title: 'Sales' }} />
            <Tab.Screen name="Stats" component={ReportsScreen} options={{ title: 'Reports' }} />
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
