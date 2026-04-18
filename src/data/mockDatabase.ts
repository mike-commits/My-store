const STORE_KEY = 'mystore_db_mock';

let webStore: Record<string, any[]> = {
  products: [],
  shipments: [],
  shipment_items: [],
  sales: [],
  payments: [],
  expenses: [],
  manual_reports: []
};

try {
    if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(STORE_KEY);
        if (saved) webStore = JSON.parse(saved);
    }
} catch (e) {
    console.warn("Failed to load web store from localStorage", e);
}

const saveWebStore = () => {
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORE_KEY, JSON.stringify(webStore));
        }
    } catch (e) {
        console.warn("Failed to save web store to localStorage", e);
    }
};

export const mockDb = {
  execSync: (sql: string) => {
    console.log("Mock Exec:", sql);
  },
  runSync: (sql: string, params: any[] = []) => {
    console.log("Mock Run:", sql, params);
    const sqlLower = sql.toLowerCase();
    
    if (sqlLower.includes('insert into products')) {
        const id = Date.now();
        webStore.products.push({ id, name: params[0], category: params[1], buy_price: params[2], sell_price: params[3], quantity: params[4], notes: params[5], date: params[6] });
        saveWebStore();
        return { lastInsertRowId: id };
    }
    if (sqlLower.includes('insert into shipments')) {
        const id = Date.now();
        webStore.shipments.push({ id, date: params[0], status: params[1], shipping_cost: params[2], description: params[3], weight_kg: params[4] });
        saveWebStore();
        return { lastInsertRowId: id };
    }
    if (sqlLower.includes('insert into sales')) {
        const id = Date.now();
        webStore.sales.push({ id, product_id: params[0], date: params[1], quantity: params[2], buy_price: params[3], sell_price: params[4] });
        saveWebStore();
        return { lastInsertRowId: id };
    }
    if (sqlLower.includes('insert into shipment_items')) {
        webStore.shipment_items.push({ shipment_id: params[0], product_id: params[1], quantity: params[2] });
        saveWebStore();
    }
    if (sqlLower.includes('insert into payments')) {
        webStore.payments.push({ id: Date.now(), amount: params[0], date: params[1], notes: params[2] });
        saveWebStore();
    }
    if (sqlLower.includes('insert into manual_reports')) {
        webStore.manual_reports.push({ id: Date.now(), date: params[0], title: params[1], content: params[2] });
        saveWebStore();
    }
    if (sqlLower.includes('update manual_reports')) {
        const idx = webStore.manual_reports.findIndex(x => x.id === params[3]);
        if (idx !== -1) {
            webStore.manual_reports[idx] = { ...webStore.manual_reports[idx], title: params[0], content: params[1], date: params[2] };
            saveWebStore();
        }
    }
    if (sqlLower.includes('insert into expenses')) {
        webStore.expenses.push({ id: Date.now(), amount: params[0], date: params[1], description: params[2] });
        saveWebStore();
    }

    if (sqlLower.includes('update products set quantity = quantity + ?')) {
        const p = webStore.products.find(x => x.id === params[1]);
        if (p) p.quantity += params[0];
        saveWebStore();
    } else if (sqlLower.includes('update products set quantity = quantity - ?')) {
        const p = webStore.products.find(x => x.id === params[1]);
        if (p) p.quantity -= params[0];
        saveWebStore();
    } else if (sqlLower.includes('update products set')) {
        const index = webStore.products.findIndex(x => x.id === params[7]);
        if (index !== -1) {
            webStore.products[index] = { ...webStore.products[index], name: params[0], category: params[1], buy_price: params[2], sell_price: params[3], quantity: params[4], notes: params[5], date: params[6] };
            saveWebStore();
        }
    }

    if (sqlLower.includes('delete from products')) {
        webStore.products = webStore.products.filter(x => x.id !== params[0]);
        saveWebStore();
    } else if (sqlLower.includes('delete from shipments')) {
        webStore.shipments = webStore.shipments.filter(x => x.id !== params[0]);
        webStore.shipment_items = webStore.shipment_items.filter(x => x.shipment_id !== params[0]);
        saveWebStore();
    } else if (sqlLower.includes('delete from sales')) {
        webStore.sales = webStore.sales.filter(x => x.id !== params[0]);
        saveWebStore();
    } else if (sqlLower.includes('delete from manual_reports')) {
        webStore.manual_reports = webStore.manual_reports.filter(x => x.id !== params[0]);
        saveWebStore();
    } else if (sqlLower.includes('delete from expenses')) {
        webStore.expenses = webStore.expenses.filter(x => x.id !== params[0]);
        saveWebStore();
    } else if (sqlLower.includes('update expenses set')) {
        const idx = webStore.expenses.findIndex(x => x.id === params[3]);
        if (idx !== -1) {
            webStore.expenses[idx] = { ...webStore.expenses[idx], amount: params[0], date: params[1], description: params[2] };
            saveWebStore();
        }
    } else if (sqlLower.includes('delete from payments')) {
        webStore.payments = webStore.payments.filter(x => x.id !== params[0]);
        saveWebStore();
    } else if (sqlLower.includes('update payments set')) {
        const idx = webStore.payments.findIndex(x => x.id === params[3]);
        if (idx !== -1) {
            webStore.payments[idx] = { ...webStore.payments[idx], amount: params[0], date: params[1], notes: params[2] };
            saveWebStore();
        }
    }

    return { lastInsertRowId: 0 };
  },
  getAllSync: <T>(sql: string, params: any[] = []): T[] => {
    const sqlLower = sql.toLowerCase();
    let result: any[] = [];
    if (sqlLower.includes('from products')) {
        result = webStore.products.map(p => ({
            ...p,
            shipped_quantity: webStore.shipment_items.filter(si => si.product_id === p.id).reduce((s, i) => s + i.quantity, 0),
            sold_quantity: webStore.sales.filter(sa => sa.product_id === p.id).reduce((s, i) => s + i.quantity, 0)
        }));
    } else if (sqlLower.includes('from shipment_items')) {
        if (sqlLower.includes('where product_id = ?')) {
            result = webStore.shipment_items.filter(si => si.product_id === params[0]).map(si => ({
                ...si,
                date: webStore.shipments.find(s => s.id === si.shipment_id)?.date
            }));
        } else {
            result = webStore.shipment_items.filter(si => si.shipment_id === params[0]).map(si => ({
                ...si,
                product_name: webStore.products.find(p => p.id === si.product_id)?.name
            }));
        }
    } else if (sqlLower.includes('from shipments')) {
        result = webStore.shipments;
    } else if (sqlLower.includes('from sales')) {
        if (sqlLower.includes('where product_id = ?')) {
            result = webStore.sales.filter(s => s.product_id === params[0]);
        } else {
            result = webStore.sales.map(s => ({
                ...s,
                product_name: webStore.products.find(p => p.id === s.product_id)?.name
            }));
        }
    } else if (sqlLower.includes('from payments')) {
        result = webStore.payments;
    } else if (sqlLower.includes('from manual_reports')) {
        result = webStore.manual_reports;
    } else if (sqlLower.includes('from expenses')) {
        result = webStore.expenses;
    }
    return result as T[];
  },
  getFirstSync: <T>(sql: string, params: any[] = []): T | null => {
    const sqlLower = sql.toLowerCase();
    if (sqlLower.includes('from products where id = ?')) {
        return (webStore.products.find(p => p.id === params[0]) || null) as T | null;
    }
    if (sqlLower.includes('from sales where id = ?')) {
        return (webStore.sales.find(s => s.id === params[0]) || null) as T | null;
    }
    return null;
  },
  withTransactionSync: (cb: () => void) => cb(),
};
