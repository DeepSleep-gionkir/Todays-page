"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import { app } from "@/lib/firebase";
import Link from "next/link";
import { Swords, Eye, User, ScrollText } from "lucide-react";
import PolygonSpinner from "@/app/components/ui/PolygonSpinner";
import Button from "@/app/components/ui/Button";

interface TodayCharacter {
  id: string;
  uid: string;
  name: string;
  imageUrl?: string;
  authorName: string;
  date: string;
}

interface TodayBattleLog {
  id: string;
  date: string;
  playerA: { uid: string; name: string; imageUrl?: string };
  playerB: { name: string; imageUrl?: string };
  createdAt: string;
  characterId: string; // Need this to construct link
}

export default function TodayPage() {
  const [activeTab, setActiveTab] = useState<"characters" | "logs">(
    "characters"
  );
  const [loading, setLoading] = useState(true);
  const [characters, setCharacters] = useState<TodayCharacter[]>([]);
  const [battleLogs, setBattleLogs] = useState<TodayBattleLog[]>([]);
  const [todayDate, setTodayDate] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const db = getFirestore(app);
        const dateStr = new Date().toISOString().split("T")[0];
        setTodayDate(dateStr);

        // 1. Fetch Characters for Today
        const charRef = collection(db, "records", dateStr, "characters");
        const charSnap = await getDocs(charRef);

        const newCharacters: TodayCharacter[] = [];
        const newBattleLogs: TodayBattleLog[] = [];

        if (!charSnap.empty) {
          for (const charDoc of charSnap.docs) {
            const charData = charDoc.data();
            newCharacters.push({
              id: charDoc.id,
              uid: charData.uid,
              name: charData.name,
              imageUrl: charData.imageUrl,
              authorName: charData.authorName,
              date: charData.date,
            } as TodayCharacter);

            // 2. Fetch Logs for this character (today's logs)
            // Note: records structure stores logs under subcollection
            const logsRef = collection(
              db,
              "records",
              dateStr,
              "characters",
              charDoc.id,
              "logs"
            );
            const logsSnap = await getDocs(logsRef);

            logsSnap.docs.forEach((logDoc) => {
              const logData = logDoc.data();
              newBattleLogs.push({
                id: logDoc.id,
                date: logData.date,
                playerA: logData.playerA,
                playerB: logData.playerB,
                createdAt: logData.createdAt,
                characterId: charDoc.id,
              } as TodayBattleLog);
            });
          }
        }

        // Sort by newest
        newCharacters.sort((a, b) => b.id.localeCompare(a.id));
        // Or sort by creation time if available, id includes timestamp often but let's assume loose ordering

        newBattleLogs.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setCharacters(newCharacters);
        setBattleLogs(newBattleLogs);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <PolygonSpinner />
      </div>
    );
  }

  return (
    <div className="py-8 pb-32 max-w-2xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-8 space-y-2">
        <h1 className="text-3xl font-serif font-bold text-[#1A1A1A]">
          오늘의 페이지
        </h1>
        <p className="text-sub font-mono text-sm tracking-wider">{todayDate}</p>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-[#E6E4DD] rounded-full mb-8 relative">
        <button
          onClick={() => setActiveTab("characters")}
          className={`flex-1 py-2 text-sm font-bold rounded-full transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === "characters"
              ? "bg-white text-[#D97757] shadow-sm"
              : "text-sub hover:text-[#1A1A1A]"
          }`}
        >
          <User size={16} />
          캐릭터
          <span className="text-xs opacity-60 ml-1">({characters.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`flex-1 py-2 text-sm font-bold rounded-full transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === "logs"
              ? "bg-white text-[#D97757] shadow-sm"
              : "text-sub hover:text-[#1A1A1A]"
          }`}
        >
          <ScrollText size={16} />
          배틀 로그
          <span className="text-xs opacity-60 ml-1">({battleLogs.length})</span>
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Characters Tab */}
        {activeTab === "characters" && (
          <div className="grid grid-cols-1 gap-4">
            {characters.length === 0 ? (
              <div className="text-center py-12 text-sub/60">
                아직 기록된 캐릭터가 없습니다.
              </div>
            ) : (
              characters.map((char) => (
                <div
                  key={char.id}
                  className="bg-white p-4 rounded-xl shadow-sm border border-border flex items-center gap-4 group hover:border-[#D97757]/50 transition-colors"
                >
                  <div className="w-16 h-16 bg-surface rounded-lg overflow-hidden shrink-0 border border-border">
                    {char.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={char.imageUrl}
                        alt={char.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-sub">
                        No Img
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif font-bold text-lg text-[#1A1A1A] truncate">
                      {char.name}
                    </h3>
                    <p className="text-xs text-sub truncate">
                      by {char.authorName || "Unknown"}
                    </p>
                  </div>

                  <Link href={`/character/${char.id}`}>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-full px-4"
                    >
                      <Eye size={16} className="mr-1" /> View
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        )}

        {/* Battle Logs Tab */}
        {activeTab === "logs" && (
          <div className="grid grid-cols-1 gap-4">
            {battleLogs.length === 0 ? (
              <div className="text-center py-12 text-sub/60">
                아직 기록된 배틀이 없습니다.
              </div>
            ) : (
              battleLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white p-4 rounded-xl shadow-sm border border-border flex items-center justify-between gap-4 group hover:border-[#D97757]/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#D97757]/10 flex items-center justify-center shrink-0">
                      <Swords size={20} className="text-[#D97757]" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-[#1A1A1A] text-sm flex items-center gap-2 flex-wrap">
                        <span className="truncate max-w-[100px]">
                          {log.playerA.name}
                        </span>
                        <span className="text-sub text-xs">vs</span>
                        <span className="truncate max-w-[100px]">
                          {log.playerB.name}
                        </span>
                      </div>
                      <div className="text-xs text-sub mt-0.5">
                        {new Date(log.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>

                  <Link href={`/battle/log/${log.characterId}/${log.id}`}>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-full px-4 text-xs h-8 border border-input shadow-none bg-transparent hover:bg-black/5"
                    >
                      기록 보기
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
