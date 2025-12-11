"use server";

import { model } from "@/lib/gemini";

export interface CharacterProfile {
  name: string;
  description: string;
  abilities: string[];
}

export interface GeneratedCharacterData {
  abilities: string[];
  narrative: string;
}

// Helper function to extract JSON from potentially messy AI output
function extractJSON(text: string): string {
  // Try to find JSON object pattern
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  // Fallback: clean markdown code blocks
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export async function generateCharacterDetails(
  name: string,
  description: string
): Promise<GeneratedCharacterData> {
  const prompt = `
    당신은 판타지/SF 롤플레잉 게임의 창작 작가입니다.
    다음 입력을 바탕으로 캐릭터 프로필을 생성하세요:
    
    이름: ${name}
    설명/컨셉: ${description}

    반드시 JSON 형식으로만 출력하세요. 다른 텍스트는 절대 추가하지 마세요.
    JSON 형식:
    {
      "abilities": ["능력명: 간단한 설명", "능력명: 간단한 설명"],
      "narrative": "300-400자의 매력적인 캐릭터 소개 (소설의 한 장면처럼)"
    }

    중요:
    - abilities 배열에 정확히 2개의 특수 능력 포함
    - narrative는 한국어로 작성, ${name}이 주인공인 것처럼
    - JSON만 출력, 설명이나 마크다운 없이
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("Raw AI Response:", text.substring(0, 500));

    // Extract JSON from response
    const jsonText = extractJSON(text);
    const data = JSON.parse(jsonText);

    return {
      abilities: data.abilities || ["기본 공격", "방어"],
      narrative: data.narrative || "서사가 생성되지 않았습니다.",
    };
  } catch (error: unknown) {
    console.error("Gemini Generation Error:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    const status = (error as { status?: number })?.status;
    const isOverloaded =
      errorMessage.includes("429") ||
      status === 429 ||
      errorMessage.includes("Quota");

    if (isOverloaded) {
      throw new Error("429_TOO_MANY_REQUESTS");
    }

    return {
      abilities: ["??", "??"],
      narrative: "알 수 없는 힘에 의해 기록이 소실되었습니다.",
    };
  }
}

export async function generateBattleLog(
  charA: CharacterProfile,
  charB: CharacterProfile
): Promise<string> {
  const prompt = `
    두 캐릭터 간의 상세한 배틀 로그를 작성하세요. 판타지/SF 배경입니다.
    
    캐릭터 A: ${charA.name} - ${charA.description}
    능력 A: ${charA.abilities.join(", ")}
    
    캐릭터 B: ${charB.name} - ${charB.description}
    능력 B: ${charB.abilities.join(", ")}
    
    요구사항:
    - 길이: 약 2000자 (한국어)
    - 형식: 자주 문단을 나누세요. 대사는 "> "로 시작하세요. 능력 사용 시 **능력명** 강조
    - 톤: 긴박하고, 극적이며, 상세하게
    - 결과: 능력과 설명을 논리적으로 분석하여 승자 결정
    - 구조: 조우 → 능력 충돌 → 클라이맥스 → 결말
    
    한국어로만 작성하세요.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: unknown) {
    console.error("Battle Gen Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const status = (error as { status?: number })?.status;
    const isOverloaded =
      errorMessage.includes("429") ||
      status === 429 ||
      errorMessage.includes("Quota");

    if (isOverloaded) {
      throw new Error("429_TOO_MANY_REQUESTS");
    }

    return "배틀 로그 생성에 실패했습니다.";
  }
}

// Generate diary-style entry for the Book page
export async function generateDiaryEntry(
  type: "character" | "battle",
  data: { name: string; description?: string; opponentName?: string }
): Promise<string> {
  let prompt = "";

  if (type === "character") {
    prompt = `
      오늘 당신은 "${data.name}"이라는 캐릭터가 되어 하루를 보냈습니다.
      캐릭터 설명: ${data.description || ""}
      
      이 경험을 일기처럼, 감성적이고 문학적인 문체로 2-3문장 작성해주세요.
      마치 실제로 그 캐릭터가 되어 살았던 것처럼 1인칭 시점으로 적어주세요.
      
      예시: "오늘은 그림자 속을 걷는 자가 되었다. 어둠이 친구처럼 다가왔고, 나는 비로소 진정한 자유를 느꼈다."
      
      한국어로만, 2-3문장으로 작성하세요.
    `;
  } else {
    prompt = `
      오늘 당신은 "${data.opponentName}"와(과) 치열한 대결을 펼쳤습니다.
      
      이 경험을 일기처럼, 감성적이고 문학적인 문체로 2-3문장 작성해주세요.
      전투의 긴장감과 감정을 담아주세요.
      
      예시: "그와의 대결은 마치 폭풍우 속의 춤과 같았다. 승패를 떠나, 나는 오늘 진정한 강함이 무엇인지 깨달았다."
      
      한국어로만, 2-3문장으로 작성하세요.
    `;
  }

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Diary Gen Error:", error);
    return type === "character"
      ? "오늘의 기억은 희미하게 남았다..."
      : "그날의 전투는 잊을 수 없는 기억으로 남았다...";
  }
}
