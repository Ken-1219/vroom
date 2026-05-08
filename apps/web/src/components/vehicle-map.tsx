"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { formatPrice } from "@/lib/format";

interface MapVehicle {
  id: string;
  make: string;
  model: string;
  latitude: string;
  longitude: string;
  baseDailyRate: number;
  currency: string;
  vehicleType: string;
  ratingAvg: string | null;
}

interface MapPickupPoint {
  id: string;
  name: string;
  latitude: string;
  longitude: string;
  landmark?: string | null;
}

interface MapGeofence {
  id: string;
  name: string;
  type: string;
  boundary: GeoJSON.Geometry;
}

interface VehicleMapProps {
  vehicles: MapVehicle[];
  pickupPoints?: MapPickupPoint[];
  geofences?: MapGeofence[];
  cityCenter?: { lat: number; lng: number } | null;
  className?: string;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function VehicleMap({
  vehicles,
  pickupPoints = [],
  geofences = [],
  cityCenter,
  className = "",
}: VehicleMapProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const priceMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const pickupMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const userLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(true);
  const [showPickupPoints, setShowPickupPoints] = useState(false);
  const [showGeofences, setShowGeofences] = useState(true);
  const [findingNearest, setFindingNearest] = useState(false);

  const rawToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
  const token = rawToken.replace(/^["']|["']$/g, "") || undefined;

  const clearPriceMarkers = useCallback(() => {
    priceMarkersRef.current.forEach((m) => m.remove());
    priceMarkersRef.current = [];
  }, []);

  const clearPickupMarkers = useCallback(() => {
    pickupMarkersRef.current.forEach((m) => m.remove());
    pickupMarkersRef.current = [];
  }, []);

  const findNearestVehicle = useCallback(() => {
    setFindingNearest(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        userLocationRef.current = { lat: userLat, lng: userLng };

        let nearest: MapVehicle | null = null;
        let minDist = Infinity;
        for (const v of vehicles) {
          const d = haversineDistance(userLat, userLng, Number(v.latitude), Number(v.longitude));
          if (d < minDist) {
            minDist = d;
            nearest = v;
          }
        }

        setFindingNearest(false);
        if (nearest) {
          router.push(`/vehicles/${nearest.id}`);
        }
      },
      () => {
        setFindingNearest(false);
        alert("Could not get your location. Please allow location access and try again.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [vehicles, router]);

  useEffect(() => {
    if (!token || !containerRef.current || vehicles.length === 0) return;

    mapboxgl.accessToken = token;

    const bounds = new mapboxgl.LngLatBounds();
    vehicles.forEach((v) => {
      bounds.extend([Number(v.longitude), Number(v.latitude)]);
    });

    const initialCenter = cityCenter
      ? [cityCenter.lng, cityCenter.lat] as [number, number]
      : [77.5946, 12.9716] as [number, number];

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: initialCenter,
      zoom: cityCenter ? 12 : 11,
    });

    if (!cityCenter) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
    }

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
    });
    map.addControl(geolocate, "top-right");

    map.on("load", () => {
      // --- Geofence layers ---
      if (geofences.length > 0) {
        const geofenceGeoJson: GeoJSON.FeatureCollection = {
          type: "FeatureCollection",
          features: geofences.map((g) => ({
            type: "Feature" as const,
            geometry: g.boundary,
            properties: {
              id: g.id,
              name: g.name,
              type: g.type,
            },
          })),
        };

        map.addSource("geofences", {
          type: "geojson",
          data: geofenceGeoJson,
        });

        map.addLayer({
          id: "geofence-fill",
          type: "fill",
          source: "geofences",
          paint: {
            "fill-color": [
              "match",
              ["get", "type"],
              "restricted_zone", "#ef4444",
              "#10b981",
            ],
            "fill-opacity": 0.08,
          },
        });

        map.addLayer({
          id: "geofence-outline",
          type: "line",
          source: "geofences",
          paint: {
            "line-color": [
              "match",
              ["get", "type"],
              "restricted_zone", "#ef4444",
              "#10b981",
            ],
            "line-width": 2,
            "line-dasharray": [3, 2],
          },
        });

        map.addLayer({
          id: "geofence-label",
          type: "symbol",
          source: "geofences",
          layout: {
            "text-field": ["get", "name"],
            "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 11,
            "text-anchor": "center",
          },
          paint: {
            "text-color": [
              "match",
              ["get", "type"],
              "restricted_zone", "#dc2626",
              "#059669",
            ],
            "text-halo-color": "#ffffff",
            "text-halo-width": 1.5,
          },
        });
      }

      // --- Vehicle layers ---
      const geojson: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: vehicles.map((v) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [Number(v.longitude), Number(v.latitude)],
          },
          properties: {
            id: v.id,
            make: v.make,
            model: v.model,
            price: formatPrice(v.baseDailyRate, v.currency),
            vehicleType: v.vehicleType,
            rating: v.ratingAvg ? Number(v.ratingAvg).toFixed(1) : null,
          },
        })),
      };

      map.addSource("vehicles", {
        type: "geojson",
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "vehicles",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#FF4D00",
            10,
            "#E64500",
            30,
            "#CC3D00",
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            20,
            10,
            26,
            30,
            34,
          ],
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "vehicles",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 13,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "vehicles",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#FF4D00",
          "circle-radius": 0,
          "circle-stroke-width": 0,
        },
      });

