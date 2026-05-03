"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Accessibility,
  ArrowDown,
  ArrowUp,
  Bus,
  Check,
  Clock,
  Info,
  MapPin,
  Maximize2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useUserUniversity } from "@/hooks/useUserUniversity";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RouteStop } from "./BusRouteMap";

import { decode } from "@googlemaps/polyline-codec";

const BusRouteMap = dynamic(() => import("./BusRouteMap").then((module) => module.BusRouteMap), {
  ssr: false,
  loading: () => <div className="h-[460px] w-full rounded-xl border border-border/50 bg-muted/20 animate-pulse" />,
});

interface RouteMapData {
  stops: RouteStop[];
  routePath: [number, number][];
  updatedAt?: string;
}

interface UtilityShuttle {
  id: string;
  routeName: string;
  routeNumber: string;
  status: "On Time" | "Delayed" | "Arriving";
  nextStop?: string | null;
  etaMinutes?: number | null;
  schedule?: string[] | null;
  operatingHours?: string | null;
  serviceAlerts?: string | null;
  isAccessible?: boolean | null;
  routeMapData?: RouteMapData | null;
}

interface UtilitySuggestion {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  routeName?: string | null;
  routeNumber?: string | null;
  nextStop?: string | null;
  etaMinutes?: number | null;
  schedule?: string[] | null;
  operatingHours?: string | null;
  serviceAlerts?: string | null;
  notes?: string | null;
  adminNote?: string | null;
}

interface PlaceSearchResult {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

const emptyShuttleForm = {
  routeName: "",
  routeNumber: "",
  status: "On Time",
  nextStop: "",
  etaMinutes: "",
  schedule: "",
  operatingHours: "",
  serviceAlerts: "",
  isAccessible: false,
};

const emptySuggestionForm = {
  routeName: "",
  routeNumber: "",
  nextStop: "",
  etaMinutes: "",
  schedule: "",
  operatingHours: "",
  serviceAlerts: "",
  notes: "",
};

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 };

const normalizeRouteMapData = (value: unknown): RouteMapData => {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const rawStops = Array.isArray(raw.stops) ? raw.stops : [];
  const rawPath = Array.isArray(raw.routePath) ? raw.routePath : [];

  const stops: RouteStop[] = rawStops
    .map((stop, index) => {
      const item = stop && typeof stop === "object" ? (stop as Record<string, unknown>) : {};
      const lat = typeof item.lat === "number" ? item.lat : null;
      const lng = typeof item.lng === "number" ? item.lng : null;
      if (lat === null || lng === null) return null;
      return {
        id: typeof item.id === "string" ? item.id : `${index + 1}`,
        name: typeof item.name === "string" && item.name.trim() ? item.name : `Stop ${index + 1}`,
        lat,
        lng,
      };
    })
    .filter((stop): stop is RouteStop => stop !== null);

  const routePath: [number, number][] = rawPath
    .map((point) => {
      if (!Array.isArray(point) || point.length < 2) return null;
      const lat = typeof point[0] === "number" ? point[0] : null;
      const lng = typeof point[1] === "number" ? point[1] : null;
      if (lat === null || lng === null) return null;
      return [lat, lng] as [number, number];
    })
    .filter((point): point is [number, number] => point !== null);

  return {
    stops,
    routePath,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
  };
};

const getRouteCenter = (routeMapData: RouteMapData | null | undefined) => {
  const normalized = normalizeRouteMapData(routeMapData);
  if (normalized.stops.length > 0) {
    return { lat: normalized.stops[0].lat, lng: normalized.stops[0].lng };
  }
  if (normalized.routePath.length > 0) {
    return { lat: normalized.routePath[0][0], lng: normalized.routePath[0][1] };
  }
  return DEFAULT_CENTER;
};

