"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";
import Button from "@/app/components/ui/Button";

interface BattleLogData {
  playerA: { name: string };
  playerB: { name: string };
  date: string;
  log: string;
}

export default function BattleLogPage() {
  const { characterId, logId } = useParams() as {
    characterId: string;
    logId: string;
  };
  const [logData, setLogData] = useState<BattleLogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const fetchLog = async () => {
      if (!logId || !characterId) return;
      try {
        const db = getFirestore(app);

        // Parse characterId to get date
        const [dateStr] = characterId.split("_");
        if (!dateStr) {
          setLoading(false);
          return;
        }

        // Fetch from nested structure: records/{date}/characters/{characterId}/logs/{logId}
        const docRef = doc(
          db,
          "records",
          dateStr,
          "characters",
          characterId,
          "logs",
          logId
        );
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as BattleLogData;

          // Check if this is today's log
          const todayStr = new Date().toISOString().split("T")[0];
          if (data.date !== todayStr) {
            setExpired(true);
            setLoading(false);
            return;
          }

          setLogData(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLog();
  }, [logId, characterId]);

  const handleDownload = async () => {
    const element = document.getElementById("battle-log-card");
    if (!element) return;
    try {
      const canvas = await html2canvas(element);
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `battle_log_${logId}.png`;
      link.click();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading)
    return (
      <div className="text-center py-20 animate-pulse font-serif text-sub">
        기록을 불러오는 중...
      </div>
    );

  if (expired)
    return (
      <div className="text-center py-20 space-y-4">
        <div className="text-2xl font-serif text-[#1A1A1A]">📜</div>
        <h2 className="text-xl font-serif text-[#1A1A1A]">
          이 배틀 기록은 더 이상 열람할 수 없습니다
        </h2>
        <p className="text-sm text-sub">
          오늘의 한 페이지는 하루가 지나면 닫힙니다.
        </p>
        <Link href="/" className="text-[#D97757] underline text-sm">
          홈으로 돌아가기
        </Link>
      </div>
    );

  if (!logData)
    return <div className="text-center py-20">기록이 없습니다.</div>;

  return (
    <div className="py-8 pb-32 space-y-8">
      <div
        id="battle-log-card"
        className="bg-canvas border-none shadow-none md:border md:border-border md:shadow-soft bg-[url('/paper-texture.png')] max-w-2xl mx-auto p-8 md:p-12 relative"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-[#D97757] opacity-80" />

        {/* Header: [Me] vs [Opponent] */}
        <div className="text-center mb-16 space-y-4">
          <div className="flex items-center justify-center gap-4 font-serif text-xl md:text-2xl font-bold text-[#1A1A1A]">
            <span className="text-[#D97757] border-b-2 border-[#D97757] pb-1">
              {logData.playerA.name}
            </span>
            <span className="text-sub text-base italic">vs</span>
            <span className="text-foreground border-b-2 border-transparent pb-1">
              {logData.playerB.name}
            </span>
          </div>
          <div className="text-xs text-sub tracking-widest uppercase font-sans">
            {logData.date} • Battle Record
          </div>
        </div>

        {/* Log Content: Novel Style */}
        <div className="font-serif text-lg leading-[1.8] text-main text-justify space-y-6">
          {logData.log.split("\n").map((line: string, i: number) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={i} className="h-4" />; // Spacer

            // Dialogue Box (Center aligned, Quote style)
            if (trimmed.startsWith(">") || trimmed.startsWith("&gt;")) {
              const content = trimmed.replace(/^> ?|&gt; ?/, "");
              return (
                <div key={i} className="relative py-4 px-8 my-8 text-center">
                  <div className="absolute left-1/2 -translate-x-1/2 top-0 text-3xl text-[#D97757]/30 font-serif">
                    &ldquo;
                  </div>
                  <p className="font-serif font-bold text-[#1A1A1A] relative z-10 text-xl italic">
                    {content}
                  </p>
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-0 text-3xl text-[#D97757]/30 font-serif">
                    &rdquo;
                  </div>
                </div>
              );
            }

            // Ability Highlight / Special Text
            // Logic: **Text** -> Bold + Orange + Highlight
            const parts = line.split(/(\*\*.*?\*\*)/g);
            return (
              <p key={i}>
                {parts.map((part, j) => {
                  if (part.startsWith("**") && part.endsWith("**")) {
                    return (
                      <span
                        key={j}
                        className="font-bold text-[#D97757] bg-[#D97757]/10 px-1 mx-0.5 rounded-sm box-decoration-clone"
                      >
                        {part.slice(2, -2)}
                      </span>
                    );
                  }
                  return part;
                })}
              </p>
            );
          })}
        </div>

        {/* Footer Mark */}
        <div className="mt-16 text-center text-[#D97757]/40">***</div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 max-w-lg mx-auto">
        <Button
          onClick={handleDownload}
          variant="secondary"
          fullWidth
          size="lg"
        >
          <Download size={18} className="mr-2" />
          페이지 저장 (이미지)
        </Button>
      </div>
    </div>
  );
}
