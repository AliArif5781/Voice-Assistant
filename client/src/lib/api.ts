import type { VoiceInteraction, InsertVoiceInteraction } from "@shared/schema";

export async function createVoiceInteraction(data: InsertVoiceInteraction): Promise<VoiceInteraction> {
  const response = await fetch("/api/voice-interactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create voice interaction");
  }
  
  return response.json();
}

export async function getVoiceInteractions(userId?: string, limitCount = 50): Promise<VoiceInteraction[]> {
  const params = new URLSearchParams();
  if (userId) params.append("userId", userId);
  params.append("limit", limitCount.toString());
  
  const response = await fetch(`/api/voice-interactions?${params}`);
  
  if (!response.ok) {
    throw new Error("Failed to fetch voice interactions");
  }
  
  return response.json();
}

export async function checkFirebaseConfig(): Promise<{ available: boolean; message: string }> {
  const response = await fetch("/api/firebase/config");
  
  if (!response.ok) {
    throw new Error("Failed to check Firebase config");
  }
  
  return response.json();
}
