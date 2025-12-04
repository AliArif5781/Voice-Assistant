import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function processVoiceInput(transcript: string): Promise<string> {
  try {
    const prompt = `You are a helpful voice assistant. The user said: "${transcript}"
    
Please provide a helpful, conversational response. Keep it concise and friendly.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error: any) {
    console.error("Gemini API error:", error);
    throw new Error(error.message || "Failed to process voice input with AI");
  }
}

export async function transcribeAudio(audioBase64: string, mimeType: string): Promise<string> {
  try {
    const contents = [
      {
        inlineData: {
          data: audioBase64,
          mimeType: mimeType,
        },
      },
      "Please transcribe this audio. Only output the exact words spoken, nothing else. If no speech is detected, respond with 'No speech detected.'",
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
    });

    return response.text || "No speech detected.";
  } catch (error: any) {
    console.error("Gemini transcription error:", error);
    throw new Error(error.message || "Failed to transcribe audio");
  }
}

export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}
