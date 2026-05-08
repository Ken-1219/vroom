import Link from "next/link";
import { Nav } from "@/components/nav";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Nav />
      <div className="flex items-center justify-center px-6 py-32">
        <div className="text-center max-w-md">
          <p className="text-6xl font-bold text-[#E8E6E1] mb-4">404</p>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">
            Page not found
          </h1>
          <p className="text-sm text-[#6B6B6B] mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/"
              className="px-6 py-2.5 bg-[#FF4D00] hover:bg-[#E64500] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Go Home
            </Link>
            <Link
              href="/vehicles"
              className="px-6 py-2.5 bg-white border border-[#E8E6E1] hover:bg-[#FAFAF8] text-[#1A1A1A] text-sm font-medium rounded-lg transition-colors"
            >
              Browse Cars
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
