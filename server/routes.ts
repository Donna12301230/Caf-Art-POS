import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";

export async function registerRoutes(app: Express): Promise<Server> {
  // Stripe payment route — server-side only (secret key must not be exposed to frontend)
  app.post("/api/create-payment-intent", async (req, res) => {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ message: "Stripe is not configured on this server." });
    }
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-08-27.basil",
      });
      const { amount } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "usd",
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
