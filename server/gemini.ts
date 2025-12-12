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
      "Please transcribe this audio. Remove all filler words such as 'um', 'uh', 'uhm', 'hmm', 'ah', 'er', 'like' (when used as filler), 'you know', 'I mean', and similar hesitation sounds. Clean up the transcription to be clear and readable while preserving the meaning. Only output the cleaned transcribed words, nothing else. If no speech is detected, respond with 'No speech detected.'",
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

export interface ExtractedTaskInfo {
  title: string;
  description: string | null;
  priority: "high" | "medium" | "low";
  category: string;
  dueDate: string | null;
  actionItems: string[];
}

export async function extractTasksFromTranscript(transcript: string): Promise<ExtractedTaskInfo[]> {
  try {
    const prompt = `Analyze the following spoken text and extract important tasks, action items, and key information. Create a structured task list.

Spoken text: "${transcript}"

For each task or important piece of information found, provide:
- title: A concise title for the task/item (max 50 chars)
- description: Additional context if needed (null if not needed)
- priority: "high", "medium", or "low" based on urgency/importance mentioned
- category: One of: "Task", "Meeting", "Reminder", "Note", "Follow-up", "Deadline", "Idea"
- dueDate: ISO date string if a specific time/date is mentioned, null otherwise
- actionItems: Array of specific action steps to complete this task

Return a JSON array of objects. If no meaningful tasks are found, return an empty array [].
Only return valid JSON, no markdown formatting or explanation.

Example output:
[{"title":"Call John about project","description":"Discuss budget concerns","priority":"high","category":"Follow-up","dueDate":"2024-12-13T14:00:00.000Z","actionItems":["Prepare budget report","Schedule 30 min call"]}]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text || "[]";
    
    // Clean up the response - remove markdown code blocks if present
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.slice(7);
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.slice(3);
    }
    if (cleanedText.endsWith("```")) {
      cleanedText = cleanedText.slice(0, -3);
    }
    cleanedText = cleanedText.trim();

    try {
      const tasks = JSON.parse(cleanedText);
      return Array.isArray(tasks) ? tasks : [];
    } catch {
      console.error("Failed to parse Gemini response as JSON:", cleanedText);
      return [];
    }
  } catch (error: any) {
    console.error("Gemini task extraction error:", error);
    throw new Error(error.message || "Failed to extract tasks from transcript");
  }
}