      // --- Price label markers (HTML, clickable) ---
      function addPriceMarkers() {
        clearPriceMarkers();
        const zoom = map.getZoom();
        if (zoom < 10) return;

        const source = map.getSource("vehicles") as mapboxgl.GeoJSONSource;
        if (!source) return;

        const canvas = map.getCanvas();
        const bbox: [mapboxgl.PointLike, mapboxgl.PointLike] = [
          [0, 0],
          [canvas.width, canvas.height],
        ];
        const features = map.queryRenderedFeatures(bbox, {
          layers: ["unclustered-point"],
        });

        const seen = new Set<string>();

        features.forEach((f) => {
          const id = f.properties?.id;
          if (!id || seen.has(id)) return;
          seen.add(id);

          const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
          const price = f.properties?.price;
          const make = f.properties?.make ?? "";
          const model = f.properties?.model ?? "";
          if (!price) return;

          const el = document.createElement("a");
          el.href = `/vehicles/${id}`;
          el.className = "vroom-price-marker";
          el.style.textDecoration = "none";
          el.innerHTML = `<div style="
            background: white;
            border: 2px solid #FF4D00;
            border-radius: 20px;
            padding: 4px 10px;
            font-size: 12px;
            font-weight: 700;
            color: #1A1A1A;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            cursor: pointer;
            font-family: system-ui, sans-serif;
            transition: all 0.15s ease;
            display: flex;
            align-items: center;
            gap: 4px;
          ">${price}<span style="font-weight: 400; color: #999; font-size: 10px;">/day</span></div>`;

          el.addEventListener("mouseenter", () => {
            const inner = el.firstElementChild as HTMLElement;
            if (inner) {
              inner.style.background = "#FF4D00";
              inner.style.color = "white";
              inner.style.transform = "scale(1.08)";
              const span = inner.querySelector("span") as HTMLElement;
              if (span) span.style.color = "rgba(255,255,255,0.7)";
            }
          });
          el.addEventListener("mouseleave", () => {
            const inner = el.firstElementChild as HTMLElement;
            if (inner) {
              inner.style.background = "white";
              inner.style.color = "#1A1A1A";
              inner.style.transform = "scale(1)";
              const span = inner.querySelector("span") as HTMLElement;
              if (span) span.style.color = "#999";
            }
          });

          el.addEventListener("click", (e) => {
            e.preventDefault();
            window.location.href = `/vehicles/${id}`;
          });

          const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
            .setLngLat(coords)
            .addTo(map);

          priceMarkersRef.current.push(marker);
        });
      }

      map.on("zoomend", addPriceMarkers);
      map.on("moveend", addPriceMarkers);

