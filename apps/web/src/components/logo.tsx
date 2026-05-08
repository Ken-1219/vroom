import Link from "next/link";

export function Logo({ variant = "light" }: { variant?: "light" | "dark" }) {
  const textColor = variant === "light" ? "text-white" : "text-[#0D0D0D]";

  return (
    <Link href="/" className={`flex items-center gap-2 group ${textColor}`}>
      <div className="relative w-8 h-8 flex items-center justify-center">
        <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
          <rect width="32" height="32" rx="8" fill="#FF4D00" />
          <path
            d="M7 21L11.5 9H14L9.5 19.5H22.5L18 9H20.5L25 21"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span className="text-lg font-bold tracking-tight font-display">
        vroom
      </span>
    </Link>
  );
}
