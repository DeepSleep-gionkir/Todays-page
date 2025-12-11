"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, Swords } from "lucide-react";
import { toPng } from "html-to-image";
import {
  doc,
  getDoc,
  getFirestore,
  collection,
  getDocs,
  query,
  limit,
} from "firebase/firestore";
import { app } from "@/lib/firebase";
import Button from "@/app/components/ui/Button";

import DownloadOptionsModal from "@/app/components/game/DownloadOptionsModal";

interface CharacterData {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  abilities: string[];
  narrative: string;
  authorName: string;
  uid?: string;
  date: string;
}

export default function CharacterDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [character, setCharacter] = useState<CharacterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [expired, setExpired] = useState(false);

  const [battleCount, setBattleCount] = useState(0);

  useEffect(() => {
    const fetchCharacter = async () => {
      if (!id) return;
      try {
        const db = getFirestore(app);
        const [dateStr] = (id as string).split("_");

        if (!dateStr) {
          setLoading(false);
          return;
        }

        // 1. Fetch Character Data
        const docRef = doc(db, "records", dateStr, "characters", id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as CharacterData;

          // 2. Nickname Sync (Dynamic Fetch)
          // If uid exists, try to fetch current nickname from users collection
          if (data.uid) {
            try {
              const userDocRef = doc(db, "users", data.uid);
              const userDocSnap = await getDoc(userDocRef);
              if (userDocSnap.exists() && userDocSnap.data().nickname) {
                // Override static authorName with dynamic one
                data.authorName = userDocSnap.data().nickname;
              }
            } catch (err) {
              console.warn("Failed to sync nickname", err);
            }
          }

          // 3. Battle Limit Check
          // Count logs in records/{date}/characters/{id}/logs
          const logsRef = collection(
            db,
            "records",
            dateStr,
            "characters",
            id as string,
            "logs"
          );
          // Optimize: Check if at least one exists
          const q = query(logsRef, limit(1));
          const logsSnap = await getDocs(q);
          setBattleCount(logsSnap.size);

          // Check if today
          const todayStr = new Date().toISOString().split("T")[0];
          if (data.date !== todayStr) {
            setExpired(true);
          }

          setCharacter(data);
        } else {
          alert("존재하지 않는 캐릭터입니다.");
          router.push("/");
        }
      } catch (error) {
        console.error("Error fetching character:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCharacter();
  }, [id, router]);

  // Image download handler
  const handleDownloadImage = async () => {
    const element = document.getElementById("character-card");
    if (!element) return;

    try {
      // html-to-image handles modern CSS better
      const dataUrl = await toPng(element, {
        cacheBust: true,
        backgroundColor: "#ffffff", // Ensure opaque background
        canvasWidth: element.offsetWidth * 2, // Scale up for quality
        canvasHeight: element.offsetHeight * 2,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${character?.name || "character"}.png`;
      link.click();
    } catch (err) {
      console.error("Image download failed:", err);
      // Fallback or user notification could go here
    }
  };

  // JSON download handler
  const handleDownloadJSON = () => {
    if (!character) return;
    const jsonString = JSON.stringify(character, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${character.name || "character"}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleBattleClick = () => {
    // Check if enough characters exist (TODO: Implement logic)
    // For now, redirect to battle logic
    router.push(`/battle/${id}`);
  };

  if (loading)
    return (
      <div className="text-center py-20 animate-pulse font-serif text-sub">
        데이터를 불러오는 중...
      </div>
    );

  if (expired)
    return (
      <div className="text-center py-20 space-y-4">
        <div className="text-2xl font-serif text-main">📜</div>
        <h2 className="text-xl font-serif text-main">
          이 페이지는 더 이상 열람할 수 없습니다
        </h2>
        <p className="text-sm text-sub">
          오늘의 한 페이지는 하루가 지나면 닫힙니다.
        </p>
        <button
          onClick={() => router.push("/")}
          className="text-primary underline text-sm"
        >
          홈으로 돌아가기
        </button>
      </div>
    );

  if (!character) return null;

  if (!character) return null;

  return (
    <div className="py-8 pb-32 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Target for Download */}
      <div id="character-card" className="bg-canvas space-y-8 p-4 md:p-0">
        {/* Header Section: Image & Basic Info */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Profile Image (4:5 or Square) */}
          <div className="w-full md:w-1/2 aspect-[4/5] bg-surface rounded-xl overflow-hidden shadow-card relative group">
            {character.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={character.imageUrl}
                alt={character.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-sub text-sm bg-surface">
                No Image
              </div>
            )}
            {/* Download Button Overlay */}
            <button
              onClick={() => setShowDownloadModal(true)}
              className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors text-foreground shadow-sm"
            >
              <Download size={20} />
            </button>
          </div>

          {/* Info Section */}
          <div className="w-full md:w-1/2 space-y-6 pt-2">
            <div className="space-y-2">
              <div className="text-xs text-accent font-bold tracking-widest uppercase font-sans">
                {character.date} / Created by {character.authorName}
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-title leading-tight">
                {character.name}
              </h1>
            </div>

            {/* Description (Intro) */}
            <p className="text-sub font-sans leading-relaxed text-lg border-l-2 border-accent/30 pl-4 py-1">
              {character.description}
            </p>

            {/* Stats/Abilities (Grid) */}
            <div className="grid grid-cols-1 gap-3">
              {character.abilities.map((ability, idx) => {
                const [name, desc] = ability.split(":");
                return (
                  <div
                    key={idx}
                    className="bg-surface p-4 rounded-lg border border-white/50 shadow-sm"
                  >
                    <h3 className="text-lg font-serif font-bold text-title mb-1">
                      {name?.trim() || ability}
                    </h3>
                    <p className="text-sm text-sub font-sans">{desc?.trim()}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Narrative Section (Flowing Text) */}
        <div className="prose prose-lg prose-stone max-w-none pt-8 border-t border-border">
          <h3 className="font-serif text-xl font-bold text-title mb-4">
            Story
          </h3>
          <p className="font-serif leading-loose text-foreground whitespace-pre-line text-lg">
            {character.narrative}
          </p>
        </div>
      </div>

      {/* Floating Battle Button (Fixed Bottom on Mobile, or Right on PC) */}
      {/* Spec says: Bottom fixed (Mobile) or Right floating (PC). 
          For now let's stick to bottom fixed for consistency or sticky bottom. 
          Actually user said "Battle Button: Bottom fixed(Mobile) or Right floating(PC)." 
          Let's try to implement that. 
      */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-full max-w-xs md:max-w-md px-4">
        <Button
          onClick={handleBattleClick}
          size="lg"
          variant="primary"
          className="w-full shadow-xl animate-pulse-slow hover:animate-none flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-none"
          disabled={battleCount > 0}
        >
          <Swords size={20} className="mr-2" />
          <span className="font-serif font-bold">
            {battleCount > 0 ? "오늘의 배틀 완료" : "오늘의 배틀 입장"}
          </span>
        </Button>
      </div>
      <DownloadOptionsModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownloadImage={handleDownloadImage}
        onDownloadJSON={handleDownloadJSON}
      />
    </div>
  );
}