export function BusTracker() {
  const { universityId, userId, role, loading: userContextLoading } = useUserUniversity();
  // FC-1 fix: shuttle/bus data is platform-managed.
  const isAdmin = role === "ADMIN" && !universityId;
  const [hasRouteMapDataColumn, setHasRouteMapDataColumn] = useState(true);

  const [routes, setRoutes] = useState<UtilityShuttle[]>([]);
  const [pendingSuggestions, setPendingSuggestions] = useState<UtilitySuggestion[]>([]);
  const [userSuggestions, setUserSuggestions] = useState<UtilitySuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "On Time" | "Delayed" | "Arriving">("ALL");

  const [routeDialogOpen, setRouteDialogOpen] = useState(false);
  const [suggestDialogOpen, setSuggestDialogOpen] = useState(false);
  const [submittingRoute, setSubmittingRoute] = useState(false);
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false);
  const [updatingRouteId, setUpdatingRouteId] = useState<string | null>(null);

  const [routeForm, setRouteForm] = useState(emptyShuttleForm);
  const [suggestionForm, setSuggestionForm] = useState(emptySuggestionForm);

  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [addStopMode, setAddStopMode] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [isSavingMap, setIsSavingMap] = useState(false);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [editorStops, setEditorStops] = useState<RouteStop[]>([]);
  const [editorRoutePath, setEditorRoutePath] = useState<[number, number][]>([]);
  const [editingStopId, setEditingStopId] = useState<string | null>(null);
  const [stopDraft, setStopDraft] = useState<{ name: string; lat: string; lng: string }>({ name: "", lat: "", lng: "" });
  const [placeQuery, setPlaceQuery] = useState("");
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [placeResults, setPlaceResults] = useState<PlaceSearchResult[]>([]);
  const [focusedPlace, setFocusedPlace] = useState<{ lat: number; lng: number; token: string } | null>(null);
  const [expandMapOpen, setExpandMapOpen] = useState(false);

  const selectedRoute = useMemo(() => routes.find((route) => route.id === selectedRouteId) ?? null, [routes, selectedRouteId]);
  const selectedRouteMapData = useMemo(() => normalizeRouteMapData(selectedRoute?.routeMapData), [selectedRoute]);

  const routeMapCenter = useMemo(
    () => getRouteCenter(editingRouteId === selectedRoute?.id ? { stops: editorStops, routePath: editorRoutePath } : selectedRouteMapData),
    [editingRouteId, selectedRoute?.id, editorStops, editorRoutePath, selectedRouteMapData],
  );

  const filteredRoutes = useMemo(() => {
    return routes.filter((route) => {
      const query = searchTerm.trim().toLowerCase();
      const matchesQuery = !query || `${route.routeName} ${route.routeNumber} ${route.nextStop || ""}`.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "ALL" || route.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [routes, searchTerm, statusFilter]);

  const loadRoutes = async () => {
    if (!universityId) return;
    setLoading(true);

    if (hasRouteMapDataColumn) {
      const probe = await supabase
        .from("UtilityShuttle")
        .select("routeMapData")
        .eq("universityId", universityId)
        .limit(1);
      if (probe.error && `${probe.error.message ?? ""}`.includes("routeMapData")) {
        setHasRouteMapDataColumn(false);
      }
    }

    const { data, error } = await supabase
      .from("UtilityShuttle")
      .select("*")
      .eq("universityId", universityId)
      .order("createdAt", { ascending: false });

    if (error) {
      toast.error("Failed to load shuttles.");
      setLoading(false);
      return;
    }

    setRoutes((data ?? []).map((route) => ({ ...route, routeMapData: normalizeRouteMapData(route.routeMapData) })));
    setLoading(false);
  };

  const loadSuggestions = async () => {
    if (!universityId || !userId) return;

    if (isAdmin) {
      const { data } = await supabase
        .from("UtilitySuggestion")
        .select("*")
        .eq("universityId", universityId)
        .eq("category", "SHUTTLE")
        .eq("status", "PENDING")
        .order("createdAt", { ascending: false });
      setPendingSuggestions(data ?? []);
      return;
    }

    const { data } = await supabase
      .from("UtilitySuggestion")
      .select("*")
      .eq("suggestedBy", userId)
      .eq("category", "SHUTTLE")
      .order("createdAt", { ascending: false });
    setUserSuggestions(data ?? []);
  };

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([loadRoutes(), loadSuggestions()]);
    setRefreshing(false);
  };

  useEffect(() => {
    if (!universityId) return;
    loadRoutes();
    loadSuggestions();
  }, [universityId, userId, role]);

  useEffect(() => {
    if (!selectedRouteId && routes.length > 0) {
      setSelectedRouteId(routes[0].id);
    }
    if (selectedRouteId && !routes.some((route) => route.id === selectedRouteId)) {
      setSelectedRouteId(routes[0]?.id ?? null);
    }
  }, [routes, selectedRouteId]);

  useEffect(() => {
    if (!selectedRoute || editingRouteId !== selectedRoute.id) return;
    const mapData = normalizeRouteMapData(selectedRoute.routeMapData);
    setEditorStops(mapData.stops.map((stop) => ({ ...stop })));
    setEditorRoutePath([...mapData.routePath]);
    setSelectedStopId(mapData.stops[0]?.id ?? null);
  }, [selectedRoute, editingRouteId]);

  const handleCreateRoute = async () => {
    if (!universityId) return;
    if (!routeForm.routeName || !routeForm.routeNumber) {
      toast.error("Route name and number are required.");
      return;
    }

    setSubmittingRoute(true);
    const payload = {
      universityId,
      routeName: routeForm.routeName,
      routeNumber: routeForm.routeNumber,
      status: routeForm.status,
      nextStop: routeForm.nextStop || null,
      etaMinutes: routeForm.etaMinutes ? Number(routeForm.etaMinutes) : null,
      schedule: routeForm.schedule ? routeForm.schedule.split(",").map((item) => item.trim()) : null,
      operatingHours: routeForm.operatingHours || null,
      serviceAlerts: routeForm.serviceAlerts || null,
      isAccessible: routeForm.isAccessible,
      ...(hasRouteMapDataColumn ? { routeMapData: { stops: [], routePath: [] } } : {}),
    };

    const { error } = await supabase.from("UtilityShuttle").insert(payload);
    if (error) {
      toast.error("Failed to add shuttle route.");
      setSubmittingRoute(false);
      return;
    }

    toast.success("Shuttle route added.");
    setRouteForm(emptyShuttleForm);
    setRouteDialogOpen(false);
    await loadRoutes();
    setSubmittingRoute(false);
  };

  const handleDeleteRoute = async (id: string) => {
    const { error } = await supabase.from("UtilityShuttle").delete().eq("id", id);
    if (error) {
      toast.error("Failed to remove shuttle route.");
      return;
    }

    toast.success("Shuttle route removed.");
    if (selectedRouteId === id) setSelectedRouteId(null);
    if (editingRouteId === id) setEditingRouteId(null);
    await loadRoutes();
  };

  const handleSuggestRoute = async () => {
    if (!universityId || !userId) return;
    if (!suggestionForm.routeName) {
      toast.error("Route name is required.");
      return;
    }

    setSubmittingSuggestion(true);
    const payload = {
      universityId,
      suggestedBy: userId,
      category: "SHUTTLE",
      routeName: suggestionForm.routeName,
      routeNumber: suggestionForm.routeNumber || null,
      nextStop: suggestionForm.nextStop || null,
      etaMinutes: suggestionForm.etaMinutes ? Number(suggestionForm.etaMinutes) : null,
      schedule: suggestionForm.schedule ? suggestionForm.schedule.split(",").map((item) => item.trim()) : null,
      operatingHours: suggestionForm.operatingHours || null,
      serviceAlerts: suggestionForm.serviceAlerts || null,
      notes: suggestionForm.notes || null,
    };

    const { error } = await supabase.from("UtilitySuggestion").insert(payload);
    if (error) {
      toast.error("Failed to submit suggestion.");
      setSubmittingSuggestion(false);
      return;
    }

    toast.success("Suggestion sent.");
    setSuggestionForm(emptySuggestionForm);
    setSuggestDialogOpen(false);
    await loadSuggestions();
    setSubmittingSuggestion(false);
  };

  const handleQuickStatusUpdate = async (routeId: string, status: UtilityShuttle["status"]) => {
    setUpdatingRouteId(routeId);
    const { error } = await supabase.from("UtilityShuttle").update({ status, updatedAt: new Date().toISOString() }).eq("id", routeId);
    if (error) {
      toast.error("Failed to update route status.");
      setUpdatingRouteId(null);
      return;
    }

    setRoutes((prev) => prev.map((route) => (route.id === routeId ? { ...route, status } : route)));
    setUpdatingRouteId(null);
  };

  const handleApproveSuggestion = async (suggestion: UtilitySuggestion) => {
    if (!universityId) return;
    const payload = {
      universityId,
      routeName: suggestion.routeName ?? "Shuttle Route",
      routeNumber: suggestion.routeNumber ?? "N/A",
      status: "On Time",
      nextStop: suggestion.nextStop ?? null,
      etaMinutes: suggestion.etaMinutes ?? null,
      schedule: suggestion.schedule ?? null,
      operatingHours: suggestion.operatingHours ?? null,
      serviceAlerts: suggestion.serviceAlerts ?? null,
      isAccessible: false,
      ...(hasRouteMapDataColumn ? { routeMapData: { stops: [], routePath: [] } } : {}),
    };

    const insert = await supabase.from("UtilityShuttle").insert(payload);
    if (insert.error) {
      toast.error("Failed to approve suggestion.");
      return;
    }

    await supabase.from("UtilitySuggestion").update({ status: "APPROVED" }).eq("id", suggestion.id);
    toast.success("Suggestion approved.");
    await Promise.all([loadRoutes(), loadSuggestions()]);
  };

  const handleRejectSuggestion = async (suggestion: UtilitySuggestion) => {
    const adminNote = window.prompt("Optional rejection note") || null;
    await supabase.from("UtilitySuggestion").update({ status: "REJECTED", adminNote }).eq("id", suggestion.id);
    toast.success("Suggestion rejected.");
    await loadSuggestions();
  };

  const startEditMap = () => {
    if (!selectedRoute) return;
    const mapData = normalizeRouteMapData(selectedRoute.routeMapData);
    setEditingRouteId(selectedRoute.id);
    setEditorStops(mapData.stops.map((stop) => ({ ...stop })));
    setEditorRoutePath([...mapData.routePath]);
    setSelectedStopId(mapData.stops[0]?.id ?? null);
    setAddStopMode(false);
  };

  const cancelEditMap = () => {
    setEditingRouteId(null);
    setAddStopMode(false);
    setEditorStops([]);
    setEditorRoutePath([]);
    setSelectedStopId(null);
    setEditingStopId(null);
    setStopDraft({ name: "", lat: "", lng: "" });
  };

  const mapIsEditable = Boolean(isAdmin && selectedRoute && editingRouteId === selectedRoute.id);
  const activeStops = mapIsEditable ? editorStops : selectedRouteMapData.stops;
  const activeRoutePath = mapIsEditable ? editorRoutePath : selectedRouteMapData.routePath;

  const fetchRoadRoutePath = async (stops: RouteStop[]): Promise<[number, number][] | null> => {
    if (stops.length < 2) return [];
    try {
      const origin = `${stops[0].lat},${stops[0].lng}`;
      const destination = `${stops[stops.length - 1].lat},${stops[stops.length - 1].lng}`;
      const waypoints = stops.slice(1, -1).map((s) => `${s.lat},${s.lng}`).join("|");

      const params = new URLSearchParams({ origin, destination });
      if (waypoints) params.set("waypoints", waypoints);

      const response = await fetch(`/api/maps/directions?${params.toString()}`);
      if (!response.ok) return null;

      const payload = await response.json();
      const points = payload?.routes?.[0]?.overview_polyline?.points;
      if (!points) return null;

      // Decode Google's encoded polyline
      const decoded = decode(points);
      return decoded.map(([lat, lng]) => [lat, lng] as [number, number]);
    } catch {
      return null;
    }
  };

  const handleMapAddStop = (lat: number, lng: number) => {
    if (!mapIsEditable) return;

    if (editingStopId) {
      setStopDraft((prev) => ({
        ...prev,
        lat: lat.toFixed(6),
        lng: lng.toFixed(6),
      }));
      return;
    }

    const nextStop: RouteStop = {
      id: Math.random().toString(36).slice(2),
      name: `Stop ${editorStops.length + 1}`,
      lat,
      lng,
    };

    const updatedStops = [...editorStops, nextStop];
    setEditorStops(updatedStops);
    setEditorRoutePath([]);
    setSelectedStopId(nextStop.id);

    if (updatedStops.length >= 2) {
      setIsRouting(true);
      void fetchRoadRoutePath(updatedStops)
        .then((path) => {
          if (path && path.length > 1) setEditorRoutePath(path);
        })
        .finally(() => setIsRouting(false));
    }
  };

  const addStopFromPlace = (place: PlaceSearchResult) => {
    if (!mapIsEditable) return;
    const nextStop: RouteStop = {
      id: Math.random().toString(36).slice(2),
      name: place.label.length > 40 ? `${place.label.slice(0, 40)}…` : place.label,
      lat: place.lat,
      lng: place.lng,
    };
    const updatedStops = [...editorStops, nextStop];
    setEditorStops(updatedStops);
    setEditorRoutePath([]);
    setSelectedStopId(nextStop.id);
    setFocusedPlace({ lat: place.lat, lng: place.lng, token: `${place.id}-${Date.now()}` });
    toast.success("Stop added from search result.");

    if (updatedStops.length >= 2) {
      setIsRouting(true);
      void fetchRoadRoutePath(updatedStops)
        .then((path) => {
          if (path && path.length > 1) setEditorRoutePath(path);
        })
        .finally(() => setIsRouting(false));
    }
  };

  const handleStopDrag = (stopId: string, lat: number, lng: number) => {
    if (!mapIsEditable) return;
    const updatedStops = editorStops.map((stop) => (stop.id === stopId ? { ...stop, lat, lng } : stop));
    setEditorStops(updatedStops);
    setEditorRoutePath([]);
    if (updatedStops.length >= 2) {
      setIsRouting(true);
      void fetchRoadRoutePath(updatedStops)
        .then((path) => {
          if (path && path.length > 1) setEditorRoutePath(path);
        })
        .finally(() => setIsRouting(false));
    }
  };

  const handleStopNameChange = (stopId: string, name: string) => {
    if (!mapIsEditable) return;
    setEditorStops((prev) => prev.map((stop) => (stop.id === stopId ? { ...stop, name } : stop)));
  };

  const handleDeleteStop = (stopId: string) => {
    if (!mapIsEditable) return;
    setEditorStops((prev) => prev.filter((stop) => stop.id !== stopId));
    setEditorRoutePath([]);
    if (editingStopId === stopId) {
      setEditingStopId(null);
      setStopDraft({ name: "", lat: "", lng: "" });
    }
    if (selectedStopId === stopId) setSelectedStopId(null);
  };

  const startStopEdit = (stop: RouteStop) => {
    if (!mapIsEditable) return;
    setEditingStopId(stop.id);
    setStopDraft({ name: stop.name, lat: String(stop.lat), lng: String(stop.lng) });
  };

  const cancelStopEdit = () => {
    setEditingStopId(null);
    setStopDraft({ name: "", lat: "", lng: "" });
  };

  const saveStopEdit = async (stopId: string) => {
    if (!mapIsEditable) return;

    const name = stopDraft.name.trim();
    const lat = Number(stopDraft.lat);
    const lng = Number(stopDraft.lng);

    if (!name) {
      toast.error("Stop name is required.");
      return;
    }
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      toast.error("Latitude must be between -90 and 90.");
      return;
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      toast.error("Longitude must be between -180 and 180.");
      return;
    }

    const nextStops = editorStops.map((stop) => (stop.id === stopId ? { ...stop, name, lat, lng } : stop));
    setEditorStops(nextStops);
    setEditorRoutePath([]);
    setEditingStopId(null);
    setStopDraft({ name: "", lat: "", lng: "" });

    if (nextStops.length >= 2) {
      setIsRouting(true);
      const path = await fetchRoadRoutePath(nextStops);
      if (path && path.length > 1) {
        setEditorRoutePath(path);
      }
      setIsRouting(false);
    }
  };

  const moveStop = (stopId: string, direction: -1 | 1) => {
    if (!mapIsEditable) return;
    setEditorStops((prev) => {
      const index = prev.findIndex((stop) => stop.id === stopId);
      if (index < 0) return prev;
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
    setEditorRoutePath([]);
  };

  const recalculateRoute = async () => {
    if (!mapIsEditable) return;
    if (editorStops.length < 2) {
      toast.error("Add at least 2 stops to generate a route.");
      return;
    }

    setIsRouting(true);
    try {
      const latLngPath = await fetchRoadRoutePath(editorStops);
      if (!latLngPath || latLngPath.length === 0) {
        toast.error("No drivable route found for these stops.");
        return;
      }
      setEditorRoutePath(latLngPath);
      toast.success("Route polyline updated from map service.");
    } catch {
      toast.error("Route calculation failed. Please try again.");
    } finally {
      setIsRouting(false);
    }
  };

  const handleSaveRouteMap = async () => {
    if (!selectedRoute || !mapIsEditable) return;

    setIsSavingMap(true);
    const routeMapData: RouteMapData = {
      stops: editorStops,
      routePath: editorRoutePath,
      updatedAt: new Date().toISOString(),
    };

    const nextStop = editorStops[0]?.name ?? selectedRoute.nextStop ?? null;

    const updatePayload = hasRouteMapDataColumn
      ? { routeMapData, nextStop, updatedAt: new Date().toISOString() }
      : { nextStop, updatedAt: new Date().toISOString() };

    const { error } = await supabase
      .from("UtilityShuttle")
      .update(updatePayload)
      .eq("id", selectedRoute.id);

    if (error) {
      toast.error("Failed to save route map updates.");
      setIsSavingMap(false);
      return;
    }

    setRoutes((prev) =>
      prev.map((route) =>
        route.id === selectedRoute.id
          ? { ...route, nextStop, routeMapData: normalizeRouteMapData(routeMapData) }
          : route,
      ),
    );
    setEditingRouteId(null);
    setAddStopMode(false);
    setIsSavingMap(false);
    if (!hasRouteMapDataColumn) toast.success("Route updated. Map geometry is disabled until schema is synced.");
    else toast.success("Route map saved successfully.");
  };

  const handlePlaceSearch = async () => {
    const query = placeQuery.trim();
    if (query.length < 2) {
      toast.error("Enter at least 2 characters to search places.");
      return;
    }

    setSearchingPlaces(true);
    try {
      const response = await fetch(`/api/maps/places?query=${encodeURIComponent(query)}`);

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        toast.error(errBody?.error ?? "Place search is temporarily unavailable. Ensure 'Places API' is enabled in Google Cloud Console.");
        return;
      }

      const payload = await response.json();
      if (!Array.isArray(payload.results)) {
        setPlaceResults([]);
        return;
      }

      const parsed: PlaceSearchResult[] = payload.results
        .map((item: any, index: number) => {
          const lat = item.geometry?.location?.lat;
          const lng = item.geometry?.location?.lng;
          const label = item.formatted_address || item.name || "Unnamed place";
          if (typeof lat !== "number" || typeof lng !== "number") return null;
          return {
            id: item.place_id || `result-${index}`,
            label: `${item.name}${item.formatted_address ? `, ${item.formatted_address}` : ""}`,
            lat,
            lng,
          };
        })
        .filter((item: PlaceSearchResult | null): item is PlaceSearchResult => item !== null);

      setPlaceResults(parsed);
      if (parsed.length === 0) {
        toast.error("No places found for this search.");
      }
    } catch {
      toast.error("Failed to search places.");
    } finally {
      setSearchingPlaces(false);
    }
  };

  if (!userContextLoading && !universityId) {
    return (
      <Card className="border-none shadow-xl bg-background/60 backdrop-blur-md overflow-hidden">
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          Add your university in your profile to use Shuttle Tracker.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-xl bg-background/60 backdrop-blur-md overflow-hidden">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Bus className="h-6 w-6 text-primary" />
                Live Transit Tracker
              </CardTitle>
              <CardDescription>Google Maps powered shuttle routes with editable stops and live path visibility.</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {isAdmin && (
                <Dialog open={routeDialogOpen} onOpenChange={setRouteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" /> Add Route
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Add shuttle route</DialogTitle>
                      <DialogDescription>Setup a new campus transit line.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 py-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label>Route Name</Label>
                          <Input value={routeForm.routeName} onChange={(event) => setRouteForm({ ...routeForm, routeName: event.target.value })} />
                        </div>
                        <div className="grid gap-2">
                          <Label>Number/ID</Label>
                          <Input value={routeForm.routeNumber} onChange={(event) => setRouteForm({ ...routeForm, routeNumber: event.target.value })} />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Current Status</Label>
                        <Select
                          value={routeForm.status || "On Time"}
                          onValueChange={(value: UtilityShuttle["status"]) => setRouteForm({ ...routeForm, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="On Time">On Time</SelectItem>
                            <SelectItem value="Arriving">Arriving</SelectItem>
                            <SelectItem value="Delayed">Delayed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Next Stop</Label>
                        <Input value={routeForm.nextStop || ""} onChange={(event) => setRouteForm({ ...routeForm, nextStop: event.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label>ETA (minutes)</Label>
                          <Input type="number" value={routeForm.etaMinutes} onChange={(event) => setRouteForm({ ...routeForm, etaMinutes: event.target.value })} />
                        </div>
                        <div className="grid gap-2">
                          <Label>Accessible</Label>
                          <Button
                            type="button"
                            variant={routeForm.isAccessible ? "default" : "outline"}
                            className="w-full justify-start gap-2"
                            onClick={() => setRouteForm({ ...routeForm, isAccessible: !routeForm.isAccessible })}
                          >
                            <Accessibility className="h-4 w-4" /> {routeForm.isAccessible ? "Enabled" : "Disabled"}
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Operating Hours</Label>
                        <Input value={routeForm.operatingHours} onChange={(event) => setRouteForm({ ...routeForm, operatingHours: event.target.value })} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Service Alerts</Label>
                        <Textarea value={routeForm.serviceAlerts} onChange={(event) => setRouteForm({ ...routeForm, serviceAlerts: event.target.value })} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreateRoute} disabled={submittingRoute}>
                        {submittingRoute ? "Saving..." : "Initialize Route"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              <Button size="sm" variant="outline" className="gap-2" onClick={refreshAll} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
              </Button>

              <div className="flex items-center gap-1 border rounded-md px-1 py-1 bg-background/50">
                {(["ALL", "On Time", "Arriving", "Delayed"] as const).map((option) => (
                  <Button
                    key={option}
                    size="sm"
                    variant={statusFilter === option ? "default" : "ghost"}
                    className="h-6 px-2 text-[10px]"
                    onClick={() => setStatusFilter(option)}
                  >
                    {option}
                  </Button>
                ))}
              </div>

              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter routes..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="pl-8 h-8 w-[170px] bg-background/50"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              [1, 2, 3].map((item) => <div key={item} className="h-44 rounded-xl bg-muted/30 animate-pulse border border-border/50" />)
            ) : filteredRoutes.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-muted/10 rounded-2xl border border-dashed border-border/50">
                <Bus className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">No routes match current filters.</p>
              </div>
            ) : (
              filteredRoutes.map((route) => {
                const mapData = normalizeRouteMapData(route.routeMapData);
                const isSelected = selectedRouteId === route.id;
                return (
                  <div
                    key={route.id}
                    role="button"
                    tabIndex={0}
                    className={`group text-left relative overflow-hidden rounded-2xl border p-5 transition-all ${
                      isSelected
                        ? "border-primary/50 bg-primary/5"
                        : "border-border/50 bg-card/40 hover:bg-card/80"
                    }`}
                    onClick={() => setSelectedRouteId(route.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedRouteId(route.id);
                      }
                    }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary text-lg">
                        {route.routeNumber}
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={route.status === "Delayed" ? "destructive" : "default"}
                          className={`h-5 px-2 text-[10px] uppercase font-bold tracking-tighter ${
                            route.status === "On Time" ? "bg-green-500 hover:bg-green-600" : route.status === "Arriving" ? "bg-blue-500 hover:bg-blue-600" : ""
                          }`}
                        >
                          {route.status}
                        </Badge>
                        {route.etaMinutes !== null && (
                          <p className="text-xs font-bold text-primary mt-1 flex items-center justify-end gap-1">
                            <Clock className="h-3 w-3" /> {route.etaMinutes}m
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-base leading-tight">{route.routeName}</h4>
                      <p className="text-xs text-muted-foreground">{mapData.stops.length} stops mapped</p>
                      {route.nextStop && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                          <span className="truncate">Next: <span className="text-foreground font-medium">{route.nextStop}</span></span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex gap-2">
                        {route.isAccessible && <Accessibility className="h-3.5 w-3.5 text-muted-foreground" />}
                        {route.serviceAlerts && <Info className="h-3.5 w-3.5 text-amber-500" />}
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" disabled={updatingRouteId === route.id} onClick={() => handleQuickStatusUpdate(route.id, "On Time")}>On Time</Button>
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" disabled={updatingRouteId === route.id} onClick={() => handleQuickStatusUpdate(route.id, "Arriving")}>Arriving</Button>
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-amber-600" disabled={updatingRouteId === route.id} onClick={() => handleQuickStatusUpdate(route.id, "Delayed")}>Delayed</Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteRoute(route.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl bg-background/60 backdrop-blur-md overflow-hidden">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-lg font-bold">Interactive Route Map</CardTitle>
              <CardDescription>
                {mapIsEditable
                  ? "Add stops with map clicks, drag stop markers to adjust positions, reorder stops, then save."
                  : "Select a route card to view its complete path and stop markers on the map."}
              </CardDescription>
            </div>

            {routes.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={selectedRouteId ?? ""} onValueChange={setSelectedRouteId}>
                  <SelectTrigger className="w-[220px] bg-background/50">
                    <SelectValue placeholder="Select route" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map((route) => (
                      <SelectItem key={route.id} value={route.id}>
                        {route.routeNumber} • {route.routeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {isAdmin && selectedRoute && !mapIsEditable && (
                  <Button size="sm" variant="outline" className="gap-2" onClick={startEditMap}>
                    <Pencil className="h-4 w-4" /> Edit Map
                  </Button>
                )}

                {mapIsEditable && (
                  <>
                    <Button
                      size="sm"
                      variant={addStopMode ? "default" : "outline"}
                      className="gap-2"
                      onClick={() => setAddStopMode((prev) => !prev)}
                    >
                      <Plus className="h-4 w-4" /> {addStopMode ? "Adding Stops" : "Add Stop"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={recalculateRoute} disabled={isRouting || editorStops.length < 2}>
                      {isRouting ? "Routing..." : "Recalculate Route"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEditMap} className="gap-2">
                      <X className="h-4 w-4" /> Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveRouteMap} disabled={isSavingMap} className="gap-2">
                      <Save className="h-4 w-4" /> {isSavingMap ? "Saving..." : "Save Map"}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {!selectedRoute ? (
            <div className="h-[460px] rounded-xl border border-dashed border-border/50 bg-muted/10 flex items-center justify-center text-sm text-muted-foreground">
              Select a route to open map details.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
              <div className="h-[460px]">
                <div className="mb-2 flex items-start gap-2 flex-wrap lg:flex-nowrap">
                  <Input
                    value={placeQuery}
                    onChange={(event) => setPlaceQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handlePlaceSearch();
                      }
                    }}
                    placeholder="Search places on map (e.g. library, metro station, campus gate)"
                    className="h-9 bg-background/70"
                  />
                  <Button size="sm" variant="outline" onClick={handlePlaceSearch} disabled={searchingPlaces}>
                    {searchingPlaces ? "Searching..." : "Search"}
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={() => setExpandMapOpen(true)}>
                    <Maximize2 className="h-3.5 w-3.5" /> Expand
                  </Button>

                  {placeResults.length > 0 && (
                    <div className="w-full rounded-md border border-border/50 bg-card/50 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-semibold">Place Results</h5>
                        <Badge variant="secondary" className="text-[11px]">{placeResults.length} found</Badge>
                      </div>
                      <ScrollArea className="h-[160px] pr-2">
                        <div className="space-y-1.5">
                          {placeResults.map((place) => (
                            <div key={place.id} className="rounded-md border border-border/50 bg-background/70 px-3 py-2 flex items-center justify-between gap-3">
                              <p className="text-xs leading-snug line-clamp-2 flex-1">{place.label}</p>
                              <div className="flex gap-1.5 shrink-0">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2.5 text-xs"
                                  onClick={() => setFocusedPlace({ lat: place.lat, lng: place.lng, token: `${place.id}-${Date.now()}` })}
                                >
                                  View
                                </Button>
                                {mapIsEditable && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2.5 text-xs"
                                    onClick={() => addStopFromPlace(place)}
                                  >
                                    + Stop
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
                <BusRouteMap
                  center={routeMapCenter}
                  routeKey={selectedRouteId ?? "none"}
                  stops={activeStops}
                  routePath={activeRoutePath}
                  focusPoint={focusedPlace}
                  editable={mapIsEditable}
                  addStopMode={addStopMode || Boolean(editingStopId)}
                  selectedStopId={selectedStopId}
                  onMapClick={handleMapAddStop}
                  onStopDrag={handleStopDrag}
                  onSelectStop={setSelectedStopId}
                />

                {/* Expand Map Dialog */}
                <Dialog open={expandMapOpen} onOpenChange={setExpandMapOpen}>
                  <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col">
                    <DialogHeader className="px-4 pt-4 pb-2 border-b border-border/50 shrink-0">
                      <DialogTitle className="text-base flex items-center gap-2">
                        <Bus className="h-4 w-4 text-primary" />
                        {selectedRoute?.routeNumber} · {selectedRoute?.routeName}
                      </DialogTitle>
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        <Input
                          value={placeQuery}
                          onChange={(e) => setPlaceQuery(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handlePlaceSearch(); } }}
                          placeholder="Search places…"
                          className="h-8 text-sm bg-background/70 max-w-xs"
                        />
                        <Button size="sm" variant="outline" onClick={handlePlaceSearch} disabled={searchingPlaces}>
                          {searchingPlaces ? "Searching..." : "Search"}
                        </Button>
                        {mapIsEditable && (
                          <>
                            <Button
                              size="sm"
                              variant={addStopMode ? "default" : "outline"}
                              className="gap-1.5"
                              onClick={() => setAddStopMode((p) => !p)}
                            >
                              <Plus className="h-3.5 w-3.5" /> {addStopMode ? "Adding…" : "Add Stop"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={recalculateRoute} disabled={isRouting || editorStops.length < 2}>
                              {isRouting ? "Routing…" : "Recalculate"}
                            </Button>
                          </>
                        )}
                      </div>
                      {placeResults.length > 0 && (
                        <div className="mt-2 rounded-md border border-border/50 bg-card/50 p-2 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold">Place Results</p>
                            <Badge variant="secondary" className="text-[11px]">{placeResults.length} found</Badge>
                          </div>
                          <ScrollArea className="max-h-[120px] pr-1">
                            <div className="space-y-1">
                              {placeResults.map((place) => (
                                <div key={place.id} className="rounded-md border border-border/40 bg-background/70 px-3 py-1.5 flex items-center justify-between gap-3">
                                  <p className="text-xs leading-snug line-clamp-1 flex-1">{place.label}</p>
                                  <div className="flex gap-1.5 shrink-0">
                                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs"
                                      onClick={() => setFocusedPlace({ lat: place.lat, lng: place.lng, token: `${place.id}-${Date.now()}` })}>
                                      View
                                    </Button>
                                    {mapIsEditable && (
                                      <Button size="sm" variant="outline" className="h-6 px-2 text-xs"
                                        onClick={() => addStopFromPlace(place)}>
                                        + Stop
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden">
                      <BusRouteMap
                        center={routeMapCenter}
                        routeKey={`expand-${selectedRouteId ?? "none"}`}
                        stops={activeStops}
                        routePath={activeRoutePath}
                        focusPoint={focusedPlace}
                        editable={mapIsEditable}
                        addStopMode={addStopMode || Boolean(editingStopId)}
                        selectedStopId={selectedStopId}
                        onMapClick={handleMapAddStop}
                        onStopDrag={handleStopDrag}
                        onSelectStop={setSelectedStopId}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="rounded-xl border border-border/50 bg-card/40 p-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Route Stops</h4>
                  <Badge variant="outline" className="text-[10px]">{activeStops.length}</Badge>
                </div>

                <ScrollArea className="h-[405px] mt-3 pr-2">
                  <div className="space-y-2">
                    {activeStops.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No stops yet. {mapIsEditable ? "Enable Add Stop and click on map." : "Admin can map stops in Edit mode."}</p>
                    ) : (
                      activeStops.map((stop, index) => {
                        const isStopEditing = mapIsEditable && editingStopId === stop.id;
                        return (
                        <div
                          key={stop.id}
                          className={`rounded-lg border p-2.5 space-y-2 ${selectedStopId === stop.id ? "border-primary/50 bg-primary/5" : "border-border/50 bg-background/60"}`}
                          onClick={() => setSelectedStopId(stop.id)}
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="h-5 w-5 p-0 justify-center text-[10px]">{index + 1}</Badge>
                            {isStopEditing ? (
                              <Input
                                value={stopDraft.name}
                                onChange={(event) => setStopDraft((prev) => ({ ...prev, name: event.target.value }))}
                                className="h-7 text-xs"
                              />
                            ) : (
                              <p className="text-xs font-medium truncate">{stop.name}</p>
                            )}
                          </div>

                          {isStopEditing ? (
                            <div className="grid grid-cols-2 gap-1.5">
                              <Input
                                value={stopDraft.lat}
                                onChange={(event) => setStopDraft((prev) => ({ ...prev, lat: event.target.value }))}
                                className="h-7 text-[11px]"
                                placeholder="Latitude"
                              />
                              <Input
                                value={stopDraft.lng}
                                onChange={(event) => setStopDraft((prev) => ({ ...prev, lng: event.target.value }))}
                                className="h-7 text-[11px]"
                                placeholder="Longitude"
                              />
                            </div>
                          ) : (
                            <p className="text-[10px] text-muted-foreground">
                              {stop.lat.toFixed(5)}, {stop.lng.toFixed(5)}
                            </p>
                          )}

                          {mapIsEditable && (
                            <div className="flex items-center gap-1">
                              {isStopEditing ? (
                                <>
                                  <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600" onClick={() => saveStopEdit(stop.id)}>
                                    <Check className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cancelStopEdit}>
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              ) : (
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => startStopEdit(stop)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button size="icon" variant="ghost" className="h-6 w-6" disabled={index === 0} onClick={() => moveStop(stop.id, -1)}>
                                <ArrowUp className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6" disabled={index === activeStops.length - 1} onClick={() => moveStop(stop.id, 1)}>
                                <ArrowDown className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => handleDeleteStop(stop.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>

              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" /> Community Proposals
          </h3>

          <div className="grid gap-3">
            <Dialog open={suggestDialogOpen} onOpenChange={setSuggestDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-20 border-dashed bg-background/40 hover:bg-background/80 flex flex-col gap-1 items-center justify-center">
                  <Plus className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs font-semibold">Suggest a New Shuttle Route</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Route Proposal</DialogTitle>
                  <DialogDescription>Help improve campus connectivity.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label>Proposed Route Name</Label>
                      <Input placeholder="e.g. Shopping Mall Circle" value={suggestionForm.routeName} onChange={(event) => setSuggestionForm({ ...suggestionForm, routeName: event.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Desired Number</Label>
                      <Input placeholder="e.g. S12" value={suggestionForm.routeNumber} onChange={(event) => setSuggestionForm({ ...suggestionForm, routeNumber: event.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Key Stops</Label>
                    <Input placeholder="List main stops..." value={suggestionForm.nextStop} onChange={(event) => setSuggestionForm({ ...suggestionForm, nextStop: event.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Proposed Hours</Label>
                    <Input placeholder="e.g. 7 AM - 10 PM" value={suggestionForm.operatingHours} onChange={(event) => setSuggestionForm({ ...suggestionForm, operatingHours: event.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Why is this route needed?</Label>
                    <Textarea placeholder="Explain the benefit for students..." value={suggestionForm.notes} onChange={(event) => setSuggestionForm({ ...suggestionForm, notes: event.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSuggestRoute} className="w-full" disabled={submittingSuggestion}>
                    {submittingSuggestion ? "Submitting..." : "Submit Proposal"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {!isAdmin && userSuggestions.length > 0 && (
              <div className="space-y-2">
                {userSuggestions.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl border border-border/50 bg-background/40 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">{item.routeName || "Unnamed Route"}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date().toLocaleDateString()}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{item.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {isAdmin && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Admin Desk</h3>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-4">
              <div className="flex items-center gap-2 text-amber-500">
                <Shield className="h-4 w-4" />
                <span className="text-xs font-black uppercase tracking-tighter">Moderation Queue</span>
              </div>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {pendingSuggestions.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground text-center py-8">Inbox is empty.</p>
                  ) : (
                    pendingSuggestions.map((item) => (
                      <div key={item.id} className="p-3 rounded-lg border border-border bg-background shadow-sm space-y-3">
                        <div>
                          <p className="text-xs font-bold">{item.routeName}</p>
                          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{item.notes}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="h-7 px-2 text-[10px] gap-1 bg-green-600 hover:bg-green-700" onClick={() => handleApproveSuggestion(item)}>
                            <Check className="h-3 w-3" /> Approve
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] gap-1 text-destructive" onClick={() => handleRejectSuggestion(item)}>
                            <X className="h-3 w-3" /> Deny
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
