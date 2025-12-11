import { useEffect, useState } from "react";
import PolygonSpinner from "@/app/components/ui/PolygonSpinner";

const CHARACTER_LOADING_TEXTS = [
  "잉크를 찍는 중...",
  "세계관을 구성하는 중...",
  "능력을 부여하는 중...",
  // "페이지를 채워나가는 중..." is now reserved for finalizing state
];

const BATTLE_LOADING_TEXTS = [
  "전장을 구성하고 있습니다...",
  "상대와 마주하는 중입니다...",
  "치열한 공방이 오고 갑니다...",
  "결과를 기록하고 있습니다...",
];

export default function LoadingOverlay({
  type,
  isFinalizing = false,
}: {
  type: "character" | "battle";
  isFinalizing?: boolean;
}) {
  const [textIndex, setTextIndex] = useState(0);
  const texts =
    type === "character" ? CHARACTER_LOADING_TEXTS : BATTLE_LOADING_TEXTS;

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev < texts.length - 1 ? prev + 1 : prev));
    }, 3000);

    return () => clearInterval(interval);
  }, [texts.length]);

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
      <PolygonSpinner className="mb-8" />

      <div className="h-8 overflow-hidden flex justify-center">
        <p
          key={isFinalizing ? "final" : textIndex}
          className="text-[#D97757] font-serif text-lg font-bold animate-in fade-in slide-in-from-bottom-2 duration-500"
        >
          {isFinalizing ? "페이지를 채워나가는 중..." : texts[textIndex]}
        </p>
      </div>
    </div>
  );
}
