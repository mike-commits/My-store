import { useState, useCallback, useEffect, useMemo } from 'react';
import { ProductRepository, ShipmentRepository, SaleRepository, PaymentRepository, ManualReportRepository, ExpenseRepository } from '../data/repositories';
import { Product, Shipment, ShipmentItem, Sale, Payment, ManualReport, Expense } from '../domain/models';

const productRepo = new ProductRepository();
const shipmentRepo = new ShipmentRepository();
const saleRepo = new SaleRepository();
const paymentRepo = new PaymentRepository();
const reportRepo = new ManualReportRepository();
const expenseRepo = new ExpenseRepository();

// Global State Singleton to ensure consistency across screens
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

    // Sync local state with global state
    const forceUpdate = useCallback(() => setDummy({}), []);

    const refreshAll = useCallback(async () => {
        const [
            products,
            shipments,
            sales,
            payments,
            reports,
            expenses
        ] = await Promise.all([
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
        
        notifyListeners();
    }, []);

    useEffect(() => {
        listeners.push(forceUpdate);
        // Initial load if empty
        if (globalProducts.length === 0) {
            refreshAll().catch(console.error);
        }
        return () => {
            listeners = listeners.filter(l => l !== forceUpdate);
        };
    }, [forceUpdate, refreshAll]);

    const getAvailableCash = () => {
        const totalPay = globalPayments.reduce((acc, p) => acc + p.amount, 0);
        const totalExp = globalExpenses.reduce((acc, e) => acc + e.amount, 0);
        const totalShip = globalShipments.reduce((acc, s) => acc + (s.shipping_cost || 0), 0);
        const totalInv = globalProducts.reduce((acc, p) => acc + (p.buy_price * p.quantity), 0);
        const totalCogs = globalSales.reduce((acc, s) => acc + (s.buy_price * s.quantity), 0);
        return totalPay - totalExp - totalShip - totalInv - totalCogs;
    };

    const addProduct = async (product: Omit<Product, 'id'>) => {
        await productRepo.addProduct(product);
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
        await shipmentRepo.addShipment(date, status, items, shippingCost, description, weightKg);
        await refreshAll();
    };

    const addSale = async (productId: number, date: string, quantity: number, sellPrice: number) => {
        const product = globalProducts.find(p => p.id === productId);
        const buyPrice = product?.buy_price || 0;
        await saleRepo.addSale(productId, date, quantity, buyPrice, sellPrice);
        await refreshAll();
    };

    const addPayment = async (amount: number, date: string, notes: string) => {
        await paymentRepo.addPayment(amount, date, notes);
        await refreshAll();
    };

    const deletePayment = async (id: number) => {
        await paymentRepo.deletePayment(id);
        await refreshAll();
    };

    const updatePayment = async (id: number, amount: number, date: string, notes: string) => {
        await paymentRepo.updatePayment(id, amount, new Date(date).toISOString(), notes);
        await refreshAll();
    };

    const addManualReport = async (title: string, content: string, dateOption?: string) => {
        await reportRepo.addReport(title, content, dateOption ? new Date(dateOption).toISOString() : new Date().toISOString());
        await refreshAll();
    };

    const deleteManualReport = async (id: number) => {
        await reportRepo.deleteReport(id);
        await refreshAll();
    };

    const updateManualReport = async (id: number, title: string, content: string, date: string) => {
        await reportRepo.updateReport(id, title, content, new Date(date).toISOString());
        await refreshAll();
    };
    
    const addExpense = async (amount: number, description: string, dateOption?: string) => {
        const available = getAvailableCash();
        if (amount > available) throw new Error(`Insufficient funds for expense! Required: SSP ${amount.toLocaleString()}, Available: SSP ${available.toLocaleString()}`);
        await expenseRepo.addExpense(amount, dateOption ? new Date(dateOption).toISOString() : new Date().toISOString(), description);
        await refreshAll();
    };

    const deleteExpense = async (id: number) => {
        await expenseRepo.deleteExpense(id);
        await refreshAll();
    };

    const updateExpense = async (id: number, amount: number, description: string, date: string) => {
        const oldExp = globalExpenses.find(e => e.id === id);
        const oldAmt = oldExp ? oldExp.amount : 0;
        const available = getAvailableCash();
        if (amount - oldAmt > available) throw new Error(`Insufficient funds to increase expense! Required: SSP ${(amount - oldAmt).toLocaleString()}, Available: SSP ${available.toLocaleString()}`);
        await expenseRepo.updateExpense(id, amount, new Date(date).toISOString(), description);
        await refreshAll();
    };

    // Logical Business Calculations
    const stats = useMemo(() => {
        const totalSalesRevenue = globalSales.reduce((acc, s) => acc + (s.sell_price * s.quantity), 0);
        const totalCostOfGoodsSold = globalSales.reduce((acc, s) => acc + (s.buy_price * s.quantity), 0);
        const totalExpenses = globalExpenses.reduce((acc, e) => acc + e.amount, 0);
        const netProfit = totalSalesRevenue - totalCostOfGoodsSold - totalExpenses;
        
        const totalInventoryValue = globalProducts.reduce((acc, p) => acc + (p.buy_price * p.quantity), 0);
        const potentialRevenue = globalProducts.reduce((acc, p) => acc + (p.sell_price * p.quantity), 0);
        const potentialProfit = potentialRevenue - totalInventoryValue;

        const totalShippingFees = globalShipments.reduce((acc, s) => acc + (s.shipping_cost || 0), 0);
        const totalPayments = globalPayments.reduce((acc, p) => acc + p.amount, 0);
        const availableCash = getAvailableCash();

        return {
            totalSalesRevenue,
            totalCostOfGoodsSold,
            netProfit,
            totalInventoryValue,
            potentialRevenue,
            potentialProfit,
            totalShippingFees,
            totalPayments,
            totalExpenses,
            availableCash,
            profitMargin: totalSalesRevenue > 0 ? (netProfit / totalSalesRevenue) * 100 : 0
        };
    }, [globalSales, globalProducts, globalShipments, globalPayments, globalExpenses]);

    return {
        stats,
        refreshAll,
        // Entities
        products: globalProducts,
        shipments: globalShipments,
        sales: globalSales,
        payments: globalPayments,
        manualReports: globalReports,
        expenses: globalExpenses,
        // Actions
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
        addPayment,
        updatePayment,
        deletePayment,
        addManualReport,
        updateManualReport,
        deleteManualReport,
        addExpense,
        updateExpense,
        deleteExpense,
        // Helpers
        getProductShipments: (productId: number) => productRepo.getProductShipments(productId),
        getProductSales: (productId: number) => productRepo.getProductSales(productId),
        shipmentRepo,
        productRepo,
    };
}
