// TypeScript type definitions for Parse/Back4App classes
// No Drizzle ORM dependencies — data is managed directly via Parse JS SDK

export interface User {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: string; // admin, manager, cashier
  createdAt: string;
  updatedAt: string;
}

export interface Artist {
  id: string;
  name: string;
  email: string;
  phone?: string;
  style?: string;
  bio?: string;
  commissionRate: number;
  status: string; // pending, approved, suspended
  totalSales: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  type: string; // beverage, food, artwork, merchandise
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId?: string;
  artistId?: string;
  imageUrl?: string;
  isActive: boolean;
  isLimited: boolean;
  stockQuantity?: number;
  lowStockThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductOption {
  id: string;
  productId: string;
  name: string;
  value: string;
  priceModifier: number;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  cashierId?: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string; // cash, card, mobile
  paymentStatus: string; // pending, completed, failed
  orderStatus: string; // pending, preparing, completed, cancelled
  orderType: string; // dine_in, takeout, delivery
  tableNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  options?: Record<string, any>;
  specialInstructions?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  loyaltyPoints: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  unitCost?: number;
  supplierId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface ArtworkSubmission {
  id: string;
  artistId: string;
  title: string;
  description?: string;
  imageUrl: string;
  price: number;
  status: string; // pending, approved, rejected
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}
