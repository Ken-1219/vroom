"use client";

import { useState, useEffect } from "react";

interface PickupPoint {
  id: string;
  name: string;
  latitude: string;
  longitude: string;
  landmark?: string | null;
  city: string;
}

interface PickupPointSelectorProps {
  city: string;
  label: string;
  onSelect: (point: { address: string; lat: number; lng: number }) => void;
  onClear: () => void;
  selectedAddress?: string | null;
  disabled?: boolean;
}

export function PickupPointSelector({
  city,
  label,
  onSelect,
  onClear,
  selectedAddress,
  disabled,
}: PickupPointSelectorProps) {
  const [points, setPoints] = useState<PickupPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!city) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/pickup-points?city=${encodeURIComponent(city)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setPoints(data))
      .catch(() => setPoints([]))
      .finally(() => setLoading(false));
  }, [city]);

  if (points.length === 0 && !loading) return null;

  return (
    <div>
      <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
        {label}
      </label>

      {selectedAddress ? (
        <div className="flex items-center gap-2 px-3 py-2.5 border border-[#FF4D00]/20 bg-[#FFF1EB] rounded-lg text-sm">
          <svg className="w-4 h-4 text-[#FF4D00] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span className="text-[#1A1A1A] flex-1 truncate">{selectedAddress}</span>
          <button
            type="button"
            onClick={() => { onClear(); setOpen(false); }}
            disabled={disabled}
            className="text-[#999] hover:text-[#6B6B6B] cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          disabled={disabled || loading}
          className="w-full flex items-center justify-between px-3 py-2.5 border border-[#E8E6E1] rounded-lg text-sm text-[#6B6B6B] hover:border-[#E8E6E1] bg-white transition-colors cursor-pointer disabled:opacity-50"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            {loading ? "Loading pickup points..." : `Choose from ${points.length} pickup points`}
          </span>
          <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      )}

      {open && !selectedAddress && (
        <div className="mt-2 border border-[#E8E6E1] rounded-lg bg-white shadow-lg max-h-56 overflow-y-auto">
          {points.map((pp) => (
            <button
              key={pp.id}
              type="button"
              onClick={() => {
                onSelect({
                  address: pp.landmark ? `${pp.name} (${pp.landmark})` : pp.name,
                  lat: Number(pp.latitude),
                  lng: Number(pp.longitude),
                });
                setOpen(false);
              }}
              disabled={disabled}
              className="w-full text-left px-4 py-3 hover:bg-[#FAFAF8] transition-colors border-b border-[#F0EFEC] last:border-b-0 cursor-pointer"
            >
              <div className="text-sm font-medium text-[#1A1A1A]">{pp.name}</div>
              {pp.landmark && (
                <div className="text-xs text-[#6B6B6B] mt-0.5">{pp.landmark}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
