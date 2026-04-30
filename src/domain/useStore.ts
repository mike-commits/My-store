import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { ProductRepository, ShipmentRepository, SaleRepository, PaymentRepository, ManualReportRepository, ExpenseRepository, CustomerRepository } from '../data/repositories';
import { Product, Shipment, ShipmentItem, Sale, Payment, ManualReport, Expense, Customer } from '../domain/models';
import { offlineService } from '../data/OfflineService';
import { NotificationService } from '../data/NotificationService';
import { supabase } from '../data/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const productRepo  = new ProductRepository();
const shipmentRepo = new ShipmentRepository();
const saleRepo     = new SaleRepository();
const paymentRepo  = new PaymentRepository();
const reportRepo   = new ManualReportRepository();
const expenseRepo  = new ExpenseRepository();
const customerRepo = new CustomerRepository();

// ─── Module-level shared state ────────────────────────────────────────────────
let globalProducts:  Product[]      = [];
let globalShipments: Shipment[]     = [];
let globalSales:     Sale[]         = [];
let globalPayments:  Payment[]      = [];
let globalReports:   ManualReport[] = [];
let globalExpenses:  Expense[]      = [];
let globalCustomers: Customer[]     = [];
let cachedUser: any = null;       // cache auth user to avoid repeated getUser() calls
let listeners: Array<() => void>  = [];

const notifyListeners = () => listeners.forEach(l => l());

// Cache the current user at startup and keep it fresh
async function getUser() {
    if (cachedUser) return cachedUser;
    const { data: { user } } = await supabase.auth.getUser();
    cachedUser = user;
    return user;
}

supabase.auth.onAuthStateChange((_event, session) => {
    cachedUser = session?.user ?? null;
});

// ─── Targeted refresh helpers (fetch only what changed) ───────────────────────
async function refreshProducts() {
    const data = await productRepo.getProducts();
    globalProducts = data;
    offlineService.cacheProducts(data).catch(() => {});
    notifyListeners();
    return data;
}
async function refreshSales() {
    globalSales = await saleRepo.getSales();
    notifyListeners();
}
async function refreshPayments() {
    globalPayments = await paymentRepo.getPayments();
    notifyListeners();
}
async function refreshExpenses() {
    globalExpenses = await expenseRepo.getExpenses();
    notifyListeners();
}
async function refreshReports() {
    globalReports = await reportRepo.getReports();
    notifyListeners();
}
async function refreshShipments() {
    globalShipments = await shipmentRepo.getShipments();
    notifyListeners();
}
async function refreshCustomers() {
    globalCustomers = await customerRepo.getCustomers();
    notifyListeners();
}

