"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import LoadingOverlay from "@/app/components/game/LoadingOverlay";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  getFirestore,
} from "firebase/firestore";
import { app } from "@/lib/firebase";
import { createBattleLog } from "@/app/actions/battle";
import { generateDiaryEntry } from "@/app/actions/generate";

export default function BattleMatchPage() {
  const { characterId } = useParams() as { characterId: string };
  const { user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const processedRef = useRef(false);

  useEffect(() => {
    if (!user || !characterId || processedRef.current) return;
    processedRef.current = true; // Prevent double execution

    const runBattle = async () => {
      try {
        const db = getFirestore(app);

        // Parse characterId to get date and uid
        // Format: {date}_{uid} e.g., "2025-12-11_wS4BFaizuMaOei5meAy2uHL80Is2"
        const [dateStr] = characterId.split("_");
        if (!dateStr) {
          setError("잘못된 캐릭터 ID입니다.");
          return;
        }

        // 1. Fetch My Character from NEW STRUCTURE: users/{uid}/characters/{charId}
        const myCharRef = doc(db, "users", user.uid, "characters", characterId);
        const myCharSnap = await getDoc(myCharRef);

        if (!myCharSnap.exists()) {
          setError("캐릭터를 찾을 수 없습니다.");
          return;
        }
        const myChar = myCharSnap.data();

        // 2. Fetch Opponents from records/{date}/characters (excluding self)
        const opponentsQuery = await getDocs(
          collection(db, "records", dateStr, "characters")
        );
        const opponents = opponentsQuery.docs
          .map((d) => d.data())
          .filter((d) => d.uid !== user.uid);

        // Minimum 5 characters (including self) required = 4 opponents needed
        if (opponents.length < 4) {
          setError(
            `배틀을 위해 최소 5명의 캐릭터가 필요합니다. (현재: ${
              opponents.length + 1
            }명)`
          );
          return;
        }

        const opponent =
          opponents[Math.floor(Math.random() * opponents.length)];

        // 3. Generate Log
        const { log } = await createBattleLog(
          myChar as {
            name: string;
            description: string;
            abilities: string[];
            narrative: string;
          },
          opponent as {
            name: string;
            description: string;
            abilities: string[];
            narrative: string;
          }
        );

        // 3.1 Generate Diary Entry
        let diaryEntry = "";
        try {
          diaryEntry = await generateDiaryEntry("battle", {
            name: myChar.name,
            opponentName: opponent.name,
            battleLog: log, // Pass the actual log
          });
        } catch (e) {
          console.error("Diary Gen Error", e);
        }

        // 4. Prepare Battle Data
        const battleData = {
          date: dateStr,
          playerA: {
            uid: myChar.uid,
            name: myChar.name,
            imageUrl: myChar.imageUrl || "",
            abilities: myChar.abilities || [],
          },
          playerB: {
            uid: opponent.uid,
            name: opponent.name,
            imageUrl: opponent.imageUrl || "",
            abilities: opponent.abilities || [],
          },
          log: log,
          narrative: diaryEntry,
          summary: diaryEntry, // Store as summary for My Book
          createdAt: new Date().toISOString(),
        };

        // Generate a unique logId
        const logId = `${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        // 5. Save Log to NESTED STRUCTURE
        // Save to user's character logs: users/{uid}/characters/{charId}/logs/{logId}
        await setDoc(
          doc(db, "users", user.uid, "characters", characterId, "logs", logId),
          battleData
        );

        // Also save to records for admin: records/{date}/characters/{charId}/logs/{logId}
        await setDoc(
          doc(db, "records", dateStr, "characters", characterId, "logs", logId),
          battleData
        );

        // 6. Redirect - use composite path for log access
        router.push(`/battle/log/${characterId}/${logId}`);
      } catch (err: unknown) {
        console.error("Battle Error", err);

        const errorMessage = err instanceof Error ? err.message : String(err);

        if (errorMessage.includes("429_TOO_MANY_REQUESTS")) {
          setError(
            "이용자가 많아 AI가 과부하 상태입니다. 잠시 후 다시 시도해주세요. (429)"
          );
        } else {
          setError("배틀 생성 중 오류가 발생했습니다.");
        }
      }
    };

    runBattle();
  }, [user, characterId, router]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 px-4">
        {/* Error Banner */}
        <div className="w-full max-w-md p-6 bg-[#944C4C]/10 border-2 border-[#944C4C] rounded-xl">
          <div className="flex items-start gap-4">
            <AlertTriangle
              className="text-[#944C4C] shrink-0 mt-0.5"
              size={28}
            />
            <div>
              <h3 className="text-[#944C4C] font-bold font-serif text-lg mb-2">
                배틀 생성 실패
              </h3>
              <p className="text-[#944C4C]/80 font-sans text-sm">{error}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-6 py-3 bg-[#D97757] text-white rounded-full font-bold hover:opacity-90 transition-opacity"
        >
          <ArrowLeft size={18} />
          돌아가기
        </button>
      </div>
    );
  }

  return <LoadingOverlay type="battle" />;
}
