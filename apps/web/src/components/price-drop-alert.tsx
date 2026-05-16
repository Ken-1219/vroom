"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface PriceDropAlertProps {
  vehicleId: string;
  vehicleName: string;
}

export function PriceDropAlert({ vehicleId, vehicleName }: PriceDropAlertProps) {
  const { data: session } = useSession();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!session?.user) { setChecked(true); return; }
    fetch(`/api/alerts/price-drop?vehicleId=${vehicleId}`)
      .then((r) => (r.ok ? r.json() : { subscribed: false }))
      .then((d) => setSubscribed(d.subscribed))
      .catch(() => {})
      .finally(() => setChecked(true));
  }, [vehicleId, session]);

  if (!session?.user || !checked) return null;

  async function toggle() {
    setLoading(true);
    try {
      if (subscribed) {
        await fetch(`/api/alerts/price-drop?vehicleId=${vehicleId}`, { method: "DELETE" });
        setSubscribed(false);
      } else {
        const res = await fetch("/api/alerts/price-drop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vehicleId }),
        });
        if (res.ok) setSubscribed(true);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer disabled:opacity-60 ${
        subscribed
          ? "text-emerald-600 hover:text-emerald-700"
          : "text-[#6B6B6B] hover:text-[#1A1A1A]"
      }`}
      title={subscribed ? "Remove price drop alert" : `Get notified if ${vehicleName} price drops`}
    >
      {subscribed ? (
        <>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
          Price alert on
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 20 20" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
          Price drop alert
        </>
      )}
    </button>
  );
}
