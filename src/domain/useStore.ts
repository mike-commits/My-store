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

    useEffect(() => {
        listeners.push(forceUpdate);
        // Initial load if empty
        if (globalProducts.length === 0) {
            refreshAll();
        }
        return () => {
            listeners = listeners.filter(l => l !== forceUpdate);
        };
    }, [forceUpdate]);

    const refreshAll = useCallback(() => {
        globalProducts = productRepo.getProducts();
        globalShipments = shipmentRepo.getShipments();
        globalSales = saleRepo.getSales();
        globalPayments = paymentRepo.getPayments();
        globalReports = reportRepo.getReports();
        globalExpenses = expenseRepo.getExpenses();
        notifyListeners();
    }, []);

    const getAvailableCash = () => {
        const totalPay = globalPayments.reduce((acc, p) => acc + p.amount, 0);
        const totalExp = globalExpenses.reduce((acc, e) => acc + e.amount, 0);
        const totalShip = globalShipments.reduce((acc, s) => acc + (s.shipping_cost || 0), 0);
        const totalInv = globalProducts.reduce((acc, p) => acc + (p.buy_price * p.quantity), 0);
        const totalCogs = globalSales.reduce((acc, s) => acc + (s.buy_price * s.quantity), 0);
        return totalPay - totalExp - totalShip - totalInv - totalCogs;
    };

    const addProduct = async (product: Omit<Product, 'id'>) => {
        const cost = product.buy_price * product.quantity;
        const available = getAvailableCash();
        if (cost > available) throw new Error(`Insufficient funds in shop! Required: SSP ${cost.toLocaleString()}, Available: SSP ${available.toLocaleString()}`);
        productRepo.addProduct(product);
        refreshAll();
    };

    const updateProduct = async (product: Product) => {
        const oldProduct = globalProducts.find(p => p.id === product.id);
        const oldCost = oldProduct ? (oldProduct.buy_price * oldProduct.quantity) : 0;
        const newCost = product.buy_price * product.quantity;
        const available = getAvailableCash();
        if (newCost - oldCost > available) throw new Error(`Insufficient funds for this update! Required: SSP ${(newCost - oldCost).toLocaleString()}, Available: SSP ${available.toLocaleString()}`);
        productRepo.updateProduct(product);
        refreshAll();
    };

    const deleteProduct = async (id: number) => {
        productRepo.deleteProduct(id);
        refreshAll();
    };

    const addShipment = async (date: string, status: string, items: Omit<ShipmentItem, 'id' | 'shipment_id'>[], shippingCost: number = 0, description?: string, weightKg?: number) => {
        let itemsCost = 0;
        for (const item of items) {
            const p = globalProducts.find(x => x.id === item.product_id);
            if (p) itemsCost += p.buy_price * item.quantity;
        }
        const totalCost = itemsCost + shippingCost;
        const available = getAvailableCash();
        if (totalCost > available) throw new Error(`Insufficient funds for shipment! Required: SSP ${totalCost.toLocaleString()}, Available: SSP ${available.toLocaleString()}`);

        shipmentRepo.addShipment(date, status, items, shippingCost, description, weightKg);
        refreshAll();
    };

    const addSale = async (productId: number, date: string, quantity: number, sellPrice: number) => {
        const product = globalProducts.find(p => p.id === productId);
        const buyPrice = product?.buy_price || 0;
        saleRepo.addSale(productId, date, quantity, buyPrice, sellPrice);
        refreshAll();
    };

    const addPayment = async (amount: number, date: string, notes: string) => {
        paymentRepo.addPayment(amount, date, notes);
        refreshAll();
    };

    const deletePayment = async (id: number) => {
        paymentRepo.deletePayment(id);
        refreshAll();
    };

    const updatePayment = async (id: number, amount: number, date: string, notes: string) => {
        paymentRepo.updatePayment(id, amount, new Date(date).toISOString(), notes);
        refreshAll();
    };

    const addManualReport = async (title: string, content: string, dateOption?: string) => {
        reportRepo.addReport(title, content, dateOption ? new Date(dateOption).toISOString() : new Date().toISOString());
        refreshAll();
    };

    const deleteManualReport = async (id: number) => {
        reportRepo.deleteReport(id);
        refreshAll();
    };

    const updateManualReport = async (id: number, title: string, content: string, date: string) => {
        reportRepo.updateReport(id, title, content, new Date(date).toISOString());
        refreshAll();
    };
    
    const addExpense = async (amount: number, description: string, dateOption?: string) => {
        const available = getAvailableCash();
        if (amount > available) throw new Error(`Insufficient funds for expense! Required: SSP ${amount.toLocaleString()}, Available: SSP ${available.toLocaleString()}`);
        expenseRepo.addExpense(amount, dateOption ? new Date(dateOption).toISOString() : new Date().toISOString(), description);
        refreshAll();
    };

    const deleteExpense = async (id: number) => {
        expenseRepo.deleteExpense(id);
        refreshAll();
    };

    const updateExpense = async (id: number, amount: number, description: string, date: string) => {
        const oldExp = globalExpenses.find(e => e.id === id);
        const oldAmt = oldExp ? oldExp.amount : 0;
        const available = getAvailableCash();
        if (amount - oldAmt > available) throw new Error(`Insufficient funds to increase expense! Required: SSP ${(amount - oldAmt).toLocaleString()}, Available: SSP ${available.toLocaleString()}`);
        expenseRepo.updateExpense(id, amount, new Date(date).toISOString(), description);
        refreshAll();
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
        products: globalProducts,
        shipments: globalShipments,
        sales: globalSales,
        payments: globalPayments,
        manualReports: globalReports,
        expenses: globalExpenses,
        stats,
        refreshAll,
        addProduct,
        updateProduct,
        addShipment,
        addSale,
        addPayment,
        addManualReport,
        updateManualReport,
        deleteManualReport,
        addPayment,
        deletePayment,
        updatePayment,
        addExpense,
        deleteExpense,
        updateExpense,
        deleteProduct,
        deleteShipment: (id: number) => {
            shipmentRepo.deleteShipment(id);
            refreshAll();
        },
        deleteSale: (id: number) => {
            saleRepo.deleteSale(id);
            refreshAll();
        },
        shipmentRepo,
        productRepo,
        getProductShipments: (productId: number) => productRepo.getProductShipments(productId),
        getProductSales: (productId: number) => productRepo.getProductSales(productId),
    };
}
