import { type User, type InsertUser, type VoiceInteraction, type InsertVoiceInteraction } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createVoiceInteraction(interaction: InsertVoiceInteraction): Promise<VoiceInteraction>;
  getVoiceInteractions(userId?: string, limit?: number): Promise<VoiceInteraction[]>;
  getVoiceInteractionById(id: number): Promise<VoiceInteraction | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private voiceInteractions: Map<number, VoiceInteraction>;
  private voiceInteractionIdCounter: number;

  constructor() {
    this.users = new Map();
    this.voiceInteractions = new Map();
    this.voiceInteractionIdCounter = 1;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createVoiceInteraction(interaction: InsertVoiceInteraction): Promise<VoiceInteraction> {
    const id = this.voiceInteractionIdCounter++;
    const voiceInteraction: VoiceInteraction = {
      id,
      userId: interaction.userId || "anonymous",
      transcript: interaction.transcript,
      response: interaction.response,
      firebaseDocId: interaction.firebaseDocId || null,
      metadata: interaction.metadata || null,
      createdAt: new Date(),
    };
    this.voiceInteractions.set(id, voiceInteraction);
    return voiceInteraction;
  }

  async getVoiceInteractions(userId?: string, limit: number = 50): Promise<VoiceInteraction[]> {
    let interactions = Array.from(this.voiceInteractions.values());
    
    if (userId) {
      interactions = interactions.filter(i => i.userId === userId);
    }
    
    return interactions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getVoiceInteractionById(id: number): Promise<VoiceInteraction | undefined> {
    return this.voiceInteractions.get(id);
  }
}

export const storage = new MemStorage();
