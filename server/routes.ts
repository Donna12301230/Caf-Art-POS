import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertProductSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertCustomerSchema,
  insertArtistSchema,
  insertArtworkSubmissionSchema,
  insertInventoryItemSchema,
} from "@shared/schema";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Product routes
  app.get('/api/products', async (req, res) => {
    try {
      const { categoryId, isActive } = req.query;
      const products = await storage.getProducts(
        categoryId as string,
        isActive ? isActive === 'true' : undefined
      );
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post('/api/products', isAuthenticated, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(400).json({ message: "Failed to create product" });
    }
  });

  app.get('/api/products/:id/options', async (req, res) => {
    try {
      const options = await storage.getProductOptions(req.params.id);
      res.json(options);
    } catch (error) {
      console.error("Error fetching product options:", error);
      res.status(500).json({ message: "Failed to fetch product options" });
    }
  });

  // Category routes
  app.get('/api/categories', async (req, res) => {
    try {
      const { type } = req.query;
      const categories = await storage.getCategories(type as string);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Order routes
  app.get('/api/orders', isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate, status } = req.query;
      const filters: any = {};
      
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (status) filters.status = status as string;

      const orders = await storage.getOrders(filters);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get('/api/orders/:id', isAuthenticated, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const items = await storage.getOrderItems(req.params.id);
      res.json({ ...order, items });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const orderData = insertOrderSchema.parse({
        ...req.body,
        cashierId: req.user.claims.sub,
        orderNumber: `ORD-${Date.now()}`,
      });
      
      const order = await storage.createOrder(orderData);
      
      // Create order items
      if (req.body.items && Array.isArray(req.body.items)) {
        for (const item of req.body.items) {
          const itemData = insertOrderItemSchema.parse({
            ...item,
            orderId: order.id,
          });
          await storage.createOrderItem(itemData);
          
          // Update product stock if needed
          const product = await storage.getProduct(item.productId);
          if (product && product.stockQuantity !== null) {
            await storage.updateProductStock(
              item.productId,
              product.stockQuantity - item.quantity
            );
          }
        }
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(400).json({ message: "Failed to create order" });
    }
  });

  app.patch('/api/orders/:id/status', isAuthenticated, async (req, res) => {
    try {
      const { status } = req.body;
      const order = await storage.updateOrderStatus(req.params.id, status);
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(400).json({ message: "Failed to update order status" });
    }
  });

  // Customer routes
  app.get('/api/customers', isAuthenticated, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.post('/api/customers', isAuthenticated, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(400).json({ message: "Failed to create customer" });
    }
  });

  // Artist routes
  app.get('/api/artists', isAuthenticated, async (req, res) => {
    try {
      const { status } = req.query;
      const artists = await storage.getArtists(status as string);
      res.json(artists);
    } catch (error) {
      console.error("Error fetching artists:", error);
      res.status(500).json({ message: "Failed to fetch artists" });
    }
  });

  app.post('/api/artists', isAuthenticated, async (req, res) => {
    try {
      const artistData = insertArtistSchema.parse(req.body);
      const artist = await storage.createArtist(artistData);
      res.json(artist);
    } catch (error) {
      console.error("Error creating artist:", error);
      res.status(400).json({ message: "Failed to create artist" });
    }
  });

  app.patch('/api/artists/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = req.body;
      const artist = await storage.updateArtist(req.params.id, updates);
      res.json(artist);
    } catch (error) {
      console.error("Error updating artist:", error);
      res.status(400).json({ message: "Failed to update artist" });
    }
  });

  // Artwork submission routes
  app.get('/api/artwork-submissions', isAuthenticated, async (req, res) => {
    try {
      const { status } = req.query;
      const submissions = await storage.getArtworkSubmissions(status as string);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching artwork submissions:", error);
      res.status(500).json({ message: "Failed to fetch artwork submissions" });
    }
  });

  app.post('/api/artwork-submissions', isAuthenticated, async (req, res) => {
    try {
      const submissionData = insertArtworkSubmissionSchema.parse(req.body);
      const submission = await storage.createArtworkSubmission(submissionData);
      res.json(submission);
    } catch (error) {
      console.error("Error creating artwork submission:", error);
      res.status(400).json({ message: "Failed to create artwork submission" });
    }
  });

  app.patch('/api/artwork-submissions/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { status, rejectionReason } = req.body;
      const reviewerId = req.user.claims.sub;
      
      const submission = await storage.updateArtworkSubmissionStatus(
        req.params.id,
        status,
        reviewerId,
        rejectionReason
      );
      
      res.json(submission);
    } catch (error) {
      console.error("Error updating artwork submission status:", error);
      res.status(400).json({ message: "Failed to update artwork submission status" });
    }
  });

  // Inventory routes
  app.get('/api/inventory', isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getInventoryItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.get('/api/inventory/low-stock', isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getLowStockItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching low stock items:", error);
      res.status(500).json({ message: "Failed to fetch low stock items" });
    }
  });

  app.post('/api/inventory', isAuthenticated, async (req, res) => {
    try {
      const itemData = insertInventoryItemSchema.parse(req.body);
      const item = await storage.createInventoryItem(itemData);
      res.json(item);
    } catch (error) {
      console.error("Error creating inventory item:", error);
      res.status(400).json({ message: "Failed to create inventory item" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/daily-revenue', isAuthenticated, async (req, res) => {
    try {
      const { date } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();
      const revenue = await storage.getDailyRevenue(targetDate);
      res.json({ revenue, date: targetDate });
    } catch (error) {
      console.error("Error fetching daily revenue:", error);
      res.status(500).json({ message: "Failed to fetch daily revenue" });
    }
  });

  app.get('/api/analytics/top-products', isAuthenticated, async (req, res) => {
    try {
      const { limit = 10, startDate, endDate } = req.query;
      const products = await storage.getTopSellingProducts(
        parseInt(limit as string),
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(products);
    } catch (error) {
      console.error("Error fetching top products:", error);
      res.status(500).json({ message: "Failed to fetch top products" });
    }
  });

  app.get('/api/analytics/artist-performance', isAuthenticated, async (req, res) => {
    try {
      const performance = await storage.getArtistPerformance();
      res.json(performance);
    } catch (error) {
      console.error("Error fetching artist performance:", error);
      res.status(500).json({ message: "Failed to fetch artist performance" });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
    try {
      const { amount } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Error creating payment intent: " + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
