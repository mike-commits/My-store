export interface Product {
    id: number;
    name: string;
    category: string;
    buy_price: number;
    sell_price: number;
    quantity: number; // main stock
    notes?: string;
    shipped_quantity?: number;
    sold_quantity?: number;
}

export interface Shipment {
    id: number;
    date: string;
    status: 'pending' | 'delivered';
    shipping_cost?: number;
    description?: string;
    weight_kg?: number;
    items?: ShipmentItem[];
}

export interface ShipmentItem {
    id: number;
    shipment_id: number;
    product_id: number;
    product_name?: string;
    quantity: number;
}

export interface Sale {
    id: number;
    product_id: number;
    product_name?: string;
    date: string;
    quantity: number;
    buy_price: number;
    sell_price: number;
}

export interface Payment {
    id: number;
    amount: number;
    date: string;
    notes: string;
}

export interface ManualReport {
    id: number;
    date: string;
    title: string;
    content: string;
}

export interface Expense {
    id: number;
    amount: number;
    date: string;
    description: string;
}
