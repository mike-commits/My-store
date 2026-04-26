import { z } from 'zod';

export const ProductSchema = z.object({
    name: z.string().min(2, "Product name must be at least 2 characters"),
    category: z.string().min(2, "Please select or enter a category"),
    buy_price: z.number().positive("Buy price must be positive"),
    sell_price: z.number().positive("Sell price must be positive"),
    quantity: z.number().int().min(0, "Quantity cannot be negative"),
    notes: z.string().optional(),
    image_url: z.string().url().optional(),
});

export const SaleSchema = z.object({
    product_id: z.number(),
    quantity: z.number().int().positive("Quantity must be at least 1"),
    sell_price: z.number().positive("Sell price must be positive"),
    date: z.string().datetime(),
});

export const ShipmentSchema = z.object({
    date: z.string().datetime(),
    status: z.enum(['pending', 'delivered']),
    shipping_cost: z.number().min(0),
    description: z.string().optional(),
    weight_kg: z.number().positive().optional(),
    items: z.array(z.object({
        product_id: z.number(),
        quantity: z.number().int().positive(),
    })).min(1, "At least one item is required"),
});

export const AuthSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});
