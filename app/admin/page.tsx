"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  getFirestore,
} from "firebase/firestore";
import { app } from "@/lib/firebase";
import Link from "next/link";
import { Trash2, ChevronDown, ChevronRight, Swords } from "lucide-react";
import PolygonSpinner from "@/app/components/ui/PolygonSpinner";

interface AdminCharacter {
  id: string;
  uid: string;
  name: string;
  imageUrl?: string;
  authorName: string;
  date: string;
}

interface AdminBattleLog {
  id: string;
  date: string;
  playerA: { uid: string; name: string };
  playerB: { name: string };
  createdAt: string;
}

interface DateGroup {
  date: string;
  characters: AdminCharacter[];
  battleLogs: AdminBattleLog[];
  isOpen: boolean;
}

// Admin email whitelist
const ADMIN_EMAILS = ["silgoo2023@gmail.com"];

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [dateGroups, setDateGroups] = useState<DateGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user && ADMIN_EMAILS.includes(user.email || "");

  useEffect(() => {
    if (!user) return;

    const fetchAllData = async () => {
      try {
        const db = getFirestore(app);
        const dateMap = new Map<string, DateGroup>();

        // Get recent dates (last 30 days for example)
        const now = new Date();
        const dates: string[] = [];
        for (let i = 0; i < 30; i++) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          dates.push(d.toISOString().split("T")[0]);
        }

        // Fetch from records/{date}/characters for each date
        for (const dateStr of dates) {
          const charSnap = await getDocs(
            collection(db, "records", dateStr, "characters")
          );

          if (charSnap.empty) continue;

          if (!dateMap.has(dateStr)) {
            dateMap.set(dateStr, {
              date: dateStr,
              characters: [],
              battleLogs: [],
              isOpen: false,
            });
          }

          const group = dateMap.get(dateStr)!;

          for (const charDoc of charSnap.docs) {
            const charData = charDoc.data();
            group.characters.push({
              id: charDoc.id,
              uid: charData.uid,
              name: charData.name,
              imageUrl: charData.imageUrl,
              authorName: charData.authorName,
              date: charData.date,
            } as AdminCharacter);

            // Fetch logs for this character
            const logsSnap = await getDocs(
              collection(
                db,
                "records",
                dateStr,
                "characters",
                charDoc.id,
                "logs"
              )
            );
            logsSnap.docs.forEach((logDoc) => {
              const logData = logDoc.data();
              group.battleLogs.push({
                id: logDoc.id,
                date: logData.date,
                playerA: logData.playerA,
                playerB: logData.playerB,
                createdAt: logData.createdAt,
              } as AdminBattleLog);
            });
          }
        }

        // Sort by date descending
        const sortedGroups = Array.from(dateMap.values()).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // Open today's group by default
        const todayStr = new Date().toISOString().split("T")[0];
        sortedGroups.forEach((g) => {
          if (g.date === todayStr) g.isOpen = true;
        });

        setDateGroups(sortedGroups);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [user]);

  const toggleGroup = (date: string) => {
    setDateGroups((prev) =>
      prev.map((g) => (g.date === date ? { ...g, isOpen: !g.isOpen } : g))
    );
  };

  const handleDeleteCharacter = async (id: string) => {
    if (!confirm("정말로 이 캐릭터를 삭제하시겠습니까?")) return;
    try {
      const db = getFirestore(app);
      await deleteDoc(doc(db, "daily_characters", id));
      setDateGroups((prev) =>
        prev.map((g) => ({
          ...g,
          characters: g.characters.filter((c) => c.id !== id),
        }))
      );
    } catch (err) {
      console.error("Delete failed", err);
      alert("삭제 실패");
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!confirm("정말로 이 배틀 로그를 삭제하시겠습니까?")) return;
    try {
      const db = getFirestore(app);
      await deleteDoc(doc(db, "battle_logs", id));
      setDateGroups((prev) =>
        prev.map((g) => ({
          ...g,
          battleLogs: g.battleLogs.filter((l) => l.id !== id),
        }))
      );
    } catch (err) {
      console.error("Delete failed", err);
      alert("삭제 실패");
    }
  };

  // Find battle logs for a specific character (by playerA.uid matching char.uid)
  const getLogsForCharacter = (group: DateGroup, charUid: string) => {
    return group.battleLogs.filter((log) => log.playerA.uid === charUid);
  };

  if (authLoading || (isAdmin && loading)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
        <PolygonSpinner />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 p-8 animate-in fade-in zoom-in-95 duration-300">
        <div className="text-4xl">🔒</div>
        <h2 className="text-2xl font-serif font-bold text-title">
          Admin Access Required
        </h2>
        <p className="text-sub">이 페이지에 접근할 권한이 없습니다.</p>
        <Link href="/" className="text-[#D97757] hover:underline">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="py-12 pb-32 max-w-4xl mx-auto px-4 md:px-0">
      <div className="flex items-end justify-between mb-8 border-b-2 border-[#D97757] pb-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A] mb-2">
            Admin Dashboard
          </h1>
          <p className="text-sm font-sans text-sub">
            Managing{" "}
            {dateGroups.reduce((acc, g) => acc + g.characters.length, 0)}{" "}
            Characters &{" "}
            {dateGroups.reduce((acc, g) => acc + g.battleLogs.length, 0)} Battle
            Logs
          </p>
        </div>
        <div className="text-xs font-mono text-[#D97757]/80 bg-[#D97757]/10 px-3 py-1 rounded-full uppercase tracking-wider">
          Restricted Area
        </div>
      </div>

      <div className="space-y-6">
        {dateGroups.map((group) => (
          <div key={group.date} className="group">
            {/* Date Header (Folder) */}
            <button
              onClick={() => toggleGroup(group.date)}
              className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-300 ${
                group.isOpen
                  ? "bg-[#D97757] text-white border-[#D97757] shadow-lg scale-[1.01]"
                  : "bg-surface hover:bg-white text-[#1A1A1A] border-border shadow-sm hover:shadow-md"
              }`}
            >
              <div className="flex items-center gap-3">
                {group.isOpen ? (
                  <ChevronDown size={20} />
                ) : (
                  <ChevronRight
                    size={20}
                    className="text-sub group-hover:text-[#D97757]"
                  />
                )}
                <span className="font-bold font-mono text-lg tracking-wide">
                  {group.date}
                </span>
              </div>
              <div
                className={`text-xs font-bold px-2 py-1 rounded bg-black/20 text-white`}
              >
                {group.characters.length} Items
              </div>
            </button>

            {/* Folder Content */}
            {group.isOpen && (
              <div className="p-6 space-y-6 border-l-2 border-[#D97757]/20 ml-6 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                {group.characters.length === 0 ? (
                  <p className="text-sm text-sub italic pl-2">
                    No data recorded for this date.
                  </p>
                ) : (
                  group.characters.map((char) => {
                    const charLogs = getLogsForCharacter(group, char.uid);
                    return (
                      <div
                        key={char.id}
                        className="space-y-3 relative group/item"
                      >
                        {/* Connecting Line visually */}
                        <div className="absolute -left-7 top-6 w-5 h-px bg-[#D97757]/20" />

                        {/* Character Card (Mini List Item) */}
                        <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-soft border border-border/50 hover:border-[#D97757]/50 transition-colors">
                          <div className="w-16 h-16 bg-surface rounded-md overflow-hidden shrink-0 border border-border">
                            {char.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={char.imageUrl}
                                alt={char.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-sub">
                                N/A
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-serif font-bold text-lg text-[#1A1A1A] truncate">
                              {char.name}
                            </h3>
                            <p className="text-xs text-sub truncate mb-1">
                              Created by{" "}
                              <span className="font-bold text-[#D97757]">
                                {char.authorName}
                              </span>
                            </p>
                            <div className="text-[10px] text-sub/60 font-mono">
                              {char.id}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <Link
                              href={`/character/${char.id}`}
                              className="px-3 py-1 text-xs font-bold text-white bg-[#D97757] rounded hover:opacity-90 transition-colors text-center"
                            >
                              View
                            </Link>
                            <button
                              onClick={() => handleDeleteCharacter(char.id)}
                              className="px-3 py-1 text-xs font-bold text-alert border border-alert/20 rounded hover:bg-alert/5 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {/* Battle Logs for this Character (Indented Tree) */}
                        {charLogs.length > 0 && (
                          <div className="ml-10 space-y-2 border-l-2 border-border/50 pl-4 py-2">
                            <div className="text-[10px] uppercase tracking-widest text-sub mb-2 font-bold flex items-center gap-2">
                              <Swords size={12} />
                              Linked Battles
                            </div>
                            {charLogs.map((log) => (
                              <div
                                key={log.id}
                                className="flex items-center justify-between p-3 bg-canvas rounded border border-border hover:border-[#D97757]/30 transition-colors"
                              >
                                <div className="flex items-center gap-3 text-sm min-w-0 flex-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#D97757] shrink-0" />
                                  <div className="truncate">
                                    <span className="font-bold text-primary">
                                      {log.playerA.name}
                                    </span>
                                    <span className="px-1 text-sub text-xs">
                                      vs
                                    </span>
                                    <span className="font-bold text-foreground">
                                      {log.playerB.name}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-4">
                                  <Link
                                    href={`/battle/log/${log.id}`}
                                    className="text-xs text-sub hover:text-[#D97757] underline"
                                  >
                                    Log
                                  </Link>
                                  <button
                                    onClick={() => handleDeleteLog(log.id)}
                                    className="p-1 text-sub hover:text-alert transition-colors"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
