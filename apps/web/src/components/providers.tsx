"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "./ui/toast-context";
import { Toaster } from "./ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        {children}
        <Toaster />
      </ToastProvider>
    </SessionProvider>
  );
}
