"use server";

import { model } from "@/lib/gemini";

export interface CharacterProfile {
  name: string;
  description: string;
  abilities: string[];
  narrative?: string;
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
    배경 이야기 A: ${charA.narrative || "정보 없음"}
    능력 A: ${charA.abilities.join(", ")}
    
    캐릭터 B: ${charB.name} - ${charB.description}
    배경 이야기 B: ${charB.narrative || "정보 없음"}
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
  data: {
    name: string;
    description?: string;
    opponentName?: string;
    battleLog?: string; // Add optional battleLog
  }
): Promise<string> {
  let prompt = "";

  if (type === "character") {
    prompt = `
      방금 사용자가 생성한 캐릭터 "${
        data.name
      }"에 대한 핵심 요약을 작성해주세요.
      캐릭터 설명: ${data.description || ""}
      
      요구사항:
      - 창작자(사용자)가 캐릭터를 분석하고 기록하는 톤.
      - 캐릭터의 외형, 성격, 능력의 특징을 상세하게 서술.
      - 단순한 나열보다는 캐릭터의 매력이 드러나도록 작성.
      - 5~6문장 이상의 상세한 분량.
      
      예시: "어둠을 조종하는 암살자, [이름]. 그는 단순히 적을 죽이는 것이 아니라 그림자 그 자체가 되어 움직인다. 냉혹하고 침착한 성격 뒤에 숨겨진 과거의 상처가 그의 칼날을 더욱 날카롭게 만든다. 특수 능력인 '그림자 밟기'는 그를 전장의 유령으로 만들며, 적들은 그가 어디서 나타날지조차 감지하지 못한다. 고독하지만 강력한 힘을 지닌, 완성도 높은 다크 히어로 캐릭터다."
      
      한국어로 작성하세요.
    `;
  } else {
    prompt = `
      다음은 "${data.name}"(이)가 "${
      data.opponentName
    }"와(과) 벌인 전투 기록입니다:
      
      ---
      ${data.battleLog || "기록 없음"}
      ---
      
      위 전투 내용을 바탕으로, "${
        data.name
      }"의 입장에서 쓴 짧은 일기를 작성해주세요.
      
      요구사항:
      - 전투의 흐름(상대의 공격 방식, 나의 대응, 결정타 등)을 객관적으로 묘사할 것.
      - 그 위에 캐릭터의 1인칭 감상과 승패에 대한 소회를 덧붙일 것.
      - "그와의 대결은..." 처럼 회상하는 어조.
      - 5~6문장의 생생한 문체.
      
      예시: "[상대 이름]의 검격은 매서웠고, 나는 방패를 들어 막기에 급급했다. 그가 빈틈을 보인 순간, 나의 [능력명]이 작렬하며 전세를 뒤집었다. 비록 승리했지만, 그의 마지막 일격은 나의 간담을 서늘하게 했다. 진정한 강자와의 싸움은 언제나 나를 성장시킨다."
      
      한국어로 작성하세요.
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
