"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import {
  collection,
  query,
  getDocs,
  getFirestore,
  orderBy,
  doc,
  getDoc,
  setDoc,
  where,
} from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { ChevronLeft, ChevronRight, Pencil, Check, X } from "lucide-react";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import { useToast } from "@/app/context/ToastContext";

interface HistoryItem {
  id: string;
  type: "character" | "battle";
  date: string;
  createdAt: string;
  name?: string;
  description?: string;
  narrative?: string;
  summary?: string; // Short diary-style entry
  playerB?: { name: string };
  characterId?: string;
  characterName?: string; // Add character name
}

export default function MyBookPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Nickname Edit State
  const [nickname, setNickname] = useState("");
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [tempNickname, setTempNickname] = useState("");

  const handlePrevPage = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleNextPage = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const currentItem = history[currentIndex];

  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      try {
        const db = getFirestore(app);

        // Fetch Nickname
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists() && userDocSnap.data().nickname) {
          setNickname(userDocSnap.data().nickname);
        } else {
          setNickname(user.displayName || "Anonymous");
        }

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
              characterId: charDoc.id,
              characterName: charDoc.data().name, // Pass character name
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

  const handleSaveNickname = async () => {
    if (!user || !tempNickname.trim()) return;

    // 1. Length Check
    if (tempNickname.length > 10) {
      showToast("닉네임은 10자 이내여야 합니다.", "error");
      return;
    }

    try {
      const db = getFirestore(app);

      // 2. Duplicate Check (Exclude current user)
      // Query "users" where "nickname" == tempNickname
      const q = query(
        collection(db, "users"),
        where("nickname", "==", tempNickname)
      );
      const querySnapshot = await getDocs(q);

      // If found, check if it's not me
      let isDuplicate = false;
      querySnapshot.forEach((doc) => {
        if (doc.id !== user.uid) {
          isDuplicate = true;
        }
      });

      if (isDuplicate) {
        showToast("이미 사용 중인 닉네임입니다.", "error");
        return;
      }

      await setDoc(
        doc(db, "users", user.uid),
        { nickname: tempNickname },
        { merge: true }
      );
      setNickname(tempNickname);
      setIsEditingNickname(false);
      showToast("닉네임이 저장되었습니다.", "success");
    } catch (e) {
      console.error("Failed to save nickname", e);
      showToast("닉네임 저장 실패", "error");
    }
  };

  const startEditing = () => {
    setTempNickname(nickname);
    setIsEditingNickname(true);
  };

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

          <div className="flex items-center justify-center gap-2">
            {isEditingNickname ? (
              <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                <Input
                  value={tempNickname}
                  onChange={(e) => setTempNickname(e.target.value)}
                  className="bg-transparent border-b border-[#F0E6D2] text-[#F0E6D2] font-serif text-3xl font-bold text-center w-auto min-w-[200px] h-12 px-2 py-1 rounded-none focus:ring-0 focus:border-[#D97757] placeholder:text-[#F0E6D2]/30"
                  autoFocus
                />
                <button
                  onClick={handleSaveNickname}
                  className="p-2 hover:bg-[#F0E6D2]/10 rounded-full text-[#F0E6D2] transition-colors"
                >
                  <Check size={20} />
                </button>
                <button
                  onClick={() => setIsEditingNickname(false)}
                  className="p-2 hover:bg-[#F0E6D2]/10 rounded-full text-[#F0E6D2]/60 hover:text-[#FF6B6B] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <div className="group flex items-center justify-center gap-3 relative">
                <h1 className="font-serif text-4xl font-bold tracking-tight text-[#F0E6D2]">
                  {nickname}
                </h1>
                <button
                  onClick={startEditing}
                  className="absolute -right-8 opacity-0 group-hover:opacity-100 p-1.5 text-[#F0E6D2]/60 hover:text-[#F0E6D2] hover:bg-[#F0E6D2]/10 rounded-full transition-all"
                  title="닉네임 수정"
                >
                  <Pencil size={16} />
                </button>
              </div>
            )}
          </div>

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
      {/* Journal Entries (History) */}
      <div className="relative pl-0 md:pl-0">
        {/* Navigation Controls */}
        <div className="flex items-center justify-between mb-8 px-4">
          <Button
            variant="secondary"
            // size="sm" // Removed size prop to fix lint interaction if any, or stick to defaults
            onClick={handlePrevPage}
            disabled={currentIndex >= history.length - 1}
            className="rounded-full w-12 h-12 p-0 flex items-center justify-center disabled:opacity-30"
          >
            <ChevronLeft size={24} />
          </Button>

          <div className="text-sm font-serif text-sub tracking-widest uppercase">
            {currentItem ? (
              <>
                Page {history.length - currentIndex} / {history.length}
                <br />
                <span className="opacity-60 text-xs">{currentItem.date}</span>
              </>
            ) : (
              "Empty"
            )}
          </div>

          <Button
            variant="secondary"
            // size="sm"
            onClick={handleNextPage}
            disabled={currentIndex <= 0}
            className="rounded-full w-12 h-12 p-0 flex items-center justify-center disabled:opacity-30"
          >
            <ChevronRight size={24} />
          </Button>
        </div>

        <div className="space-y-12">
          {currentItem && (
            <div
              key={currentItem.id} // Re-render on ID change
              className="relative animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              {/* Paper Entry */}
              <div className="bg-canvas shadow-sm border border-border/50 p-6 md:p-8 rounded-sm relative overflow-hidden group hover:shadow-md transition-shadow min-h-[400px]">
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
                  {currentItem.type === "character" ? (
                    <>
                      <div className="font-bold text-3xl mb-4 text-[#D97757] relative inline-block font-serif tracking-tight">
                        {currentItem.name}
                        {/* Ink smudge effect */}
                        <div className="absolute -bottom-2 -right-4 w-8 h-8 bg-[#D97757]/10 rounded-full blur-xl -z-10" />
                      </div>
                      <div className="mt-2 text-[#1A1A1A]">
                        {/* content: Summary -> Narrative -> Fallback */}
                        <p className="font-serif italic leading-[2.5] tracking-wide text-lg whitespace-pre-line opacity-90">
                          {currentItem.summary || currentItem.narrative || (
                            <>
                              오늘은{" "}
                              <span className="not-italic font-bold">
                                &quot;{currentItem.name}&quot;
                              </span>
                              이(가) 되어 하루를 보냈다.{" "}
                              {currentItem.description}
                            </>
                          )}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-bold text-3xl mb-1 text-foreground relative inline-block">
                        Battle Log
                        <span className="block text-sm font-serif text-[#D97757] mt-1 tracking-normal font-normal">
                          for {currentItem.characterName}
                        </span>
                      </div>
                      <div className="mt-2 text-[#1A1A1A]">
                        <p className="font-serif italic leading-[2.5] tracking-wide text-lg whitespace-pre-line opacity-90">
                          {currentItem.narrative || (
                            <>
                              <span className="not-italic font-bold text-[#D97757]">
                                &quot;{currentItem.playerB?.name}&quot;
                              </span>
                              와(과) 마주쳤다. 그 날의 치열했던 기록이 여기
                              남아있다.
                            </>
                          )}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

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
