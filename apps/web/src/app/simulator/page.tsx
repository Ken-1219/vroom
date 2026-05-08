import Link from "next/link";
import { Nav } from "@/components/nav";

export default function SimulatorPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Nav />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[#1A1A1A]">Simulators</h1>
          <p className="text-[#6B6B6B] mt-2">
            Interactive demos of how Vroom works under the hood.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link href="/simulator/booking" className="group block">
            <div className="bg-white border border-[#E8E6E1] rounded-xl p-8 h-full hover:border-[#FF4D00]/40 hover:shadow-md transition-all">
              <div className="text-4xl mb-4">🏁</div>
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-2 group-hover:text-[#FF4D00] transition-colors">
                Booking Race
              </h2>
              <p className="text-[#6B6B6B] text-sm leading-relaxed">
                Simulate 6 users racing to book the same car simultaneously. See who wins and how the system handles conflicts.
              </p>
              <div className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[#FF4D00]">
                Launch simulator →
              </div>
            </div>
          </Link>
          <Link href="/simulator/lifecycle" className="group block">
            <div className="bg-white border border-[#E8E6E1] rounded-xl p-8 h-full hover:border-[#FF4D00]/40 hover:shadow-md transition-all">
              <div className="text-4xl mb-4">🎬</div>
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-2 group-hover:text-[#FF4D00] transition-colors">
                Full Lifecycle
              </h2>
              <p className="text-[#6B6B6B] text-sm leading-relaxed">
                Watch a complete rental from browse to review — every step of the journey, animated in real time.
              </p>
              <div className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[#FF4D00]">
                Launch simulator →
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
