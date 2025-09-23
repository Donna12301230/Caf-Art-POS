import {
  users,
  artists,
  categories,
  products,
  productOptions,
  orders,
  orderItems,
  customers,
  inventoryItems,
  suppliers,
  artworkSubmissions,
  type User,
  type UpsertUser,
  type Artist,
  type InsertArtist,
  type Category,
  type InsertCategory,
  type Product,
  type InsertProduct,
  type ProductOption,
  type InsertProductOption,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type Customer,
  type InsertCustomer,
  type InventoryItem,
  type InsertInventoryItem,
  type Supplier,
  type InsertSupplier,
  type ArtworkSubmission,
  type InsertArtworkSubmission,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(id: string, info: { stripeCustomerId?: string; stripeSubscriptionId?: string }): Promise<User>;

  // Artist operations
  createArtist(artist: InsertArtist): Promise<Artist>;
  getArtist(id: string): Promise<Artist | undefined>;
  getArtists(status?: string): Promise<Artist[]>;
  updateArtist(id: string, updates: Partial<InsertArtist>): Promise<Artist>;

  // Category operations
  createCategory(category: InsertCategory): Promise<Category>;
  getCategories(type?: string): Promise<Category[]>;

  // Product operations
  createProduct(product: InsertProduct): Promise<Product>;
  getProducts(categoryId?: string, isActive?: boolean): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product>;
  updateProductStock(id: string, quantity: number): Promise<void>;

  // Product options
  createProductOption(option: InsertProductOption): Promise<ProductOption>;
  getProductOptions(productId: string): Promise<ProductOption[]>;

  // Order operations
  createOrder(order: InsertOrder): Promise<Order>;
  getOrders(filters?: { startDate?: Date; endDate?: Date; status?: string }): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  updateOrderStatus(id: string, status: string): Promise<Order>;

  // Order item operations
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  getOrderItems(orderId: string): Promise<OrderItem[]>;

  // Customer operations
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer>;

  // Inventory operations
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  getInventoryItems(): Promise<InventoryItem[]>;
  updateInventoryStock(id: string, quantity: number): Promise<void>;
  getLowStockItems(): Promise<InventoryItem[]>;

  // Supplier operations
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  getSuppliers(): Promise<Supplier[]>;

  // Artwork submission operations
  createArtworkSubmission(submission: InsertArtworkSubmission): Promise<ArtworkSubmission>;
  getArtworkSubmissions(status?: string): Promise<ArtworkSubmission[]>;
  updateArtworkSubmissionStatus(id: string, status: string, reviewedBy: string, rejectionReason?: string): Promise<ArtworkSubmission>;

  // Analytics operations
  getDailyRevenue(date: Date): Promise<number>;
  getTopSellingProducts(limit: number, startDate?: Date, endDate?: Date): Promise<any[]>;
  getArtistPerformance(): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(id: string, info: { stripeCustomerId?: string; stripeSubscriptionId?: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...info, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Artist operations
  async createArtist(artist: InsertArtist): Promise<Artist> {
    const [created] = await db.insert(artists).values(artist).returning();
    return created;
  }

  async getArtist(id: string): Promise<Artist | undefined> {
    const [artist] = await db.select().from(artists).where(eq(artists.id, id));
    return artist;
  }

  async getArtists(status?: string): Promise<Artist[]> {
    if (status) {
      return db.select().from(artists).where(eq(artists.status, status));
    }
    return db.select().from(artists);
  }

  async updateArtist(id: string, updates: Partial<InsertArtist>): Promise<Artist> {
    const [updated] = await db
      .update(artists)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(artists.id, id))
      .returning();
    return updated;
  }

  // Category operations
  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  async getCategories(type?: string): Promise<Category[]> {
    if (type) {
      return db.select().from(categories).where(eq(categories.type, type));
    }
    return db.select().from(categories);
  }

  // Product operations
  async createProduct(product: InsertProduct): Promise<Product> {
    const [created] = await db.insert(products).values(product).returning();
    return created;
  }

  async getProducts(categoryId?: string, isActive?: boolean): Promise<Product[]> {
    let query = db.select().from(products);
    
    if (categoryId && isActive !== undefined) {
      query = query.where(and(eq(products.categoryId, categoryId), eq(products.isActive, isActive)));
    } else if (categoryId) {
      query = query.where(eq(products.categoryId, categoryId));
    } else if (isActive !== undefined) {
      query = query.where(eq(products.isActive, isActive));
    }
    
    return await query;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product> {
    const [updated] = await db
      .update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async updateProductStock(id: string, quantity: number): Promise<void> {
    await db
      .update(products)
      .set({ stockQuantity: quantity, updatedAt: new Date() })
      .where(eq(products.id, id));
  }

  // Product options
  async createProductOption(option: InsertProductOption): Promise<ProductOption> {
    const [created] = await db.insert(productOptions).values(option).returning();
    return created;
  }

  async getProductOptions(productId: string): Promise<ProductOption[]> {
    return db.select().from(productOptions).where(eq(productOptions.productId, productId));
  }

  // Order operations
  async createOrder(order: InsertOrder): Promise<Order> {
    const [created] = await db.insert(orders).values(order).returning();
    return created;
  }

  async getOrders(filters?: { startDate?: Date; endDate?: Date; status?: string }): Promise<Order[]> {
    let query = db.select().from(orders).orderBy(desc(orders.createdAt));

    if (filters) {
      const conditions = [];
      if (filters.startDate) {
        conditions.push(gte(orders.createdAt, filters.startDate));
      }
      if (filters.endDate) {
        conditions.push(lte(orders.createdAt, filters.endDate));
      }
      if (filters.status) {
        conditions.push(eq(orders.orderStatus, filters.status));
      }
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }

    return await query;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const [updated] = await db
      .update(orders)
      .set({ orderStatus: status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  // Order item operations
  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [created] = await db.insert(orderItems).values(item).returning();
    return created;
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  // Customer operations
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [created] = await db.insert(customers).values(customer).returning();
    return created;
  }

  async getCustomers(): Promise<Customer[]> {
    return db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer> {
    const [updated] = await db
      .update(customers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updated;
  }

  // Inventory operations
  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const [created] = await db.insert(inventoryItems).values(item).returning();
    return created;
  }

  async getInventoryItems(): Promise<InventoryItem[]> {
    return db.select().from(inventoryItems).orderBy(inventoryItems.name);
  }

  async updateInventoryStock(id: string, quantity: number): Promise<void> {
    await db
      .update(inventoryItems)
      .set({ currentStock: sql`${quantity}`, updatedAt: new Date() })
      .where(eq(inventoryItems.id, id));
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    return db
      .select()
      .from(inventoryItems)
      .where(sql`${inventoryItems.currentStock} <= ${inventoryItems.minStockLevel}`);
  }

  // Supplier operations
  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [created] = await db.insert(suppliers).values(supplier).returning();
    return created;
  }

  async getSuppliers(): Promise<Supplier[]> {
    return db.select().from(suppliers).orderBy(suppliers.name);
  }

  // Artwork submission operations
  async createArtworkSubmission(submission: InsertArtworkSubmission): Promise<ArtworkSubmission> {
    const [created] = await db.insert(artworkSubmissions).values(submission).returning();
    return created;
  }

  async getArtworkSubmissions(status?: string): Promise<ArtworkSubmission[]> {
    let query = db.select().from(artworkSubmissions).orderBy(desc(artworkSubmissions.submittedAt));
    
    if (status) {
      query = query.where(eq(artworkSubmissions.status, status));
    }
    
    return await query;
  }

  async updateArtworkSubmissionStatus(id: string, status: string, reviewedBy: string, rejectionReason?: string): Promise<ArtworkSubmission> {
    const [updated] = await db
      .update(artworkSubmissions)
      .set({
        status,
        reviewedBy,
        reviewedAt: new Date(),
        rejectionReason,
      })
      .where(eq(artworkSubmissions.id, id))
      .returning();
    return updated;
  }

  // Analytics operations
  async getDailyRevenue(date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await db
      .select({ total: sql<number>`COALESCE(SUM(${orders.total}), 0)` })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startOfDay),
          lte(orders.createdAt, endOfDay),
          eq(orders.paymentStatus, "completed")
        )
      );

    return result[0]?.total || 0;
  }

  async getTopSellingProducts(limit: number, startDate?: Date, endDate?: Date): Promise<any[]> {
    let query = db
      .select({
        productId: orderItems.productId,
        productName: products.name,
        totalQuantity: sql<number>`SUM(${orderItems.quantity})`,
        totalRevenue: sql<number>`SUM(${orderItems.totalPrice})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orders.paymentStatus, "completed"))
      .groupBy(orderItems.productId, products.name)
      .orderBy(sql`SUM(${orderItems.quantity}) DESC`)
      .limit(limit);

    if (startDate && endDate) {
      query = query.where(
        and(
          eq(orders.paymentStatus, "completed"),
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        )
      );
    }

    return await query;
  }

  async getArtistPerformance(): Promise<any[]> {
    return db
      .select({
        artistId: artists.id,
        artistName: artists.name,
        totalSales: sql<number>`COALESCE(SUM(${orderItems.totalPrice}), 0)`,
        totalOrders: sql<number>`COUNT(DISTINCT ${orders.id})`,
        commission: sql<number>`COALESCE(SUM(${orderItems.totalPrice}) * ${artists.commissionRate} / 100, 0)`,
      })
      .from(artists)
      .leftJoin(products, eq(artists.id, products.artistId))
      .leftJoin(orderItems, eq(products.id, orderItems.productId))
      .leftJoin(orders, and(eq(orderItems.orderId, orders.id), eq(orders.paymentStatus, "completed")))
      .groupBy(artists.id, artists.name, artists.commissionRate)
      .orderBy(sql`COALESCE(SUM(${orderItems.totalPrice}), 0) DESC`);
  }
}

export const storage = new DatabaseStorage();
