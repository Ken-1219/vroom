"use client";

import { useToast } from "./toast-context";

const typeStyles: Record<string, string> = {
  success: "border-l-[#16A34A] text-[#E64500]",
  error: "border-l-red-500 text-red-800",
  info: "border-l-blue-500 text-blue-800",
};

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`bg-white border border-[#E8E6E1] border-l-4 shadow-lg rounded-xl px-4 py-3 min-w-[280px] max-w-[400px] flex items-start gap-3 animate-in slide-in-from-right ${typeStyles[t.type]}`}
          role="alert"
        >
          <p className="text-sm flex-1">{t.message}</p>
          <button
            onClick={() => dismiss(t.id)}
            className="text-[#999] hover:text-[#6B6B6B] text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
