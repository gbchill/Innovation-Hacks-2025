// ai.js
import "dotenv/config";                   // if you’re using .env
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: "AIzaSyBP6JUZj2qAGPuoQn14fKK3hz3hI7sM3v8"
});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: "Explain how AI works in a few words",
  });
  console.log(response.text);
}

main().catch(console.error);
