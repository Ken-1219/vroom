import { Nav } from "@/components/nav";
import { TripPlannerClient } from "./trip-planner-client";

export const metadata = {
  title: "AI Trip Planner — Vroom",
  description: "Describe your road trip and get personalized vehicle recommendations, itinerary, and cost estimates.",
};

export default function TripPlannerPage() {

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Nav variant="light" />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-[#FFF1EB] text-[#FF4D00] text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
            </svg>
            AI-Powered
          </div>
          <h1 className="text-3xl font-display font-bold text-[#1A1A1A] mb-3">
            Plan your road trip
          </h1>
          <p className="text-[#6B6B6B] max-w-md mx-auto">
            Describe your trip and get vehicle recommendations, a day-by-day itinerary, and cost estimates.
          </p>
        </div>

        <TripPlannerClient />
      </main>
    </div>
  );
}