// Low-stock check – runs in background, debounced
let lowStockTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleLowStockCheck(products: Product[]) {
    if (lowStockTimer) clearTimeout(lowStockTimer);
    lowStockTimer = setTimeout(async () => {
        try {
            const settingsStr = await AsyncStorage.getItem('app_settings');
            const settings    = settingsStr ? JSON.parse(settingsStr) : { notificationsEnabled: true };
            if (!settings.notificationsEnabled) return;
            for (const p of products) {
                if (p.quantity <= 5) {
                    await NotificationService.sendLowStockAlert(p.name, p.quantity);
                }
            }
        } catch { /* silent */ }
    }, 3000); // delay 3 s after last write to avoid spam
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useStore = () => {
    const [, setDummy]  = useState({});
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState<string | null>(null);
    const forceUpdate = useCallback(() => setDummy({}), []);

    // Full refresh – used only on mount and manual pull-to-refresh
    const refreshAll = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const user = await getUser();
            if (!user) {
                const cached = await offlineService.getCachedProducts();
                if (cached.length > 0) { globalProducts = cached; notifyListeners(); }
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
            globalProducts  = products;
            globalShipments = shipments;
            globalSales     = sales;
            globalPayments  = payments;
            globalReports   = reports;
            globalExpenses  = expenses;
            globalCustomers = customers;
            offlineService.cacheProducts(products).catch(() => {});
            scheduleLowStockCheck(products);
            notifyListeners();
        } catch (e: any) {
            console.error('[STORE] Refresh failed:', e);
            setError(e.message || 'Failed to sync data');
            const cached = await offlineService.getCachedProducts();
            if (cached.length > 0) { globalProducts = cached; notifyListeners(); }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        listeners.push(forceUpdate);
        if (globalProducts.length === 0) refreshAll();
        NotificationService.registerForPushNotificationsAsync();
        return () => { listeners = listeners.filter(l => l !== forceUpdate); };
    }, [forceUpdate, refreshAll]);

    // ── Products ──────────────────────────────────────────────────────────────
    const addProduct = async (product: Omit<Product, 'id'>) => {
        const user = await getUser();
        if (!user) {
            await offlineService.addToSyncQueue('INSERT', 'products', product);
            throw new Error('Offline: Change queued for sync.');
        }
        // Optimistic insert
        const tempId = -Date.now();
        const optimistic = { ...product, id: tempId, user_id: user.id } as any;
        globalProducts = [optimistic, ...globalProducts];
        notifyListeners();

        try {
            await productRepo.addProduct({ ...product, user_id: user.id } as any);
            await refreshProducts();
        } catch (e) {
            // Rollback
            globalProducts = globalProducts.filter(p => p.id !== tempId);
            notifyListeners();
            throw e;
        }
    };

    const updateProduct = async (product: Product) => {
        // Optimistic update
        const prev = globalProducts;
        globalProducts = globalProducts.map(p => p.id === product.id ? { ...p, ...product } : p);
        notifyListeners();
        try {
            await productRepo.updateProduct(product);
            await refreshProducts();
        } catch (e) {
            globalProducts = prev;
            notifyListeners();
            throw e;
        }
    };

    const deleteProduct = async (id: number) => {
        const prev = globalProducts;
        globalProducts = globalProducts.filter(p => p.id !== id);
        notifyListeners();
        try {
            await productRepo.deleteProduct(id);
            // Also remove associated sales from local state
            globalSales = globalSales.filter(s => s.product_id !== id);
            notifyListeners();
        } catch (e) {
            globalProducts = prev;
            notifyListeners();
            throw e;
        }
    };

    // ── Shipments ─────────────────────────────────────────────────────────────
    const addShipment = async (supplierName: string, totalCost: number, date: string, status: string) => {
        const user = await getUser();
        if (!user) throw new Error('Auth required');
        await shipmentRepo.addShipment(date, status, [], user.id, totalCost, 0, `Supplier: ${supplierName}`);
        await refreshShipments();
        // Update product quantities in background (shipment repo already did it in DB)
        refreshProducts().catch(() => {});
    };

    const updateShipmentStatus = async (id: number, status: string) => {
        // Optimistic update
        globalShipments = globalShipments.map(s => s.id === id ? { ...s, status } : s);
        notifyListeners();
        const { error } = await supabase.from('shipments').update({ status }).eq('id', id);
        if (error) {
            await refreshShipments(); // rollback via real data
            throw error;
        }
    };

    // ── Sales ─────────────────────────────────────────────────────────────────
    const addSale = async (productId: number, date: string, quantity: number, sellPrice: number) => {
        const user = await getUser();
        if (!user) throw new Error('Auth required');
        const product  = globalProducts.find(p => p.id === productId);
        const buyPrice = product?.buy_price || 0;

        // Optimistic: decrement product stock immediately
        globalProducts = globalProducts.map(p =>
            p.id === productId ? { ...p, quantity: Math.max(0, p.quantity - quantity) } : p
        );
        notifyListeners();

        try {
            await saleRepo.addSale(productId, date, quantity, buyPrice, sellPrice, user.id);
            // Refresh only the two affected tables
            await Promise.all([refreshSales(), refreshProducts()]);
        } catch (e) {
            // Rollback stock
            globalProducts = globalProducts.map(p =>
                p.id === productId ? { ...p, quantity: p.quantity + quantity } : p
            );
            notifyListeners();
            throw e;
        }
    };

    const deleteSale = async (id: number) => {
        const sale = globalSales.find(s => s.id === id);
        const prev = globalSales;
        globalSales = globalSales.filter(s => s.id !== id);
        // Restore stock optimistically
        if (sale) {
            globalProducts = globalProducts.map(p =>
                p.id === sale.product_id ? { ...p, quantity: p.quantity + sale.quantity } : p
            );
        }
        notifyListeners();
        try {
            await saleRepo.deleteSale(id);
            await Promise.all([refreshSales(), refreshProducts()]);
        } catch (e) {
            globalSales = prev;
            notifyListeners();
            throw e;
        }
    };

    // ── Payments ──────────────────────────────────────────────────────────────
    const addPayment = async (amount: number, date: string, notes: string, commissionFee: number = 0) => {
        const user = await getUser();
        if (!user) throw new Error('Auth required');
        await paymentRepo.addPayment(amount, date, notes, commissionFee, user.id);
        await refreshPayments();
    };

    const deletePayment = async (id: number) => {
        const prev = globalPayments;
        globalPayments = globalPayments.filter(p => p.id !== id);
        notifyListeners();
        try {
            await paymentRepo.deletePayment(id);
            await refreshPayments();
        } catch (e) {
            globalPayments = prev;
            notifyListeners();
            throw e;
        }
    };

    // ── Expenses ──────────────────────────────────────────────────────────────
    const addExpense = async (amount: number, description: string, date: string) => {
        const user = await getUser();
        if (!user) throw new Error('Auth required');
        await expenseRepo.addExpense(amount, date, description, user.id);
        await refreshExpenses();
    };

    const deleteExpense = async (id: number) => {
        const prev = globalExpenses;
        globalExpenses = globalExpenses.filter(e => e.id !== id);
        notifyListeners();
        try {
            await expenseRepo.deleteExpense(id);
            await refreshExpenses();
        } catch (e) {
            globalExpenses = prev;
            notifyListeners();
            throw e;
        }
    };

    // ── Reports ───────────────────────────────────────────────────────────────
    const addManualReport = async (title: string, content: string, date: string) => {
        const user = await getUser();
        if (!user) throw new Error('Auth required');
        await reportRepo.addReport(title, content, date, user.id);
        await refreshReports();
    };

    const deleteManualReport = async (id: number) => {
        const prev = globalReports;
        globalReports = globalReports.filter(r => r.id !== id);
        notifyListeners();
        try {
            await reportRepo.deleteReport(id);
            await refreshReports();
        } catch (e) {
            globalReports = prev;
            notifyListeners();
            throw e;
        }
    };

    // ── Customers ─────────────────────────────────────────────────────────────
    const addCustomer = async (customer: Omit<Customer, 'id' | 'total_spent' | 'last_purchase'>) => {
        const user = await getUser();
        if (!user) throw new Error('Auth required');
        await customerRepo.addCustomer({ ...customer, user_id: user.id });
        await refreshCustomers();
    };

    const updateCustomer = async (id: number, customer: Partial<Customer>) => {
        const prev = globalCustomers;
        globalCustomers = globalCustomers.map(c => c.id === id ? { ...c, ...customer } : c);
        notifyListeners();
        try {
            await customerRepo.updateCustomer(id, customer);
            await refreshCustomers();
        } catch (e) {
            globalCustomers = prev;
            notifyListeners();
            throw e;
        }
    };

    const deleteCustomer = async (id: number) => {
        const prev = globalCustomers;
        globalCustomers = globalCustomers.filter(c => c.id !== id);
        notifyListeners();
        try {
            await customerRepo.deleteCustomer(id);
            await refreshCustomers();
        } catch (e) {
            globalCustomers = prev;
            notifyListeners();
            throw e;
        }
    };

    // ── Stats (memoised, computed from cached arrays) ─────────────────────────
    const stats = useMemo(() => {
        const totalRevenue          = globalSales.reduce((acc, s) => acc + (s.sell_price * s.quantity), 0);
        const totalCogs             = globalSales.reduce((acc, s) => acc + (s.buy_price  * s.quantity), 0);
        const grossProfit           = totalRevenue - totalCogs;
        const totalCommissions      = globalPayments.reduce((acc, p) => acc + (p.commission_fee || 0), 0);
        const totalShippingFees     = globalShipments.reduce((acc, s) => acc + (s.shipping_cost || 0), 0);
        const totalOperatingExpenses= globalExpenses.reduce((acc, e) => acc + e.amount, 0);
        const totalOpex             = totalCommissions + totalShippingFees + totalOperatingExpenses;
        const netProfit             = grossProfit - totalOpex;
        const totalPaymentsReceived = globalPayments.reduce((acc, p) => acc + p.amount, 0);
        const availableCash         = totalPaymentsReceived - totalCommissions - totalOperatingExpenses - totalShippingFees;
        const inventoryValueAtCost  = globalProducts.reduce((acc, p) => acc + (p.buy_price * p.quantity), 0);
        return {
            totalRevenue, grossProfit, netProfit, availableCash,
            inventoryValueAtCost, totalCommissions,
            outstandingBalance: totalRevenue - totalPaymentsReceived,
            totalSalesCount:    globalSales.length,
            lowStockCount:      globalProducts.filter(p => p.quantity <= 5).length,
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [globalSales, globalProducts, globalShipments, globalPayments, globalExpenses]);

    const getProductShipments = useCallback(
        (productId: number) => productRepo.getProductShipments(productId), []);
    const getProductSales = useCallback(
        (productId: number) => productRepo.getProductSales(productId), []);

    return {
        stats, loading, error, refreshAll,
        products:      globalProducts,
        shipments:     globalShipments,
        sales:         globalSales,
        payments:      globalPayments,
        manualReports: globalReports,
        expenses:      globalExpenses,
        customers:     globalCustomers,
        addProduct, updateProduct, deleteProduct,
        addShipment, updateShipmentStatus,
        deleteShipment: async (id: number) => {
            const prev = globalShipments;
            globalShipments = globalShipments.filter(s => s.id !== id);
            notifyListeners();
            try {
                await shipmentRepo.deleteShipment(id);
                await Promise.all([refreshShipments(), refreshProducts()]);
            } catch (e) {
                globalShipments = prev;
                notifyListeners();
                throw e;
            }
        },
        addSale, deleteSale,
        addPayment, deletePayment,
        addExpense, deleteExpense,
        addManualReport, deleteManualReport,
        addCustomer, updateCustomer, deleteCustomer,
        getProductShipments, getProductSales,
    };
};
