import { Nav } from "@/components/nav";
import { LifecycleClient } from "./lifecycle-client";

export default function LifecyclePage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Nav />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">🎬 Full Trip Lifecycle Simulator</h1>
          <p className="text-[#6B6B6B] mt-1 text-sm">
            Watch a complete rental journey — from browsing to review — step by step.
          </p>
        </div>
        <LifecycleClient />
      </main>
    </div>
  );
}
