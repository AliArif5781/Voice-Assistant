import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVoiceInteractionSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { processVoiceInput, isGeminiConfigured, transcribeAudio } from "./gemini";
import { extractTasksFromText } from "./time-parser";

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

  // Audio transcription endpoint
  app.post("/api/transcribe", async (req, res) => {
    try {
      if (!isGeminiConfigured()) {
        return res.status(503).json({ 
          error: "Gemini API not configured",
          message: "Please add your GEMINI_API_KEY to transcribe audio"
        });
      }

      const { audio, mimeType } = req.body;
      
      if (!audio || typeof audio !== "string") {
        return res.status(400).json({ error: "audio (base64) is required" });
      }

      const transcript = await transcribeAudio(audio, mimeType || "audio/webm");
      res.json({ transcript });
    } catch (error: any) {
      console.error("Transcription error:", error);
      res.status(500).json({ error: "Failed to transcribe audio", message: error.message });
    }
  });

  // Gemini AI processing endpoint
  app.post("/api/gemini/process", async (req, res) => {
    try {
      if (!isGeminiConfigured()) {
        return res.status(503).json({ 
          error: "Gemini API not configured",
          message: "Please add your GEMINI_API_KEY to use AI features"
        });
      }

      const { transcript } = req.body;
      
      if (!transcript || typeof transcript !== "string") {
        return res.status(400).json({ error: "transcript is required" });
      }

      const response = await processVoiceInput(transcript);
      res.json({ response });
    } catch (error: any) {
      console.error("Gemini processing error:", error);
      res.status(500).json({ error: "Failed to process with AI", message: error.message });
    }
  });

  // Gemini config status endpoint
  app.get("/api/gemini/config", async (req, res) => {
    res.json({
      available: isGeminiConfigured(),
      message: isGeminiConfigured() 
        ? "Gemini AI is configured and ready" 
        : "Gemini API key not yet configured"
    });
  });

  // Extract tasks with times from transcription text
  app.post("/api/extract-tasks", async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "text is required" });
      }

      const tasks = extractTasksFromText(text);
      res.json({ tasks });
    } catch (error: any) {
      console.error("Task extraction error:", error);
      res.status(500).json({ error: "Failed to extract tasks", message: error.message });
    }
  });

  // Firebase config endpoint - exposes config for frontend initialization
  app.get("/api/firebase/config", async (req, res) => {
    const hasConfig = !!(
      process.env.FIREBASE_API_KEY &&
      process.env.FIREBASE_AUTH_DOMAIN &&
      process.env.FIREBASE_PROJECT_ID
    );
    
    if (hasConfig) {
      res.json({
        available: true,
        message: "Firebase is configured and ready",
        config: {
          apiKey: process.env.FIREBASE_API_KEY,
          authDomain: process.env.FIREBASE_AUTH_DOMAIN,
          projectId: process.env.FIREBASE_PROJECT_ID,
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.FIREBASE_APP_ID,
        }
      });
    } else {
      res.json({
        available: false,
        message: "Firebase credentials not yet configured"
      });
    }
  });

  return httpServer;
}
