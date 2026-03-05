"use client";

import { useEffect, useMemo } from "react";
import { 
  Map, 
  AdvancedMarker, 
  useMap,
  APIProvider,
} from "@vis.gl/react-google-maps";

export interface RouteStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface BusRouteMapProps {
  center: { lat: number; lng: number };
  routeKey: string; // changes when a new route is selected — triggers map pan
  stops: RouteStop[];
  routePath: [number, number][]; // Current state uses [lat, lng] arrays
  focusPoint?: { lat: number; lng: number; token: string } | null;
  editable: boolean;
  addStopMode: boolean;
  selectedStopId: string | null;
  onMapClick: (lat: number, lng: number) => void;
  onStopDrag: (id: string, lat: number, lng: number) => void;
  onSelectStop: (id: string) => void;
}

/**
 * Custom component to draw the route path using Google Maps Polyline.
 * We use the native google.maps.Polyline since @vis.gl doesn't have a 1:1 polyline component yet.
 */
function RoutePolyline({ path }: { path: google.maps.LatLngLiteral[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || path.length < 2) return;

    const polyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: "#10b981", // primary/emerald-500
      strokeOpacity: 0.8,
      strokeWeight: 4,
      map: map,
    });

    return () => {
      polyline.setMap(null);
    };
  }, [map, path]);

  return null;
}

/**
 * Pans the map to the given center when the route selection changes.
 * Uses a stringified key so it only fires on meaningful center changes.
 */
function MapCenterController({ center, routeKey }: { center: { lat: number; lng: number }; routeKey: string }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.panTo(center);
    map.setZoom(15);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, routeKey]);

  return null;
}

/**
 * Handles camera movement when a focus point is provided (e.g., from search results).
 */
function FocusController({ point }: { point?: { lat: number; lng: number; token: string } | null }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !point) return;
    map.panTo({ lat: point.lat, lng: point.lng });
    map.setZoom(17);
  }, [map, point]);

  return null;
}

export function BusRouteMap({
  center,
  routeKey,
  stops,
  routePath,
  focusPoint,
  editable,
  addStopMode,
  selectedStopId,
  onMapClick,
  onStopDrag,
  onSelectStop,
}: BusRouteMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  // Convert current [lat, lng] array format to Google's {lat, lng} object format
  const googlePath = useMemo(() => 
    routePath.map(([lat, lng]) => ({ lat, lng })), 
  [routePath]);

  if (!apiKey) {
    return (
      <div className="h-full min-h-[460px] w-full flex items-center justify-center bg-muted/20 rounded-xl border border-dashed border-border text-center p-6">
        <p className="text-sm text-muted-foreground">Google Maps API key missing in environment.</p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey} libraries={["marker"]}>
      <div className="h-full min-h-[460px] w-full relative rounded-xl overflow-hidden border border-border/50">
        <Map
          defaultCenter={center}
          defaultZoom={15}
          mapId="SHUTTLE_TRACKER_MAP" // Required for Advanced Markers
          onClick={(e) => {
            if (addStopMode && e.detail.latLng) {
              onMapClick(e.detail.latLng.lat, e.detail.latLng.lng);
            }
          }}
          disableDefaultUI={false}
          clickableIcons={false}
        >
          <RoutePolyline path={googlePath} />

          <MapCenterController center={center} routeKey={routeKey} />

          <FocusController point={focusPoint} />

          {stops.map((stop) => {
            const isSelected = selectedStopId === stop.id;
            return (
              <AdvancedMarker
                key={stop.id}
                position={{ lat: stop.lat, lng: stop.lng }}
                onClick={() => onSelectStop(stop.id)}
                draggable={editable}
                onDragEnd={(e) => {
                  if (e.latLng) {
                    onStopDrag(stop.id, e.latLng.lat(), e.latLng.lng());
                  }
                }}
              >
                <div
                  title={stop.name}
                  style={{
                    width: isSelected ? 22 : 16,
                    height: isSelected ? 22 : 16,
                    borderRadius: "50%",
                    background: isSelected ? "#10b981" : "#3b82f6",
                    border: "2.5px solid white",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
                    transition: "all 0.15s ease",
                    pointerEvents: "none", // let drag/click events reach the AdvancedMarker
                  }}
                />
              </AdvancedMarker>
            );
          })}
        </Map>
      </div>
    </APIProvider>
  );
}
