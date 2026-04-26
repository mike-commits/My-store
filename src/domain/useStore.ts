import { useState, useCallback, useEffect, useMemo } from 'react';
import { ProductRepository, ShipmentRepository, SaleRepository, PaymentRepository, ManualReportRepository, ExpenseRepository } from '../data/repositories';
import { Product, Shipment, ShipmentItem, Sale, Payment, ManualReport, Expense } from '../domain/models';
import { offlineService } from '../data/OfflineService';
import { NotificationService } from '../data/NotificationService';
import { supabase } from '../data/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const productRepo = new ProductRepository();
const shipmentRepo = new ShipmentRepository();
const saleRepo = new SaleRepository();
const paymentRepo = new PaymentRepository();
const reportRepo = new ManualReportRepository();
const expenseRepo = new ExpenseRepository();

let globalProducts: Product[] = [];
let globalShipments: Shipment[] = [];
let globalSales: Sale[] = [];
let globalPayments: Payment[] = [];
let globalReports: ManualReport[] = [];
let globalExpenses: Expense[] = [];
let listeners: Array<() => void> = [];

const notifyListeners = () => listeners.forEach(l => l());

export const useStore = () => {
    const [, setDummy] = useState({});
    const [loading, setLoading] = useState(false);
    const forceUpdate = useCallback(() => setDummy({}), []);

    const checkLowStock = useCallback(async (products: Product[]) => {
        const settingsStr = await AsyncStorage.getItem('app_settings');
        const settings = settingsStr ? JSON.parse(settingsStr) : { notificationsEnabled: true };
        
        if (!settings.notificationsEnabled) return;

        for (const p of products) {
            if (p.quantity <= 5) { // Default threshold
                await NotificationService.sendLowStockAlert(p.name, p.quantity);
            }
        }
    }, []);

    const refreshAll = useCallback(async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                // Try to load from cache if offline
                const cached = await offlineService.getCachedProducts();
                if (cached.length > 0) {
                    globalProducts = cached;
                    notifyListeners();
                }
                return;
            }

            const [products, shipments, sales, payments, reports, expenses] = await Promise.all([
                productRepo.getProducts(),
                shipmentRepo.getShipments(),
                saleRepo.getSales(),
                paymentRepo.getPayments(),
                reportRepo.getReports(),
                expenseRepo.getExpenses()
            ]);

            globalProducts = products;
            globalShipments = shipments;
            globalSales = sales;
            globalPayments = payments;
            globalReports = reports;
            globalExpenses = expenses;
            
            // Background tasks
            offlineService.cacheProducts(products);
            checkLowStock(products);
            
            notifyListeners();
        } catch (error) {
            console.error('[STORE] Refresh failed:', error);
            // Fallback to cache on error
            const cached = await offlineService.getCachedProducts();
            if (cached.length > 0) globalProducts = cached;
            notifyListeners();
        } finally {
            setLoading(false);
        }
    }, [checkLowStock]);

    useEffect(() => {
        listeners.push(forceUpdate);
        if (globalProducts.length === 0) refreshAll();
        
        // Setup notification permissions
        NotificationService.registerForPushNotificationsAsync();

        return () => {
            listeners = listeners.filter(l => l !== forceUpdate);
        };
    }, [forceUpdate, refreshAll]);

    const addProduct = async (product: Omit<Product, 'id'>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            await offlineService.addToSyncQueue('INSERT', 'products', product);
            throw new Error("Offline: Change queued for sync.");
        }
        await productRepo.addProduct({ ...product, user_id: user.id } as any);
        await refreshAll();
    };

    const updateProduct = async (product: Product) => {
        await productRepo.updateProduct(product);
        await refreshAll();
    };

    const deleteProduct = async (id: number) => {
        await productRepo.deleteProduct(id);
        await refreshAll();
    };

    const addShipment = async (date: string, status: string, items: Omit<ShipmentItem, 'id' | 'shipment_id'>[], shippingCost: number = 0, description?: string, weightKg?: number) => {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;
        await shipmentRepo.addShipment(date, status, items, shippingCost, description, weightKg);
        await refreshAll();
    };

    const addSale = async (productId: number, date: string, quantity: number, sellPrice: number) => {
        const product = globalProducts.find(p => p.id === productId);
        const buyPrice = product?.buy_price || 0;
        await saleRepo.addSale(productId, date, quantity, buyPrice, sellPrice);
        await refreshAll();
    };

    const stats = useMemo(() => {
        const totalRevenue = globalSales.reduce((acc, s) => acc + (s.sell_price * s.quantity), 0);
        const totalCogs = globalSales.reduce((acc, s) => acc + (s.buy_price * s.quantity), 0);
        const grossProfit = totalRevenue - totalCogs;
        const totalCommissions = globalPayments.reduce((acc, p) => acc + (p.commission_fee || 0), 0);
        const totalShippingFees = globalShipments.reduce((acc, s) => acc + (s.shipping_cost || 0), 0);
        const totalOperatingExpenses = globalExpenses.reduce((acc, e) => acc + e.amount, 0);
        const totalOpex = totalCommissions + totalShippingFees + totalOperatingExpenses;
        const netProfit = grossProfit - totalOpex;
        const totalPaymentsReceived = globalPayments.reduce((acc, p) => acc + p.amount, 0);
        const availableCash = totalPaymentsReceived - totalCommissions - totalOperatingExpenses - totalShippingFees;
        const inventoryValueAtCost = globalProducts.reduce((acc, p) => acc + (p.buy_price * p.quantity), 0);

        return {
            totalRevenue,
            grossProfit,
            netProfit,
            availableCash,
            inventoryValueAtCost,
            totalSalesCount: globalSales.length,
            lowStockCount: globalProducts.filter(p => p.quantity <= 5).length
        };
    }, [globalSales, globalProducts, globalShipments, globalPayments, globalExpenses]);

    return {
        stats,
        loading,
        refreshAll,
        products: globalProducts,
        shipments: globalShipments,
        sales: globalSales,
        payments: globalPayments,
        manualReports: globalReports,
        expenses: globalExpenses,
        addProduct,
        updateProduct,
        deleteProduct,
        addShipment,
        deleteShipment: async (id: number) => {
            await shipmentRepo.deleteShipment(id);
            await refreshAll();
        },
        addSale,
        deleteSale: async (id: number) => {
            await saleRepo.deleteSale(id);
            await refreshAll();
        },
    };
};
