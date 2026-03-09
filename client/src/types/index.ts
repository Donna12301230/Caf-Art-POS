// Parse object plain representations
export interface VendorData {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  coverImage?: string;
  isApproved: boolean;
  isActive: boolean;
  subscriptionStatus: "trial" | "active" | "expired" | "cancelled";
  subscriptionEndDate?: Date;
  ownerId: string;
  createdAt: Date;
}

export interface MenuItemData {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  isAvailable: boolean;
  category: string;
  vendorId: string;
  createdAt: Date;
}

export interface EarlyBirdRule {
  daysInAdvance: number; // minimum days before pickup
  discountRate: number;  // e.g. 0.9 = 90% = 10% off
}

export interface CartItem {
  menuItem: MenuItemData;
  quantity: number;
  note: string;
}

export interface PreOrderData {
  id: string;
  customerId: string;
  vendorId: string;
  vendorName: string;
  pickupDate: Date;
  pickupLocation: string;
  orderType: "individual" | "group";
  groupName?: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentMethod: "cash";
  paymentStatus: "unpaid" | "paid";
  items: PreOrderItemData[];
  createdAt: Date;
}

export interface PreOrderItemData {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  note: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  phone?: string;
  studentId?: string;
  department?: string;
  role: "customer" | "vendor" | "admin";
}

export interface TableOrderData {
  id: string;
  vendorId: string;
  tableName: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  paymentMethod: "cash";
  paymentStatus: "unpaid" | "paid";
  note: string;
  items: TableOrderItemData[];
  createdAt: Date;
}

export interface TableOrderItemData {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  note: string;
}
