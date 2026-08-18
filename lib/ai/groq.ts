import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

export const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

async function askGroq(messages: ChatMessage[], maxTokens = 2048): Promise<string> {
  const completion = await groq.chat.completions.create({
    messages,
    model: GROQ_MODEL,
    temperature: 0.3,
    max_tokens: maxTokens,
  });
  return completion.choices[0]?.message?.content || "";
}

async function askGemini(messages: ChatMessage[], maxTokens = 2048): Promise<string> {
  if (!gemini) throw new Error("Gemini no configurado");

  const systemMsg = messages.find((m) => m.role === "system");
  const userMsgs = messages.filter((m) => m.role !== "system");

  const contents = userMsgs.map((m) => ({
    role: m.role === "assistant" ? "model" as const : "user" as const,
    parts: [{ text: m.content }],
  }));

  const response = await gemini.models.generateContent({
    model: GEMINI_MODEL,
    contents,
    config: {
      systemInstruction: systemMsg?.content,
      maxOutputTokens: maxTokens,
      temperature: 0.3,
    },
  });

  return response.text || "";
}

export async function askAI(
  messages: ChatMessage[],
  maxTokens = 2048,
): Promise<{ answer: string; provider: string }> {
  // Try Gemini first (if configured), then Groq
  if (gemini) {
    try {
      const answer = await askGemini(messages, maxTokens);
      if (answer) return { answer, provider: "gemini" };
    } catch (err) {
      console.warn("Gemini failed, falling back to Groq:", err);
    }
  }

  try {
    const answer = await askGroq(messages, maxTokens);
    return { answer, provider: "groq" };
  } catch (err) {
    console.error("Groq also failed:", err);
    throw new Error("No se pudo conectar con el servicio de IA. Verificá las API keys configuradas.");
  }
}

export default { askAI, GROQ_MODEL, GEMINI_MODEL };
