"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import {
  collection,
  query,
  getDocs,
  getFirestore,
  orderBy,
} from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Skeleton } from "@/app/components/ui/Skeleton";

interface HistoryItem {
  id: string;
  type: "character" | "battle";
  date: string;
  createdAt: string;
  name?: string;
  description?: string;
  playerB?: { name: string };
  characterId?: string; // For battle logs to reference parent character
}

export default function MyBookPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      try {
        const db = getFirestore(app);

        // Fetch Characters from NEW STRUCTURE: users/{uid}/characters
        const charQ = query(
          collection(db, "users", user.uid, "characters"),
          orderBy("createdAt", "desc")
        );
        const charSnaps = await getDocs(charQ);
        const chars = charSnaps.docs.map(
          (d) => ({ type: "character", id: d.id, ...d.data() } as HistoryItem)
        );

        // Fetch Battle Logs from each character's logs subcollection
        const battles: HistoryItem[] = [];
        for (const charDoc of charSnaps.docs) {
          const logsSnap = await getDocs(
            collection(db, "users", user.uid, "characters", charDoc.id, "logs")
          );
          logsSnap.docs.forEach((logDoc) => {
            const logData = logDoc.data();
            battles.push({
              type: "battle",
              id: logDoc.id,
              date: logData.date,
              createdAt: logData.createdAt,
              playerB: logData.playerB,
              characterId: charDoc.id, // Store reference to character
            } as HistoryItem);
          });
        }

        // Merge and sort
        const mixed = [...chars, ...battles].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setHistory(mixed);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  if (!user)
    return (
      <div className="text-center py-20 font-serif text-sub">
        로그인이 필요합니다.
      </div>
    );
  if (loading)
    return (
      <div className="py-8 pb-32 max-w-2xl mx-auto space-y-12">
        {/* Cover Skeleton */}
        <Skeleton className="h-64 w-full rounded-r-2xl rounded-l-sm bg-[#2C2C2C]/10" />

        {/* Entries Skeletons */}
        <div className="space-y-12 pl-6 md:pl-0">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20 bg-input/30" />
              <Skeleton className="h-40 w-full bg-surface border border-border/50" />
            </div>
          ))}
        </div>
      </div>
    );

  return (
    <div className="py-8 pb-32 max-w-2xl mx-auto">
      {/* Book Cover / Stats Section */}
      <div className="bg-[#2C2C2C] text-[#F0E6D2] p-8 rounded-r-2xl rounded-l-sm shadow-xl mb-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-[#1A1A1A] opacity-50" />
        <div className="absolute top-4 left-4 right-4 h-full border border-[#F0E6D2]/20 rounded-r-lg rounded-l-none pointer-events-none" />

        <div className="relative z-10 text-center space-y-6 py-6">
          <div className="font-serif text-sm tracking-[0.2em] opacity-80 uppercase">
            The Record of
          </div>
          <h1 className="font-serif text-4xl font-bold tracking-tight text-[#F0E6D2]">
            {user.displayName}
          </h1>

          <div className="flex justify-center gap-12 pt-8">
            <div className="text-center">
              <div className="text-3xl font-serif font-bold">
                {history.filter((h) => h.type === "character").length}
              </div>
              <div className="text-[10px] tracking-widest uppercase opacity-60 mt-1">
                Personas
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-serif font-bold">
                {history.filter((h) => h.type === "battle").length}
              </div>
              <div className="text-[10px] tracking-widest uppercase opacity-60 mt-1">
                Battles
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Journal Entries (History) */}
      <div className="relative pl-6 md:pl-0">
        <div className="absolute left-6 md:left-0 top-0 bottom-0 w-px bg-border md:hidden" />{" "}
        {/* Mobile timeline line */}
        <div className="space-y-12">
          {history.map((item, index) => (
            <div
              key={item.id}
              className="relative animate-in fade-in slide-in-from-bottom-4 duration-700"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Date Marker */}
              <div className="mb-2 pl-4 text-xs font-serif text-sub tracking-widest opacity-60 uppercase">
                {item.date}
              </div>

              {/* Paper Entry */}
              <div className="bg-canvas shadow-sm border border-border/50 p-6 md:p-8 rounded-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                {/* Paper Lines background */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-30"
                  style={{
                    backgroundImage:
                      "linear-gradient(transparent 1.5rem, #E6E4DD 1.5rem)",
                    backgroundSize: "100% 1.55rem",
                    marginTop: "2rem",
                  }}
                />

                <div className="relative z-10 font-hand text-2xl text-foreground leading-[1.55rem]">
                  {item.type === "character" ? (
                    <>
                      <div className="font-bold text-3xl mb-1 text-[#D97757] relative inline-block">
                        {item.name}
                        {/* Ink smudge effect */}
                        <div className="absolute -bottom-2 -right-4 w-8 h-8 bg-[#D97757]/10 rounded-full blur-xl -z-10" />
                      </div>
                      <div className="mt-1">
                        오늘은{" "}
                        <span className="text-[#1A1A1A]">
                          &quot;{item.name}&quot;
                        </span>
                        이(가) 되어 하루를 보냈다.{" "}
                        {item.description && item.description.length > 60
                          ? item.description.slice(0, 60) + "..."
                          : item.description}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-bold text-3xl mb-1 text-foreground relative inline-block">
                        Battle Log
                      </div>
                      <div className="mt-1">
                        <span className="text-[#D97757]">
                          {item.playerB?.name}
                        </span>
                        와(과) 마주쳤다. 그 날의 치열했던 기록이 여기 남아있다.
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {history.length === 0 && (
            <div className="text-center py-20 text-sub font-hand text-2xl opacity-50">
              아직 기록된 페이지가 없습니다...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