      // --- Cluster interactions ---
      map.on("click", "clusters", (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        });
        if (!features.length) return;
        const clusterId = features[0]!.properties!.cluster_id;
        (
          map.getSource("vehicles") as mapboxgl.GeoJSONSource
        ).getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          map.easeTo({
            center: (features[0]!.geometry as GeoJSON.Point)
              .coordinates as [number, number],
            zoom: zoom!,
          });
        });
      });

      map.on("click", "unclustered-point", (e) => {
        if (!e.features?.length) return;
        const feature = e.features[0]!;
        const props = feature.properties!;
        window.location.href = `/vehicles/${props.id}`;
      });

      map.on("mouseenter", "clusters", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "clusters", () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("mouseenter", "unclustered-point", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "unclustered-point", () => {
        map.getCanvas().style.cursor = "";
      });

      setTimeout(addPriceMarkers, 500);

      // --- User location ---
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLng = position.coords.longitude;
            const userLat = position.coords.latitude;
            userLocationRef.current = { lat: userLat, lng: userLng };

            const el = document.createElement("div");
            el.innerHTML = `
              <div style="position: relative; width: 20px; height: 20px;">
                <div style="position: absolute; inset: 0; background: #3b82f6; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 2px rgba(59,130,246,0.3);"></div>
              </div>
            `;

            userMarkerRef.current = new mapboxgl.Marker({ element: el })
              .setLngLat([userLng, userLat])
              .setPopup(
                new mapboxgl.Popup({ offset: 12 }).setHTML(
                  '<div style="font-family: system-ui; font-size: 13px; font-weight: 600; color: #3b82f6; padding: 2px;">You are here</div>'
                )
              )
              .addTo(map);

            setLocating(false);
          },
          () => {
            setLocating(false);
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      } else {
        setLocating(false);
      }
    });

    return () => {
      clearPriceMarkers();
      clearPickupMarkers();
      userMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [token, vehicles, geofences, cityCenter, clearPriceMarkers, clearPickupMarkers]);

  // Toggle pickup point markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || pickupPoints.length === 0) return;

    clearPickupMarkers();

    if (!showPickupPoints) return;

    pickupPoints.forEach((pp) => {
      const el = document.createElement("div");
      el.innerHTML = `<div style="
        width: 28px; height: 28px;
        background: #3b82f6;
        border: 2px solid white;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        cursor: pointer;
      "><svg width="14" height="14" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>`;

      const popup = new mapboxgl.Popup({ offset: 16, closeButton: false }).setHTML(`
        <div style="font-family: system-ui, sans-serif; padding: 4px;">
          <div style="font-weight: 600; font-size: 13px; color: #0f172a;">${pp.name}</div>
          ${pp.landmark ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">${pp.landmark}</div>` : ""}
        </div>
      `);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([Number(pp.longitude), Number(pp.latitude)])
        .setPopup(popup)
        .addTo(map);

      pickupMarkersRef.current.push(marker);
    });
  }, [showPickupPoints, pickupPoints, clearPickupMarkers]);

  // Toggle geofence visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const setVisibility = (visible: boolean) => {
      const val = visible ? "visible" : "none";
      try {
        if (map.getLayer("geofence-fill")) map.setLayoutProperty("geofence-fill", "visibility", val);
        if (map.getLayer("geofence-outline")) map.setLayoutProperty("geofence-outline", "visibility", val);
        if (map.getLayer("geofence-label")) map.setLayoutProperty("geofence-label", "visibility", val);
      } catch {
        // layers might not be loaded yet
      }
    };

    if (map.isStyleLoaded()) {
      setVisibility(showGeofences);
    } else {
      map.on("load", () => setVisibility(showGeofences));
    }
  }, [showGeofences]);

  if (!token) {
    return (
      <div
        className={`bg-[#F0EFEC] rounded-xl flex items-center justify-center ${className}`}
        style={{ minHeight: 500 }}
      >
        <div className="text-center text-[#999] px-6">
          <p className="text-sm font-medium">Map view is currently unavailable</p>
          <p className="text-xs mt-1">Please try switching to list view</p>
        </div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div
        className={`bg-[#F0EFEC] rounded-xl flex items-center justify-center ${className}`}
        style={{ minHeight: 500 }}
      >
        <p className="text-sm text-[#6B6B6B]">No vehicles to show on map</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className={`rounded-xl ${className}`}
        style={{ minHeight: 500 }}
      />

      {/* Vehicle count badge */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-[#1A1A1A] text-xs font-semibold px-3 py-1.5 rounded-full shadow-md z-10">
        {vehicles.length} car{vehicles.length !== 1 ? "s" : ""} on map
      </div>

      {/* Map controls overlay */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-10">
        {/* Find nearest car */}
        <button
          onClick={findNearestVehicle}
          disabled={findingNearest}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium shadow-md transition-colors cursor-pointer bg-[#FF4D00] text-white hover:bg-[#E64500] disabled:opacity-70"
        >
          {findingNearest ? (
            <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4m0 12v4m10-10h-4M6 12H2" />
            </svg>
          )}
          {findingNearest ? "Finding..." : "Nearest car to me"}
        </button>

        {pickupPoints.length > 0 && (
          <button
            onClick={() => setShowPickupPoints(!showPickupPoints)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium shadow-md transition-colors cursor-pointer ${
              showPickupPoints
                ? "bg-blue-600 text-white"
                : "bg-white text-[#1A1A1A] hover:bg-[#FAFAF8]"
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            Pickup Points
          </button>
        )}
        {geofences.length > 0 && (
          <button
            onClick={() => setShowGeofences(!showGeofences)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium shadow-md transition-colors cursor-pointer ${
              showGeofences
                ? "bg-[#FF4D00] text-white"
                : "bg-white text-[#1A1A1A] hover:bg-[#FAFAF8]"
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
            Zones
          </button>
        )}
      </div>

      {locating && (
        <div className="absolute top-4 right-16 bg-white/90 backdrop-blur-sm text-[#1A1A1A] text-sm font-medium px-4 py-2 rounded-full shadow-md flex items-center gap-2 z-10">
          <svg
            className="animate-spin h-4 w-4 text-[#FF4D00]"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              className="opacity-25"
            />
            <path
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              fill="currentColor"
            />
          </svg>
          Finding your location...
        </div>
      )}
    </div>
  );
}
