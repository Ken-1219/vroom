"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { subscribe } from "@/lib/mutation-store";

export function MutationListener({ keys }: { keys: string[] }) {
  const router = useRouter();

  useEffect(() => {
    const unsubs = keys.map((key) =>
      subscribe(key, () => router.refresh())
    );
    return () => unsubs.forEach((fn) => fn());
  }, [keys, router]);

  return null;
}
