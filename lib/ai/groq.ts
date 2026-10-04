import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

export const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

// Groq free tier: 8k tokens por minuto, y un request no puede superar ese
// budget. El prompt (input) tiene que dejar lugar para max_tokens (output).
// Medido contra gpt-oss-120b: ~3.3 chars/token en JSON con español, así que
// usamos 3.0 como estimador conservador.
const GROQ_TPM_LIMIT_TOKENS = 8000;
const CHARS_PER_TOKEN = 3.0;

function truncateForGroq(messages: ChatMessage[], maxChars: number): ChatMessage[] {
  const total = messages.reduce((s, m) => s + m.content.length, 0);
  if (total <= maxChars) return messages;

  const budget = messages.map((m) => m.content.length);
  let excess = total - maxChars;

  for (let i = messages.length - 1; i >= 0 && excess > 0; i--) {
    const take = Math.min(budget[i], excess);
    budget[i] -= take;
    excess -= take;
  }

  const trimmed = messages.map((m, i) => ({ ...m, content: m.content.slice(0, budget[i]) }));

  const lastUser = trimmed.findLastIndex((m) => m.role === "user");
  if (lastUser >= 0) {
    trimmed[lastUser].content +=
      "\n\n[Contexto recortado por límite de tokens del modelo. Respondé con lo que tengas disponible y aclará si te falta información.]";
  }

  return trimmed;
}

async function askGroq(messages: ChatMessage[], maxTokens = 2048): Promise<string> {
  const maxPromptChars = Math.floor(
    (GROQ_TPM_LIMIT_TOKENS - maxTokens) * CHARS_PER_TOKEN,
  );

  const completion = await groq.chat.completions.create({
    messages: truncateForGroq(messages, maxPromptChars),
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
