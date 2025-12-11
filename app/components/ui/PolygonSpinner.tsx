"use client";

import { cn } from "@/lib/utils";

export default function PolygonSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-16 h-16", className)}>
      <div className="absolute inset-0 border-4 border-transparent border-t-[#D97757] border-r-active rounded-full animate-spin [animation-duration:3s]" />
      <div className="absolute inset-2 border-4 border-transparent border-b-foreground border-l-foreground rounded-full animate-spin [animation-duration:2s] reverse" />

      {/* Geometric Star/Polygon Center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-4 h-4 bg-[#D97757] rotate-45 animate-pulse" />
      </div>
    </div>
  );
}
