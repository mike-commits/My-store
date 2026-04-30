import { useState, useCallback, useEffect, useMemo } from 'react';
import { ProductRepository, ShipmentRepository, SaleRepository, PaymentRepository, ManualReportRepository, ExpenseRepository, CustomerRepository } from '../data/repositories';
import { Product, Shipment, ShipmentItem, Sale, Payment, ManualReport, Expense, Customer } from '../domain/models';
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
const customerRepo = new CustomerRepository();

let globalProducts: Product[] = [];
let globalShipments: Shipment[] = [];
let globalSales: Sale[] = [];
let globalPayments: Payment[] = [];
let globalReports: ManualReport[] = [];
let globalExpenses: Expense[] = [];
let globalCustomers: Customer[] = [];
let listeners: Array<() => void> = [];

const notifyListeners = () => listeners.forEach(l => l());

export const useStore = () => {
    const [, setDummy] = useState({});
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState<string | null>(null);
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
            setError(null);
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

            const [products, shipments, sales, payments, reports, expenses, customers] = await Promise.all([
                productRepo.getProducts(),
                shipmentRepo.getShipments(),
                saleRepo.getSales(),
                paymentRepo.getPayments(),
                reportRepo.getReports(),
                expenseRepo.getExpenses(),
                customerRepo.getCustomers(),
            ]);

            globalProducts = products;
            globalShipments = shipments;
            globalSales = sales;
            globalPayments = payments;
            globalReports = reports;
            globalExpenses = expenses;
            globalCustomers = customers;
            
            // Background tasks
            offlineService.cacheProducts(products);
            checkLowStock(products);
            
            notifyListeners();
        } catch (error: any) {
            console.error('[STORE] Refresh failed:', error);
            setError(error.message || 'Failed to sync data');
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

    const addShipment = async (supplierName: string, totalCost: number, date: string, status: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Auth required");
        
        await shipmentRepo.addShipment(date, status, [], user.id, totalCost, 0, `Supplier: ${supplierName}`);
        await refreshAll();
    };

    const updateShipmentStatus = async (id: number, status: string) => {
        const { error } = await supabase
            .from('shipments')
            .update({ status })
            .eq('id', id);
        
        if (error) throw error;
        await refreshAll();
    };

    const addSale = async (productId: number, date: string, quantity: number, sellPrice: number) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Auth required");
        const product = globalProducts.find(p => p.id === productId);
        const buyPrice = product?.buy_price || 0;
        await saleRepo.addSale(productId, date, quantity, buyPrice, sellPrice, user.id);
        await refreshAll();
    };

    const addPayment = async (amount: number, date: string, notes: string, commissionFee: number = 0) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Auth required");
        await paymentRepo.addPayment(amount, date, notes, commissionFee, user.id);
        await refreshAll();
    };

    const deletePayment = async (id: number) => {
        await paymentRepo.deletePayment(id);
        await refreshAll();
    };

    const addExpense = async (amount: number, description: string, date: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Auth required");
        await expenseRepo.addExpense(amount, date, description, user.id);
        await refreshAll();
    };

    const deleteExpense = async (id: number) => {
        await expenseRepo.deleteExpense(id);
        await refreshAll();
    };

    const addManualReport = async (title: string, content: string, date: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Auth required");
        await reportRepo.addReport(title, content, date, user.id);
        await refreshAll();
    };

    const deleteManualReport = async (id: number) => {
        await reportRepo.deleteReport(id);
        await refreshAll();
    };

    const addCustomer = async (customer: Omit<Customer, 'id' | 'total_spent' | 'last_purchase'>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Auth required");
        await customerRepo.addCustomer({ ...customer, user_id: user.id });
        await refreshAll();
    };

    const updateCustomer = async (id: number, customer: Partial<Customer>) => {
        await customerRepo.updateCustomer(id, customer);
        await refreshAll();
    };

    const deleteCustomer = async (id: number) => {
        await customerRepo.deleteCustomer(id);
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
            totalCommissions,
            outstandingBalance: totalRevenue - totalPaymentsReceived,
            totalSalesCount: globalSales.length,
            lowStockCount: globalProducts.filter(p => p.quantity <= 5).length
        };
    }, [globalSales, globalProducts, globalShipments, globalPayments, globalExpenses]);

    // Expose repository methods needed by ProductDetailsScreen
    const getProductShipments = useCallback(
        (productId: number) => productRepo.getProductShipments(productId),
        []
    );
    const getProductSales = useCallback(
        (productId: number) => productRepo.getProductSales(productId),
        []
    );

    return {
        stats,
        loading,
        error,
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
        updateShipmentStatus,
        getProductShipments,
        getProductSales,
        deleteShipment: async (id: number) => {
            await shipmentRepo.deleteShipment(id);
            await refreshAll();
        },
        addSale,
        addPayment,
        deletePayment,
        addExpense,
        deleteExpense,
        addManualReport,
        deleteManualReport,
        deleteSale: async (id: number) => {
            await saleRepo.deleteSale(id);
            await refreshAll();
        },
        customers: globalCustomers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
    };
};
