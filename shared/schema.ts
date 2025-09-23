import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("cashier"), // admin, manager, cashier
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Artists table
export const artists = pgTable("artists", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  name: varchar("name").notNull(),
  email: varchar("email").notNull().unique(),
  phone: varchar("phone"),
  style: text("style"),
  bio: text("bio"),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("30.00"),
  status: varchar("status").notNull().default("pending"), // pending, approved, suspended
  totalSales: decimal("total_sales", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categories table
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  type: varchar("type").notNull(), // beverage, food, artwork, merchandise
  createdAt: timestamp("created_at").defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  categoryId: uuid("category_id").references(() => categories.id),
  artistId: uuid("artist_id").references(() => artists.id),
  imageUrl: varchar("image_url"),
  isActive: boolean("is_active").default(true),
  isLimited: boolean("is_limited").default(false),
  stockQuantity: integer("stock_quantity").default(0),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product variants/options (sizes, temperatures, etc.)
export const productOptions = pgTable("product_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").references(() => products.id),
  name: varchar("name").notNull(), // Size, Temperature, Add-on
  value: varchar("value").notNull(), // Small, Medium, Large / Hot, Iced / Extra Shot
  priceModifier: decimal("price_modifier", { precision: 5, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderNumber: varchar("order_number").notNull().unique(),
  customerId: uuid("customer_id").references(() => customers.id),
  cashierId: varchar("cashier_id").references(() => users.id),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0.00"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method").notNull(), // cash, card, mobile
  paymentStatus: varchar("payment_status").notNull().default("pending"), // pending, completed, failed
  orderStatus: varchar("order_status").notNull().default("pending"), // pending, preparing, completed, cancelled
  orderType: varchar("order_type").notNull().default("dine_in"), // dine_in, takeout, delivery
  tableNumber: varchar("table_number"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order items table
export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").references(() => orders.id),
  productId: uuid("product_id").references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  options: jsonb("options"), // Selected options (size, temperature, add-ons)
  specialInstructions: text("special_instructions"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customers table
export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  loyaltyPoints: integer("loyalty_points").default(0),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inventory items table
export const inventoryItems = pgTable("inventory_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  unit: varchar("unit").notNull(), // kg, lbs, pieces, etc.
  currentStock: decimal("current_stock", { precision: 10, scale: 2 }).notNull(),
  minStockLevel: decimal("min_stock_level", { precision: 10, scale: 2 }).notNull(),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  supplierId: uuid("supplier_id").references(() => suppliers.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name").notNull(),
  contactName: varchar("contact_name"),
  email: varchar("email"),
  phone: varchar("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Artwork submissions table
export const artworkSubmissions = pgTable("artwork_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  artistId: uuid("artist_id").references(() => artists.id),
  title: varchar("title").notNull(),
  description: text("description"),
  imageUrl: varchar("image_url").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").notNull().default("pending"), // pending, approved, rejected
  rejectionReason: text("rejection_reason"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  artworkReviews: many(artworkSubmissions),
}));

export const artistsRelations = relations(artists, ({ one, many }) => ({
  user: one(users, {
    fields: [artists.userId],
    references: [users.id],
  }),
  products: many(products),
  artworkSubmissions: many(artworkSubmissions),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  artist: one(artists, {
    fields: [products.artistId],
    references: [artists.id],
  }),
  options: many(productOptions),
  orderItems: many(orderItems),
}));

export const productOptionsRelations = relations(productOptions, ({ one }) => ({
  product: one(products, {
    fields: [productOptions.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  cashier: one(users, {
    fields: [orders.cashierId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export const inventoryItemsRelations = relations(inventoryItems, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [inventoryItems.supplierId],
    references: [suppliers.id],
  }),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  inventoryItems: many(inventoryItems),
}));

export const artworkSubmissionsRelations = relations(artworkSubmissions, ({ one }) => ({
  artist: one(artists, {
    fields: [artworkSubmissions.artistId],
    references: [artists.id],
  }),
  reviewer: one(users, {
    fields: [artworkSubmissions.reviewedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertArtistSchema = createInsertSchema(artists);
export const insertCategorySchema = createInsertSchema(categories);
export const insertProductSchema = createInsertSchema(products);
export const insertProductOptionSchema = createInsertSchema(productOptions);
export const insertOrderSchema = createInsertSchema(orders);
export const insertOrderItemSchema = createInsertSchema(orderItems);
export const insertCustomerSchema = createInsertSchema(customers);
export const insertInventoryItemSchema = createInsertSchema(inventoryItems);
export const insertSupplierSchema = createInsertSchema(suppliers);
export const insertArtworkSubmissionSchema = createInsertSchema(artworkSubmissions);

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertArtist = z.infer<typeof insertArtistSchema>;
export type Artist = typeof artists.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProductOption = z.infer<typeof insertProductOptionSchema>;
export type ProductOption = typeof productOptions.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertArtworkSubmission = z.infer<typeof insertArtworkSubmissionSchema>;
export type ArtworkSubmission = typeof artworkSubmissions.$inferSelect;
