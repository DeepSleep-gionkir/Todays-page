import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full py-8 px-4 flex justify-center items-center bg-transparent">
      <Link href="/">
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-center tracking-tight">
          <span className="text-[#1A1A1A]">Today&apos;s </span>
          <span className="text-[#D97757]">Page</span>
        </h1>
      </Link>
    </header>
  );
}
