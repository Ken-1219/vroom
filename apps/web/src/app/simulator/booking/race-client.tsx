"use client";

import { useState, useCallback } from "react";

type UserStatus = "idle" | "competing" | "won" | "lost";

interface RaceUser {
  id: string;
  name: string;
  city: string;
  emoji: string;
  color: string;
  status: UserStatus;
  elapsed: number | null;
  bookingId: string | null;
}

const INITIAL_USERS: Omit<RaceUser, "status" | "elapsed" | "bookingId">[] = [
  { id: "1", name: "Arjun Mehta", city: "Mumbai", emoji: "🧑🏽", color: "#FF4D00" },
  { id: "2", name: "Priya Sharma", city: "Delhi", emoji: "👩🏽", color: "#7C3AED" },
  { id: "3", name: "Rahul Kumar", city: "Bangalore", emoji: "🧑🏻", color: "#059669" },
  { id: "4", name: "Sneha Patel", city: "Hyderabad", emoji: "👩🏻", color: "#DC2626" },
  { id: "5", name: "Vikram Rao", city: "Chennai", emoji: "🧑🏾", color: "#D97706" },
  { id: "6", name: "Anita Desai", city: "Pune", emoji: "👩🏾", color: "#2563EB" },
];

function makeUsers(): RaceUser[] {
  return INITIAL_USERS.map((u) => ({
    ...u,
    status: "idle",
    elapsed: null,
    bookingId: null,
  }));
}

export function BookingRaceClient() {
  const [users, setUsers] = useState<RaceUser[]>(makeUsers());
  const [racing, setRacing] = useState(false);
  const [finished, setFinished] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);

  const startRace = useCallback(() => {
    const fresh = makeUsers();
    const delays = fresh.map(() => Math.floor(Math.random() * 401) + 50);
    const minDelay = Math.min(...delays);
    const winnerIdx = delays.indexOf(minDelay);

    setUsers(fresh.map((u) => ({ ...u, status: "competing" })));
    setRacing(true);
    setFinished(false);
    setWinnerId(null);

    const start = Date.now();

    fresh.forEach((user, i) => {
      setTimeout(() => {
        const elapsed = Date.now() - start;
        const isWinner = i === winnerIdx;
        const bookingId = isWinner
          ? `BK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
          : null;

        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id
              ? {
                  ...u,
                  status: isWinner ? "won" : "lost",
                  elapsed,
                  bookingId,
                }
              : u
          )
        );

        if (isWinner) {
          setWinnerId(user.id);
        }

        if (i === fresh.length - 1 || delays[i] === Math.max(...delays)) {
          setTimeout(() => {
            setRacing(false);
            setFinished(true);
          }, 50);
        }
      }, delays[i]!);
    });

    const maxDelay = Math.max(...delays);
    setTimeout(() => {
      setRacing(false);
      setFinished(true);
    }, maxDelay + 100);
  }, []);

  const reset = useCallback(() => {
    setUsers(makeUsers());
    setRacing(false);
    setFinished(false);
    setWinnerId(null);
  }, []);

  const winner = users.find((u) => u.id === winnerId);
  const allSettled = users.every((u) => u.status !== "competing");

  return (
    <div className="space-y-8">
      <div className="bg-white border border-[#E8E6E1] rounded-xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-[#FFF1EB] flex items-center justify-center flex-shrink-0">
          <svg className="w-8 h-8 text-[#FF4D00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#1A1A1A]">Maruti Suzuki Dzire · 2024 · ZXi+ AMT</p>
          <p className="text-sm text-[#6B6B6B]">Bangalore · ₹900/day</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-[#999] mb-1">Booking period</p>
          <p className="text-sm font-semibold text-[#1A1A1A]">May 20 – 25, 2025</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {users.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>

      <div className="flex justify-center">
        {!racing && !finished && (
          <button
            onClick={startRace}
            className="px-10 py-3.5 bg-[#FF4D00] hover:bg-[#E64500] text-white font-bold text-base rounded-xl transition-colors shadow-sm"
          >
            Start Race
          </button>
        )}
        {racing && (
          <button
            disabled
            className="px-10 py-3.5 bg-[#FF4D00]/60 text-white font-bold text-base rounded-xl cursor-not-allowed"
          >
            Racing…
          </button>
        )}
        {finished && allSettled && (
          <button
            onClick={reset}
            className="px-10 py-3.5 bg-[#FF4D00] hover:bg-[#E64500] text-white font-bold text-base rounded-xl transition-colors shadow-sm"
          >
            Race Again
          </button>
        )}
      </div>

      {finished && winner && allSettled && (
        <div className="bg-[#FFF1EB] border-2 border-[#FF4D00] rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">🏆</div>
          <p className="text-lg font-bold text-[#1A1A1A]">{winner.name} wins!</p>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Booking confirmed · {winner.bookingId} · responded in {winner.elapsed}ms
          </p>
        </div>
      )}

      {finished && allSettled && (
        <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E8E6E1]">
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Race Results</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8E6E1]">
                <th className="text-left px-5 py-2.5 text-xs text-[#999] font-medium">User</th>
                <th className="text-left px-5 py-2.5 text-xs text-[#999] font-medium">City</th>
                <th className="text-right px-5 py-2.5 text-xs text-[#999] font-medium">Response</th>
                <th className="text-right px-5 py-2.5 text-xs text-[#999] font-medium">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {[...users]
                .sort((a, b) => (a.elapsed ?? 999) - (b.elapsed ?? 999))
                .map((user) => (
                  <tr key={user.id} className="border-b border-[#E8E6E1] last:border-0">
                    <td className="px-5 py-3 font-medium text-[#1A1A1A]">
                      {user.emoji} {user.name}
                    </td>
                    <td className="px-5 py-3 text-[#6B6B6B]">{user.city}</td>
                    <td className="px-5 py-3 text-right font-mono text-[#6B6B6B]">
                      {user.elapsed != null ? `+${user.elapsed}ms` : "--"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {user.status === "won" ? (
                        <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          Booked
                        </span>
                      ) : (
                        <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          Missed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-[#999] text-center leading-relaxed max-w-xl mx-auto">
        In the real system, the first request to pass the database availability check wins. This is enforced via an atomic query that checks for overlapping pending/confirmed/active bookings.
      </p>
    </div>
  );
}

function UserCard({ user }: { user: RaceUser }) {
  return (
    <div
      className={`bg-white border rounded-xl p-4 transition-all ${
        user.status === "competing"
          ? "border-[#FF4D00] shadow-md"
          : user.status === "won"
          ? "border-green-400 shadow-md"
          : user.status === "lost"
          ? "border-red-200"
          : "border-[#E8E6E1]"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{user.emoji}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#1A1A1A] truncate">{user.name}</p>
          <p className="text-xs text-[#6B6B6B]">{user.city}</p>
        </div>
      </div>
      <StatusBadge user={user} />
    </div>
  );
}

function StatusBadge({ user }: { user: RaceUser }) {
  if (user.status === "idle") {
    return (
      <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-[#F0EFEC] text-[#6B6B6B]">
        Waiting
      </span>
    );
  }
  if (user.status === "competing") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-[#FFF1EB] text-[#FF4D00] animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D00]" />
        Attempting…
      </span>
    );
  }
  if (user.status === "won") {
    return (
      <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
        🏆 Booked! +{user.elapsed}ms
      </span>
    );
  }
  return (
    <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
      ❌ Car taken! +{user.elapsed}ms
    </span>
  );
}
