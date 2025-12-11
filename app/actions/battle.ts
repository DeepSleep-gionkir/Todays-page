"use server";

import { generateBattleLog, CharacterProfile } from "./generate";

export async function createBattleLog(
  charA: CharacterProfile,
  charB: CharacterProfile
) {
  const logContent = await generateBattleLog(charA, charB);
  return { log: logContent };
}
