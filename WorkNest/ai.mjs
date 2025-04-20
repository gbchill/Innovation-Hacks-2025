
// src/lib/ai.js
import "dotenv/config"                      // for Node.js/.env usage
import { GoogleGenAI } from "@google/genai"

const ai = new GoogleGenAI({
  apiKey: process.env.AIzaSyBP6JUZj2qAGPuoQn14fKK3hz3hI7sM3v8       // set GEMINI_API_KEY in your .env
})

/**
 * Ask Gemini 2.0 for a single completion.
 * @param {string} promptText
 * @returns {Promise<string>}
 */
export async function suggestTitle(promptText) {
  // using the v1 “chat” API on gemini‑2.0‑flash
  const response = await ai.chat.completions.generate({
    model: "gemini-2.0-flash",
    prompt: { text: promptText },
    temperature: 0.7,
    candidateCount: 1,
  })

  // drill down to the assistant’s returned text
  return response.choices?.[0]?.message?.content?.trim() || ""
}




