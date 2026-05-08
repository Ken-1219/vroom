import Link from "next/link";
import Image from "next/image";
import { vehicleService } from "@/services/vehicle";
import { auth } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { Logo } from "@/components/logo";
import { HomeAI } from "@/components/home-ai";
import { formatPrice } from "@/lib/format";

const NEIGHBORHOODS = [
  { name: "Koramangala", tagline: "Startup hub, always buzzing", image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600&h=400&fit=crop" },
  { name: "Indiranagar", tagline: "Nightlife & cafes", image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&h=400&fit=crop" },
  { name: "Whitefield", tagline: "IT corridor", image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&h=400&fit=crop" },
  { name: "HSR Layout", tagline: "Quiet streets, great parks", image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&h=400&fit=crop" },
  { name: "Jayanagar", tagline: "Old-world charm", image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&h=400&fit=crop" },
  { name: "Malleshwaram", tagline: "Heritage & temples", image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&h=400&fit=crop" },
];

const VEHICLE_TYPES = [
  { type: "hatchback", label: "Hatchback", icon: "M3 13h1l1.5-4h9L16 13h1m-11 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z", from: 1200 },
  { type: "sedan", label: "Sedan", icon: "M3 13h1l1.5-4h11L18 13h1m-13 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z", from: 1800 },
  { type: "suv", label: "SUV", icon: "M3 12h1l2-5h10l2 5h1m-13 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z", from: 2500 },
  { type: "luxury", label: "Luxury", icon: "M3 13h1l1.5-4h11L18 13h1m-13 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z", from: 6000 },
  { type: "ev", label: "Electric", icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z", from: 2000 },
  { type: "mpv", label: "MPV", icon: "M3 12h1l2-5h10l2 5h1m-13 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z", from: 2200 },
];

export default async function Home() {
  const [cities, session] = await Promise.all([vehicleService.getCities(), auth()]);
  const totalVehicles = cities.reduce((sum, c) => sum + c.vehicleCount, 0);
  const startingPrice = cities[0] ? formatPrice(cities[0].startingPrice, "INR") : "1,200";

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── AI-First Hero ── */}
      <header className="relative overflow-hidden bg-[#0D0D0D]">
        <Nav variant="dark" />
        <HomeAI totalVehicles={totalVehicles} startingPrice={startingPrice} />
      </header>

      {/* ── Vehicle Categories ── */}
      <section className="py-20 px-6 bg-[#FAFAF8]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-display font-bold text-[#1A1A1A] tracking-tight">
                Find your ride
              </h2>
              <p className="mt-2 text-[#6B6B6B]">
                From daily hatchbacks to weekend SUVs — every type, every budget.
              </p>
            </div>
            <Link
              href="/vehicles"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[#FF4D00] hover:text-[#E64500] transition-colors"
            >
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {VEHICLE_TYPES.map((vt, i) => (
              <Link
                key={vt.type}
                href={`/vehicles?vehicleType=${vt.type}`}
                className={`group relative p-5 rounded-2xl border border-[#E8E6E1] bg-white hover:border-[#FF4D00]/30 hover:shadow-lg transition-all duration-300 animate-fade-up stagger-${i + 1}`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#FFF1EB] flex items-center justify-center mb-4 group-hover:bg-[#FF4D00] transition-colors">
                  <svg className="w-5 h-5 text-[#FF4D00] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={vt.icon} />
                  </svg>
                </div>
                <h3 className="font-semibold text-[#1A1A1A] text-sm">{vt.label}</h3>
                <p className="text-xs text-[#999] mt-1">From &#8377;{vt.from.toLocaleString("en-IN")}/day</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-bold text-[#1A1A1A] tracking-tight">
              Three steps. Zero hassle.
            </h2>
            <p className="mt-3 text-[#6B6B6B] max-w-xl mx-auto">
              Renting a car on Vroom takes minutes. No paperwork, no long queues.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { num: "01", title: "Ask AI", desc: "Tell Vroom AI what you need — 'SUV for a family trip this weekend.' It finds the perfect match instantly." },
              { num: "02", title: "Book & Pay", desc: "Choose a verified host, review the details, pay securely with Razorpay." },
              { num: "03", title: "Drive", desc: "Pick up the car, hit the road. Return it when you're done — that's it." },
            ].map((step, i) => (
              <div
                key={step.num}
                className={`relative p-8 rounded-2xl border border-[#E8E6E1] bg-[#FAFAF8] animate-fade-up stagger-${i + 1}`}
              >
                <span className="text-4xl font-display font-extrabold text-[#FF4D00]/15">{step.num}</span>
                <h3 className="text-xl font-display font-bold text-[#1A1A1A] mt-3">{step.title}</h3>
                <p className="mt-3 text-[#6B6B6B] leading-relaxed text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Neighborhoods ── */}
      <section className="py-20 px-6 bg-[#FAFAF8]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-display font-bold text-[#1A1A1A] tracking-tight">
                Explore Bangalore
              </h2>
              <p className="mt-2 text-[#6B6B6B]">
                Cars available across 40+ neighborhoods. Pick up near you.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {NEIGHBORHOODS.map((n, i) => (
              <Link
                key={n.name}
                href={`/vehicles?city=${encodeURIComponent(n.name)}`}
                className={`group relative rounded-2xl overflow-hidden aspect-[16/10] animate-fade-up stagger-${i + 1}`}
              >
                <Image
                  src={n.image}
                  alt={n.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover img-zoom"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-lg font-display font-bold text-white">{n.name}</h3>
                  <p className="text-sm text-white/60 mt-0.5">{n.tagline}</p>
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-medium text-white bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    Browse cars
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust Signals ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-bold text-[#1A1A1A] tracking-tight">
              Why people trust Vroom
            </h2>
            <p className="mt-3 text-[#6B6B6B]">We go the extra mile so you can too.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: "shield", title: "Verified Hosts", desc: "Every host is identity-verified and rated by the community." },
              { icon: "check", title: "Insurance Included", desc: "Every trip comes with comprehensive coverage. Drive with peace of mind." },
              { icon: "phone", title: "24/7 Support", desc: "Call, chat, or email — our support team is always available." },
              { icon: "clock", title: "Free Cancellation", desc: "Cancel 24+ hours before your trip for a full refund. No questions." },
            ].map((signal) => (
              <div key={signal.title} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FFF1EB] mb-5">
                  <TrustIcon name={signal.icon} />
                </div>
                <h3 className="font-display font-bold text-[#1A1A1A]">{signal.title}</h3>
                <p className="mt-2 text-sm text-[#6B6B6B] leading-relaxed">{signal.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-24 px-6 bg-[#0D0D0D] overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[600px] h-[600px] bg-[#FF4D00]/10 rounded-full blur-[120px]" />
        </div>
        <div className="noise-bg absolute inset-0" />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="text-3xl lg:text-5xl font-display font-extrabold text-white tracking-tight">
            Ready to hit the road?
          </h2>
          <p className="mt-5 text-lg text-white/40">
            {totalVehicles}+ cars across 40+ Bangalore neighborhoods. Your next trip is a tap away.
          </p>
          <div className="mt-10">
            <Link
              href="/vehicles"
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-[#FF4D00] hover:bg-[#E64500] text-white font-semibold rounded-full transition-colors text-lg"
            >
              Start browsing
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-14 px-6 bg-[#0D0D0D] border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-10">
            <div>
              <Logo variant="light" />
              <p className="mt-4 text-sm text-white/30 leading-relaxed max-w-xs">
                Self-drive car rentals from trusted hosts across Bangalore.
                Available in 40+ neighborhoods.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white/50 uppercase tracking-widest">Explore</h4>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link href="/vehicles" className="text-sm text-white/40 hover:text-white transition-colors">
                    Browse Cars
                  </Link>
                </li>
                <li>
                  {session?.user ? (
                    <Link href="/bookings" className="text-sm text-white/40 hover:text-white transition-colors">
                      My Bookings
                    </Link>
                  ) : (
                    <Link href="/login" className="text-sm text-white/40 hover:text-white transition-colors">
                      Sign In
                    </Link>
                  )}
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white/50 uppercase tracking-widest">Support</h4>
              <ul className="mt-4 space-y-3">
                <li><span className="text-sm text-white/40">help@vroom.com</span></li>
                <li><span className="text-sm text-white/40">Available 24/7</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-white/[0.06] text-center">
            <p className="text-xs text-white/20">&copy; {new Date().getFullYear()} Vroom. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function TrustIcon({ name }: { name: string }) {
  const className = "w-6 h-6 text-[#FF4D00]";

  switch (name) {
    case "shield":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case "check":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "phone":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      );
    case "clock":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return null;
  }
}
