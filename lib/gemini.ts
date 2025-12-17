import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure this is only used on the server
const apiKey =
  process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

export const model = genAI.getGenerativeModel({
  model: "gemini-3.0-flash-preview",
});
