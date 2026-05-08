"use client";

import { useState, useRef, useEffect, useCallback } from "react";

declare global {
  interface Window {
    google?: typeof google;
    __googleMapsLoading?: Promise<void>;
  }
}

interface Prediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceResult {
  address: string;
  lat: number;
  lng: number;
  city: string;
}

interface PlacesAutocompleteProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onPlaceSelect: (place: PlaceResult) => void;
  onClear?: () => void;
  onTextChange?: (text: string) => void;
  restrictToCountry?: string;
  types?: string[];
  disabled?: boolean;
  className?: string;
}

const OLD_TYPE_GROUPS: Record<string, string[]> = {
  "(regions)": [
    "locality",
    "sublocality",
    "postal_code",
    "administrative_area_level_1",
    "administrative_area_level_2",
  ],
  "(cities)": ["locality", "administrative_area_level_3"],
};

function resolveTypes(types?: string[]): string[] | undefined {
  if (!types?.length) return undefined;
  return types.flatMap((t) => OLD_TYPE_GROUPS[t] ?? [t]);
}

function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps?.places) return Promise.resolve();
  if (window.__googleMapsLoading) return window.__googleMapsLoading;

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return Promise.reject(new Error("No Google Maps API key"));

  window.__googleMapsLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&loading=async`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      window.__googleMapsLoading = undefined;
      reject(new Error("Failed to load Google Maps"));
    };
    document.head.appendChild(script);
  });

  return window.__googleMapsLoading;
}

export function PlacesAutocomplete({
  label,
  placeholder = "Search location...",
  value = "",
  onPlaceSelect,
  onClear,
  onTextChange,
  restrictToCountry = "in",
  types,
  disabled = false,
  className = "",
}: PlacesAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [ready, setReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const predictionsMapRef = useRef<Map<string, google.maps.places.PlacePrediction>>(new Map());
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    loadGoogleMaps()
      .then(() => {
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
        setReady(true);
      })
      .catch(() => {
        setReady(true);
      });
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPredictions = useCallback(
    async (input: string) => {
      if (!window.google?.maps?.places || !input.trim()) {
        setPredictions([]);
        return;
      }

      try {
        const request: google.maps.places.AutocompleteRequest = {
          input,
          sessionToken: sessionTokenRef.current!,
          includedRegionCodes: [restrictToCountry],
        };
        const resolved = resolveTypes(types);
        if (resolved) {
          request.includedPrimaryTypes = resolved;
        }

        const { suggestions } =
          await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

        const newMap = new Map<string, google.maps.places.PlacePrediction>();
        const preds: Prediction[] = [];

        for (const s of suggestions) {
          const p = s.placePrediction;
          if (!p) continue;
          newMap.set(p.placeId, p);
          preds.push({
            placeId: p.placeId,
            description: p.text.text,
            mainText: p.mainText?.text ?? "",
            secondaryText: p.secondaryText?.text ?? "",
          });
        }

        predictionsMapRef.current = newMap;
        setPredictions(preds);
      } catch {
        setPredictions([]);
      }
    },
    [restrictToCountry, types]
  );

  const handleInputChange = (val: string) => {
    setQuery(val);
    onTextChange?.(val);

    if (ready) {
      setShowDropdown(true);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchPredictions(val), 250);
    }
  };

  const selectPlace = async (prediction: Prediction) => {
    setQuery(prediction.mainText);
    setShowDropdown(false);
    setPredictions([]);

    const stored = predictionsMapRef.current.get(prediction.placeId);
    if (!stored) return;

    try {
      const place = stored.toPlace();
      await place.fetchFields({
        fields: ["location", "addressComponents", "formattedAddress"],
      });

      const lat = place.location!.lat();
      const lng = place.location!.lng();

      let city = "";
      if (place.addressComponents) {
        for (const comp of place.addressComponents) {
          if (comp.types.includes("locality")) {
            city = comp.longText ?? "";
            break;
          }
          if (comp.types.includes("administrative_area_level_2") && !city) {
            city = comp.longText ?? "";
          }
          if (comp.types.includes("sublocality_level_1") && !city) {
            city = comp.longText ?? "";
          }
        }
      }

      onPlaceSelect({
        address: place.formattedAddress ?? prediction.description,
        lat,
        lng,
        city: city || prediction.mainText,
      });
    } catch {
      // geocoding failed — ignore silently
    }

    sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    predictionsMapRef.current.clear();
  };

  const handleClear = () => {
    setQuery("");
    setPredictions([]);
    setShowDropdown(false);
    onClear?.();
  };

  const inputClass =
    "w-full pl-9 pr-8 py-2.5 rounded-lg border border-[#E8E6E1] text-sm text-[#1A1A1A] bg-white hover:border-[#E8E6E1] focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00] transition-shadow";

  return (
    <div className={className} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">{label}</label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-[#999]" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (predictions.length > 0) setShowDropdown(true);
          }}
          disabled={disabled || !ready}
          className={inputClass}
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#999] hover:text-[#6B6B6B]"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {showDropdown && predictions.length > 0 && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-[#E8E6E1] rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {predictions.map((p) => (
              <button
                key={p.placeId}
                onClick={() => selectPlace(p)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#FFF1EB] transition-colors"
              >
                <span className="font-medium text-[#1A1A1A]">{p.mainText}</span>
                {p.secondaryText && (
                  <span className="text-[#999] ml-1">{p.secondaryText}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
