// Gemini API 테스트 스크립트
// 실행: npx tsx scripts/test-gemini.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";

// .env.local 로드
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const apiKey =
  process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ GEMINI_API_KEY가 .env.local에 설정되지 않았습니다!");
  process.exit(1);
}

console.log(
  "🔑 API Key found:",
  apiKey.substring(0, 8) + "..." + apiKey.substring(apiKey.length - 4)
);

async function testGemini() {
  try {
    const genAI = new GoogleGenerativeAI(apiKey!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    console.log("\n📡 Gemini API 테스트 중...\n");

    const result = await model.generateContent(
      "안녕! 간단하게 한줄로 인사해줘."
    );
    const response = await result.response;
    const text = response.text();

    console.log("✅ API 응답 성공!");
    console.log("📝 응답:", text);
  } catch (error) {
    console.error("❌ API 호출 실패:", error);
  }
}

testGemini();
