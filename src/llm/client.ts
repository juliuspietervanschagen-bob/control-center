import OpenAI from "openai";
import { config, hasOpenAiKey } from "../config/env";

let client: OpenAI | null = null;

export function getOpenAiClient(): OpenAI | null {
  if (!hasOpenAiKey()) return null;
  if (!client) {
    client = new OpenAI({ apiKey: config.openaiApiKey });
  }
  return client;
}

export async function completePrompt(system: string, user: string): Promise<string | null> {
  const openai = getOpenAiClient();
  if (!openai) return null;

  const completion = await openai.chat.completions.create({
    model: config.openaiModel,
    temperature: 0.55,
    max_tokens: 700,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const text = completion.choices[0]?.message?.content?.trim();
  return text && text.length > 0 ? text : null;
}
