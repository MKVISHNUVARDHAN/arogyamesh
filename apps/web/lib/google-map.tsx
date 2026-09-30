"use client";
import { useEffect, useRef, useState } from "react";
import type { Facility } from "./types";

type Bounds = { extend: (position: { lat: number; lng: number }) => void };
type MapHandle = { fitBounds: (bounds: Bounds, padding: number) => void };
type Maps = {
  Map: new (element: HTMLElement, options: object) => MapHandle;
  LatLngBounds: new () => Bounds;
  marker: {
    AdvancedMarkerElement: new (options: object) => {
      addListener: (name: string, handler: () => void) => void;
      map: MapHandle | null;
    };
  };
};
declare global {
  interface Window {
    arogyaMapsReady?: () => void;
    gm_authFailure?: () => void;
    google?: { maps: Maps };
  }
}
let loader: Promise<Maps> | undefined;
function load(key: string) {
  if (window.google?.maps.marker) return Promise.resolve(window.google.maps);
  if (!loader)
    loader = new Promise<Maps>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Google Maps timed out")),
        15000,
      );
      window.arogyaMapsReady = () => {
        clearTimeout(timeout);
        if (window.google) resolve(window.google.maps);
        else reject(new Error("Google Maps unavailable"));
      };
      window.gm_authFailure = () => {
        clearTimeout(timeout);
        reject(new Error("Google Maps credentials rejected"));
      };
      const script = document.createElement("script");
      // Official direct loader: https://developers.google.com/maps/documentation/javascript/load-maps-js-api
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&libraries=maps,marker&callback=arogyaMapsReady`;
      script.async = true;
      script.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("Google Maps network unavailable"));
      };
      document.head.appendChild(script);
    });
  return loader;
}
export function GoogleMap({
  facilities,
  day,
  metric,
  select,
  fallback,
}: {
  facilities: Facility[];
  day: number;
  metric: string;
  select: (id: string) => void;
  fallback: React.ReactNode;
}) {
  const element = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!key) return;
    load(key)
      .then((maps) => {
        if (cancelled || !element.current) return;
        const map = new maps.Map(element.current, {
          center: { lat: 15.8, lng: 78.0 },
          zoom: 8,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || "DEMO_MAP_ID",
          mapTypeControl: false,
          streetViewControl: false,
        });
        const bounds = new maps.LatLngBounds();
        for (const p of facilities) {
          const value =
            metric === "capacity"
              ? 1 - p.capacity.score / 100
              : metric === "beds"
                ? (day
                    ? p.beds.forecast.find(
                        (f) => f.days === (day === 5 ? 7 : day),
                      )?.occupancy || p.beds.occupied
                    : p.beds.occupied) / p.beds.total
                : p.ors.horizons.find((h) => h.days === (day || 1))?.risk || 0;
          const content = document.createElement("button");
          content.type = "button";
          content.setAttribute("aria-label", `Select ${p.name}`);
          content.style.cssText = `width:17px;height:17px;border:2px solid white;border-radius:50%;box-shadow:0 1px 5px #5555;background:${value > 0.7 ? "#c8504a" : value > 0.25 ? "#c48b35" : "#348f70"}`;
          const position = { lat: p.lat, lng: p.lon };
          const marker = new maps.marker.AdvancedMarkerElement({
            map,
            position,
            content,
            title: p.name,
          });
          marker.addListener("click", () => select(p.id));
          bounds.extend(position);
        }
        if (facilities.length) map.fitBounds(bounds, 35);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [facilities, day, metric, select]);
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY) return fallback;
  if (error)
    return (
      <>
        <div className="insight">{error}. Showing the local map.</div>
        {fallback}
      </>
    );
  return (
    <div
      ref={element}
      style={{ height: 400, width: "100%" }}
      aria-label="Google Maps PHC network"
    />
  );
}
