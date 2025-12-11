"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Book } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav
      className="fixed z-50 transition-all duration-300
      bottom-0 left-0 w-full border-t border-border bg-[#FDFBF9] pb-[env(safe-area-inset-bottom)]
      /* Solid background, no glassmorphism as requested */
    "
    >
      <div className="flex justify-around md:justify-center md:gap-20 items-center h-16 px-6 md:px-8">
        <Link
          href="/"
          className={`group flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
            isActive("/")
              ? "text-[#D97757]"
              : "text-gray-400 hover:text-foreground"
          }`}
        >
          <Home
            size={24}
            strokeWidth={isActive("/") ? 2.5 : 2}
            className="group-hover:scale-110 transition-transform"
          />
          <span className="text-[10px] md:text-sm font-sans font-medium">
            Home
          </span>
        </Link>

        <div className="w-px h-8 bg-border hidden md:block" />

        <Link
          href="/book"
          className={`group flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
            isActive("/book")
              ? "text-accent"
              : "text-gray-400 hover:text-foreground"
          }`}
        >
          <Book
            size={24}
            strokeWidth={isActive("/book") ? 2.5 : 2}
            className="group-hover:scale-110 transition-transform"
          />
          <span className="text-[10px] md:text-sm font-sans font-medium">
            My Book
          </span>
        </Link>
      </div>
    </nav>
  );
}
