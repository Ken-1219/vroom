import { Nav } from "@/components/nav";
import { BookingRaceClient } from "./race-client";

export default function BookingRacePage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Nav />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">🏁 Booking Race Simulator</h1>
          <p className="text-[#6B6B6B] mt-1 text-sm">
            6 virtual users race to book the same car. Only one can win — the fastest request through the database wins the booking.
          </p>
        </div>
        <BookingRaceClient />
      </main>
    </div>
  );
}
