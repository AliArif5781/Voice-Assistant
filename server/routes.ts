import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVoiceInteractionSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Voice Interactions API
  app.post("/api/voice-interactions", async (req, res) => {
    try {
      const validatedData = insertVoiceInteractionSchema.parse(req.body);
      const interaction = await storage.createVoiceInteraction(validatedData);
      res.status(201).json(interaction);
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      res.status(500).json({ error: "Failed to create voice interaction" });
    }
  });

  app.get("/api/voice-interactions", async (req, res) => {
    try {
      const userId = req.query.userId as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const interactions = await storage.getVoiceInteractions(userId, limit);
      res.json(interactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch voice interactions" });
    }
  });

  app.get("/api/voice-interactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const interaction = await storage.getVoiceInteractionById(id);
      
      if (!interaction) {
        return res.status(404).json({ error: "Voice interaction not found" });
      }
      
      res.json(interaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch voice interaction" });
    }
  });

  // Firebase config endpoint
  app.get("/api/firebase/config", async (req, res) => {
    res.json({
      available: !!process.env.FIREBASE_API_KEY,
      message: process.env.FIREBASE_API_KEY 
        ? "Firebase is configured and ready" 
        : "Firebase credentials not yet configured"
    });
  });

  return httpServer;
}
