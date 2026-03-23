"use client";

import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, Search, Plus, Trash2, Clock, Check, X, Shield,
  Navigation, Map as MapIcon, RefreshCw, Edit3, Save, GripVertical, Layers, XCircle,
  ZoomIn, ZoomOut, RotateCcw, ImageIcon, Pencil, Undo2, Phone, Globe, Info, Square,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useUserUniversity } from "@/hooks/useUserUniversity";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UtilityService {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  location?: string | null;
  hours?: string | null;
  contact?: string | null;
  website?: string | null;
  mapX?: number | null;
  mapY?: number | null;
}

interface UtilitySuggestion {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  title?: string | null;
  description?: string | null;
  location?: string | null;
  hours?: string | null;
  contact?: string | null;
  website?: string | null;
  mapX?: number | null;
  mapY?: number | null;
  serviceCategory?: string | null;
  notes?: string | null;
  adminNote?: string | null;
  suggestedBy: string;
}

interface PinPosition { x: number; y: number }

type BuildingShapeType =
  | "rectangle"
  | "rounded"
  | "pill"
  | "circle"
  | "ellipse"
  | "diamond"
  | "hexagon"
  | "octagon"
  | "trapezoid"
  | "parallelogram"
  | "star";

interface BuildingShape {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  shape?: BuildingShapeType;
}

const CATEGORY_COLORS: Record<string, string> = {
  Library: "bg-blue-500",
  Lab: "bg-purple-500",
  Cafeteria: "bg-orange-500",
  "Student Union": "bg-green-500",
  Admin: "bg-red-500",
  Health: "bg-rose-500",
  Sports: "bg-cyan-500",
  Finance: "bg-amber-500",
  Parking: "bg-slate-500",
  default: "bg-primary",
};

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  Library: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  Lab: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  Cafeteria: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  "Student Union": "bg-green-500/10 text-green-600 border-green-500/30",
  Admin: "bg-red-500/10 text-red-600 border-red-500/30",
  Health: "bg-rose-500/10 text-rose-600 border-rose-500/30",
  Sports: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30",
  Finance: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  Parking: "bg-slate-500/10 text-slate-600 border-slate-500/30",
  default: "bg-primary/10 text-primary border-primary/30",
};

const getCategoryColor = (cat: string) => CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.default;
const getCategoryBadge = (cat: string) => CATEGORY_BADGE_COLORS[cat] ?? CATEGORY_BADGE_COLORS.default;
const GRID_SNAP = 2; // finer snap for 2% grid
const DEFAULT_BUILDING_SHAPE: BuildingShapeType = "rectangle";

const BUILDING_SHAPE_OPTIONS: Array<{ value: BuildingShapeType; label: string }> = [
  { value: "rectangle", label: "Rectangle" },
  { value: "rounded", label: "Rounded" },
  { value: "pill", label: "Pill" },
  { value: "circle", label: "Circle" },
  { value: "ellipse", label: "Ellipse" },
  { value: "diamond", label: "Diamond" },
  { value: "hexagon", label: "Hexagon" },
  { value: "octagon", label: "Octagon" },
  { value: "trapezoid", label: "Trapezoid" },
  { value: "parallelogram", label: "Parallelogram" },
  { value: "star", label: "Star" },
];

const isBuildingShapeType = (shape: unknown): shape is BuildingShapeType =>
  typeof shape === "string" && BUILDING_SHAPE_OPTIONS.some((option) => option.value === shape);

const normalizeBuildingShape = (building: Partial<BuildingShape>): BuildingShape => ({
  id: typeof building.id === "string" ? building.id : Math.random().toString(36).slice(2),
  x: typeof building.x === "number" ? building.x : 40,
  y: typeof building.y === "number" ? building.y : 40,
  w: typeof building.w === "number" ? building.w : 16,
  h: typeof building.h === "number" ? building.h : 16,
  shape: isBuildingShapeType(building.shape) ? building.shape : DEFAULT_BUILDING_SHAPE,
});

const BUILDING_SHAPE_STYLES: Record<BuildingShapeType, CSSProperties> = {
  rectangle: {},
  rounded: { borderRadius: "18%" },
  pill: { borderRadius: "9999px" },
  circle: { clipPath: "circle(50% at 50% 50%)" },
  ellipse: { clipPath: "ellipse(50% 40% at 50% 50%)" },
  diamond: { clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" },
  hexagon: { clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" },
  octagon: { clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)" },
  trapezoid: { clipPath: "polygon(18% 0%, 82% 0%, 100% 100%, 0% 100%)" },
  parallelogram: { clipPath: "polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)" },
  star: { clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 56%, 79% 91%, 50% 70%, 21% 91%, 32% 56%, 2% 35%, 39% 35%)" },
};

const getBuildingShapeStyle = (shape?: BuildingShapeType): CSSProperties =>
  BUILDING_SHAPE_STYLES[shape ?? DEFAULT_BUILDING_SHAPE] ?? BUILDING_SHAPE_STYLES[DEFAULT_BUILDING_SHAPE];

const emptyServiceForm = { name: "", category: "", description: "", location: "", hours: "", contact: "", website: "" };
const emptySuggestionForm = { title: "", serviceCategory: "", description: "", location: "", hours: "", contact: "", website: "", notes: "" };

export function CampusMap() {
  const { universityId, userId, role, loading: userContextLoading } = useUserUniversity();
  const isAdmin = role === "ADMIN";
  const [hasCampusMapDataColumn, setHasCampusMapDataColumn] = useState(true);

  // Refs
  const mapRef = useRef<HTMLDivElement>(null);
  const cancelEditModeRef = useRef<() => void>(() => {});
  const saveLayoutRef = useRef<() => void>(() => {});

  // Core data
  const [services, setServices] = useState<UtilityService[]>([]);
  const [dbBuildings, setDbBuildings] = useState<BuildingShape[]>([]);
  const [dbServiceShapes, setDbServiceShapes] = useState<Map<string, BuildingShapeType>>(new Map());
  const [pendingSuggestions, setPendingSuggestions] = useState<UtilitySuggestion[]>([]);
  const [userSuggestions, setUserSuggestions] = useState<UtilitySuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  // Dialogs
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [suggestDialogOpen, setSuggestDialogOpen] = useState(false);
  const [editServiceDialogOpen, setEditServiceDialogOpen] = useState(false);
  const [bgDialogOpen, setBgDialogOpen] = useState(false);

  // Form state
  const [submittingService, setSubmittingService] = useState(false);
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [serviceForm, setServiceForm] = useState(emptyServiceForm);
  const [suggestionForm, setSuggestionForm] = useState(emptySuggestionForm);
  const [editServiceForm, setEditServiceForm] = useState(emptyServiceForm);
  const [editingService, setEditingService] = useState<UtilityService | null>(null);

  // Layout-editor state
  const [isEditMode, setIsEditMode] = useState(false);
  const [localPositions, setLocalPositions] = useState<Map<string, PinPosition | null>>(new Map<string, PinPosition | null>());
  const [localBuildings, setLocalBuildings] = useState<BuildingShape[]>([]);
  const [localServiceShapes, setLocalServiceShapes] = useState<Map<string, BuildingShapeType>>(new Map());
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Drag state unifying pins and buildings
  const [dragState, setDragState] = useState<{
     type: 'pin' | 'building' | 'resize';
     id: string;
     startX: number;
     startY: number;
     origX: number;
     origY: number;
     origW?: number;
     origH?: number;
  } | null>(null);

  const [draggingFromListId, setDraggingFromListId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<PinPosition | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [history, setHistory] = useState<Array<{ pos: Map<string, PinPosition | null>, bld: BuildingShape[]; svcShapes: Map<string, BuildingShapeType> }>>([]);

  // Zoom / Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ mx: number; my: number; px: number; py: number } | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);

  // Category filter
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set<string>());

  // Map background
  const [mapBgUrl, setMapBgUrl] = useState("");
  const [bgUrlInput, setBgUrlInput] = useState("");
  const [bgFileName, setBgFileName] = useState("");

  //  Coord conversion 
  const screenToCanvas = useCallback((clientX: number, clientY: number): PinPosition => {
    const rect = mapRef.current!.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    const cX = (clientX - rect.left - W / 2 - pan.x) / zoom + W / 2;
    const cY = (clientY - rect.top - H / 2 - pan.y) / zoom + H / 2;
    let x = Math.max(2, Math.min(98, (cX / W) * 100));
    let y = Math.max(2, Math.min(98, (cY / H) * 100));
    if (snapToGrid) {
      x = Math.round(x / GRID_SNAP) * GRID_SNAP;
      y = Math.round(y / GRID_SNAP) * GRID_SNAP;
    }
    return { x, y };
  }, [zoom, pan, snapToGrid]);

  const getEffectivePosition = useCallback((svc: UtilityService): PinPosition | null => {
    if (localPositions.has(svc.id)) return localPositions.get(svc.id) ?? null;
    if (svc.mapX != null && svc.mapY != null) return { x: svc.mapX, y: svc.mapY };
    return null;
  }, [localPositions]);

  const getServiceShape = useCallback((serviceId: string): BuildingShapeType => {
    if (localServiceShapes.has(serviceId)) return localServiceShapes.get(serviceId) ?? DEFAULT_BUILDING_SHAPE;
    if (dbServiceShapes.has(serviceId)) return dbServiceShapes.get(serviceId) ?? DEFAULT_BUILDING_SHAPE;
    return DEFAULT_BUILDING_SHAPE;
  }, [localServiceShapes, dbServiceShapes]);

  //  Data loading 
  const loadServices = useCallback(async () => {
    if (!universityId) return;
    setLoading(true);
    const [svcRes, uniRes] = await Promise.all([
      supabase.from("UtilityService").select("*").eq("universityId", universityId).order("createdAt", { ascending: false }),
      supabase.from("University").select("campusMapData").eq("id", universityId).single()
    ]);
    
    if (svcRes.error) toast.error("Failed to load campus services.");
    else setServices(svcRes.data ?? []);

     if (uniRes.error && `${uniRes.error.message ?? ""}`.includes("campusMapData")) {
       setHasCampusMapDataColumn(false);
     }

     if (!uniRes.error && uniRes.data) {
       setHasCampusMapDataColumn(true);
       const mapData = uniRes.data.campusMapData ?? {};
       const b = Array.isArray(mapData?.buildings) ? mapData.buildings : [];
       const rawServiceShapes = mapData && typeof mapData === "object" && mapData.serviceShapes && typeof mapData.serviceShapes === "object"
        ? mapData.serviceShapes as Record<string, unknown>
        : {};
       const nextServiceShapes = new Map<string, BuildingShapeType>();
       Object.entries(rawServiceShapes).forEach(([serviceId, shape]) => {
        if (isBuildingShapeType(shape)) nextServiceShapes.set(serviceId, shape);
       });
       setDbBuildings(b.map((item: Partial<BuildingShape>) => normalizeBuildingShape(item)));
       setDbServiceShapes(nextServiceShapes);
    }
    setLoading(false);
  }, [universityId]);

  const loadSuggestions = useCallback(async () => {
    if (!universityId || !userId) return;
    if (isAdmin) {
      const { data } = await supabase.from("UtilitySuggestion").select("*")
        .eq("universityId", universityId).eq("category", "SERVICE").eq("status", "PENDING")
        .order("createdAt", { ascending: false });
      setPendingSuggestions(data ?? []);
    } else {
      const { data } = await supabase.from("UtilitySuggestion").select("*")
        .eq("suggestedBy", userId).eq("category", "SERVICE")
        .order("createdAt", { ascending: false });
      setUserSuggestions(data ?? []);
    }
  }, [universityId, userId, isAdmin]);

  useEffect(() => {
    if (!universityId) return;
    loadServices();
    loadSuggestions();
  }, [universityId, userId, role, loadServices, loadSuggestions]);

  useEffect(() => {
    if (!isEditMode) {
      setLocalBuildings(dbBuildings.map((building) => ({ ...building })));
      setLocalServiceShapes(new Map(dbServiceShapes));
    }
  }, [dbBuildings, dbServiceShapes, isEditMode]);

  useEffect(() => {
    if (!universityId) return;
    const saved = localStorage.getItem(`campusmap_bg_${universityId}`);
    if (saved) { setMapBgUrl(saved); setBgUrlInput(saved); }
  }, [universityId]);

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([loadServices(), loadSuggestions()]);
    setRefreshing(false);
  };

  //  History (undo) 
  const pushHistory = useCallback(() => {
    setHistory(h => [...h.slice(-19), {
      pos: new Map(localPositions),
      bld: localBuildings.map(b => ({...b})),
      svcShapes: new Map(localServiceShapes),
    }]);
  }, [localPositions, localBuildings, localServiceShapes]);

  const handleUndo = useCallback(() => {
    setHistory(h => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setLocalPositions(prev.pos);
      setLocalBuildings(prev.bld);
      setLocalServiceShapes(prev.svcShapes);
      setHasUnsavedChanges(true);
      toast("Undo", { description: "Last change reversed." });
      return h.slice(0, -1);
    });
  }, []);

  //  Edit mode lifecycle 
  const enterEditMode = () => {
    setLocalPositions(new Map<string, PinPosition | null>());
    setLocalBuildings(dbBuildings.map(b => ({...b})));
    setLocalServiceShapes(new Map(dbServiceShapes));
    setHistory([]);
    setHasUnsavedChanges(false);
    setIsEditMode(true);
  };

  const cancelEditMode = useCallback(() => {
    setLocalPositions(new Map<string, PinPosition | null>());
    setLocalBuildings(dbBuildings.map((building) => ({ ...building })));
    setLocalServiceShapes(new Map(dbServiceShapes));
    setHistory([]);
    setHasUnsavedChanges(false);
    setDragState(null);
    setDropIndicator(null);
    setDraggingFromListId(null);
    setIsEditMode(false);
  }, [dbBuildings, dbServiceShapes]);

  const saveLayout = useCallback(async () => {
    if (!hasUnsavedChanges) { setIsEditMode(false); return; }
    setIsSavingLayout(true);
    
    // Save points
    const updates: Array<{ id: string; x: number | null; y: number | null }> = [];
    localPositions.forEach((pos, id) => updates.push({ id, x: pos?.x ?? null, y: pos?.y ?? null }));
    const results = await Promise.all(
      updates.map(({ id, x, y }) =>
        supabase.from("UtilityService").update({ mapX: x, mapY: y }).eq("id", id)
      )
    );
    
    // Save shadow boxes (if schema column exists)
    let uniError: { message?: string } | null = null;
    if (hasCampusMapDataColumn) {
      const uniRes = await supabase.from("University").update({
        campusMapData: {
          buildings: localBuildings,
          serviceShapes: Object.fromEntries(localServiceShapes),
        }
      }).eq("id", universityId);
      if (uniRes.error) uniError = uniRes.error;
    }

    const failed = results.filter(r => r.error);
    if (failed.length > 0 || uniError) toast.error("Some updates failed to save.");
    else if (!hasCampusMapDataColumn) toast.success("Map layout saved. Building shapes are disabled until schema is synced.");
    else toast.success("Map layout and buildings saved.");
    
    setIsSavingLayout(false);
    setIsEditMode(false);
    setLocalPositions(new Map<string, PinPosition | null>());
    setDbBuildings(localBuildings);
    setDbServiceShapes(new Map(localServiceShapes));
    setHistory([]);
    setHasUnsavedChanges(false);
    loadServices();
  }, [hasUnsavedChanges, localPositions, localBuildings, localServiceShapes, universityId, loadServices, hasCampusMapDataColumn]);

  cancelEditModeRef.current = cancelEditMode;
  saveLayoutRef.current = saveLayout;

  //  Keyboard shortcuts 
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const inInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (e.code === "Space" && isEditMode && !inInput) { e.preventDefault(); setSpaceHeld(true); }
      if (e.key === "Escape" && isEditMode) cancelEditModeRef.current();
      if (e.ctrlKey && e.key === "s" && isEditMode) { e.preventDefault(); saveLayoutRef.current(); }
      if (e.ctrlKey && e.key === "z" && isEditMode) { e.preventDefault(); handleUndo(); }
    };
    const onKeyUp = (e: KeyboardEvent) => { if (e.code === "Space") setSpaceHeld(false); };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => { window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); };
  }, [isEditMode, handleUndo]);

  //  Zoom / Pan 
  const adjustZoom = useCallback((delta: number) =>
    setZoom(prev => Math.max(0.4, Math.min(3, Math.round((prev + delta) * 10) / 10))), []);

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    adjustZoom(e.deltaY > 0 ? -0.1 : 0.1);
  }, [adjustZoom]);

  useEffect(() => {
    const mapElement = mapRef.current;
    if (!mapElement) return;
    mapElement.addEventListener("wheel", handleWheel, { passive: false });
    return () => mapElement.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const handleViewportMouseDown = useCallback((e: React.MouseEvent) => {
    if (dragState) return;
    const canPan = e.button === 1
      || (!isEditMode && e.button === 0)
      || (isEditMode && spaceHeld && e.button === 0);
    if (!canPan) return;
    e.preventDefault();
    setIsPanning(true);
    setPanStart({ mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y });
  }, [dragState, isEditMode, spaceHeld, pan]);

  useEffect(() => {
    if (!isPanning || !panStart) return;
    const onMove = (e: MouseEvent) => {
      setPan({ x: panStart.px + (e.clientX - panStart.mx), y: panStart.py + (e.clientY - panStart.my) });
    };
    const onUp = () => { setIsPanning(false); setPanStart(null); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [isPanning, panStart]);

  //  Unified Drag & Resize 
  const handleEntityMouseDown = useCallback((e: React.MouseEvent, type: 'pin' | 'building' | 'resize', id: string) => {
    if (!isEditMode || !mapRef.current || spaceHeld) return;
    e.preventDefault();
    e.stopPropagation();

    let origX = 0, origY = 0, origW = 0, origH = 0;
    if (type === 'pin') {
      const svc = services.find(s => s.id === id);
      const pos = getEffectivePosition(svc!);
      origX = pos!.x; origY = pos!.y;
    } else {
      const b = localBuildings.find(x => x.id === id)!;
      origX = b.x; origY = b.y; origW = b.w; origH = b.h;
    }

    pushHistory();
    setDragState({ type, id, startX: e.clientX, startY: e.clientY, origX, origY, origW, origH });
  }, [isEditMode, spaceHeld, services, localBuildings, getEffectivePosition, pushHistory]);

  useEffect(() => {
    if (!dragState || !isEditMode || !mapRef.current) return;
    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const rect = mapRef.current!.getBoundingClientRect();
      const W = rect.width; const H = rect.height;
      const deltaX_pct = ((e.clientX - dragState.startX) / zoom / W) * 100;
      const deltaY_pct = ((e.clientY - dragState.startY) / zoom / H) * 100;

      let newX = dragState.origX + deltaX_pct;
      let newY = dragState.origY + deltaY_pct;

      if (snapToGrid) {
         newX = Math.round(newX / GRID_SNAP) * GRID_SNAP;
         newY = Math.round(newY / GRID_SNAP) * GRID_SNAP;
      }

      if (dragState.type === 'pin') {
         newX = Math.max(2, Math.min(98, newX));
         newY = Math.max(2, Math.min(98, newY));
         setLocalPositions(prev => { const n = new Map(prev); n.set(dragState.id, { x: newX, y: newY }); return n; });
      } else if (dragState.type === 'building') {
         newX = Math.max(0, Math.min(100 - dragState.origW!, newX));
         newY = Math.max(0, Math.min(100 - dragState.origH!, newY));
         setLocalBuildings(prev => prev.map(b => b.id === dragState.id ? { ...b, x: newX, y: newY } : b));
      } else if (dragState.type === 'resize') {
         let newW = dragState.origW! + deltaX_pct;
         let newH = dragState.origH! + deltaY_pct;
         if (snapToGrid) {
             newW = Math.round(newW / GRID_SNAP) * GRID_SNAP;
             newH = Math.round(newH / GRID_SNAP) * GRID_SNAP;
         }
         newW = Math.max(2, Math.min(100 - dragState.origX, newW));
         newH = Math.max(2, Math.min(100 - dragState.origY, newH));
         setLocalBuildings(prev => prev.map(b => b.id === dragState.id ? { ...b, w: newW, h: newH } : b));
      }
      setHasUnsavedChanges(true);
    };
    const onMouseUp = () => setDragState(null);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, [dragState, isEditMode, zoom, snapToGrid]);

  //  HTML5 drag-from-list 
  const handleListDragStart = (e: React.DragEvent, svcId: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("serviceId", svcId);
    setDraggingFromListId(svcId);
    pushHistory();
  };
  const handleListDragEnd = () => { setDraggingFromListId(null); setDropIndicator(null); };

  const handleMapDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!mapRef.current) return;
    setDropIndicator(screenToCanvas(e.clientX, e.clientY));
  };

  const handleMapDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const svcId = e.dataTransfer.getData("serviceId");
    if (!svcId || !mapRef.current) return;
    const pos = screenToCanvas(e.clientX, e.clientY);
    setLocalPositions(prev => { const n = new Map(prev); n.set(svcId, pos); return n; });
    setLocalServiceShapes(prev => {
      if (prev.has(svcId)) return prev;
      const n = new Map(prev);
      n.set(svcId, DEFAULT_BUILDING_SHAPE);
      return n;
    });
    setHasUnsavedChanges(true);
    setDropIndicator(null);
    setDraggingFromListId(null);
  };

  const handleRemoveFromMap = (svcId: string) => {
    pushHistory();
    setLocalPositions(prev => { const n = new Map(prev); n.set(svcId, null); return n; });
    setLocalServiceShapes(prev => {
      const n = new Map(prev);
      n.delete(svcId);
      return n;
    });
    setHasUnsavedChanges(true);
  };

  //  Shadow Blocks 
  const handleAddBuilding = () => {
    pushHistory();
    setLocalBuildings(prev => [...prev, {
      id: Math.random().toString(36).slice(2),
      x: 40,
      y: 40,
      w: 16,
      h: 16,
      shape: DEFAULT_BUILDING_SHAPE,
    }]);
    setHasUnsavedChanges(true);
  };

  const handleDeleteBuilding = (id: string) => {
    pushHistory();
    setLocalBuildings(prev => prev.filter(b => b.id !== id));
    setHasUnsavedChanges(true);
  };

  const handleBuildingShapeChange = (id: string, shape: BuildingShapeType) => {
    pushHistory();
    setLocalBuildings(prev => prev.map(b => b.id === id ? { ...b, shape } : b));
    setHasUnsavedChanges(true);
  };

  const handleServiceShapeChange = (id: string, shape: BuildingShapeType) => {
    pushHistory();
    setLocalServiceShapes(prev => {
      const n = new Map(prev);
      n.set(id, shape);
      return n;
    });
    setHasUnsavedChanges(true);
  };

  //  Category filter 
  const toggleCategory = (cat: string) => {
    setHiddenCategories(prev => {
      const n = new Set(prev);
      if (n.has(cat)) n.delete(cat); else n.add(cat);
      return n;
    });
  };

  //  Map background 
  const saveBgUrl = () => {
    if (!universityId) return;
    const url = bgUrlInput.trim();
    if (url) {
      try {
        localStorage.setItem(`campusmap_bg_${universityId}`, url);
      } catch {
        toast.error("Background is too large to store locally. Try a smaller image.");
        return;
      }
      setMapBgUrl(url);
      toast.success("Map background updated.");
    }
    setBgDialogOpen(false);
  };
  const removeBgUrl = () => {
    if (!universityId) return;
    localStorage.removeItem(`campusmap_bg_${universityId}`);
    setMapBgUrl("");
    setBgUrlInput("");
    setBgFileName("");
    setBgDialogOpen(false);
    toast.success("Background removed.");
  };

  const handleBackgroundFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        toast.error("Could not read selected image.");
        return;
      }
      setBgUrlInput(reader.result);
      setBgFileName(file.name);
    };
    reader.onerror = () => {
      toast.error("Could not read selected image.");
    };
    reader.readAsDataURL(file);
  };

  //  CRUD 
  const handleCreateService = async () => {
    if (!universityId) return;
    if (!serviceForm.name || !serviceForm.category) { toast.error("Name and category are required."); return; }
    setSubmittingService(true);
    const { error } = await supabase.from("UtilityService").insert({
      universityId, ...serviceForm,
      description: serviceForm.description || null, location: serviceForm.location || null,
      hours: serviceForm.hours || null, contact: serviceForm.contact || null,
      website: serviceForm.website || null, mapX: null, mapY: null,
    });
    if (error) toast.error("Failed to add service.");
    else { toast.success("Service added — place it on the map in Edit Mode."); setServiceForm(emptyServiceForm); setServiceDialogOpen(false); loadServices(); }
    setSubmittingService(false);
  };

  const handleDeleteService = async (id: string) => {
    const { error } = await supabase.from("UtilityService").delete().eq("id", id);
    if (error) toast.error("Failed to remove service.");
    else { toast.success("Service removed."); if (selectedServiceId === id) setSelectedServiceId(null); loadServices(); }
  };

  const openEditService = (svc: UtilityService) => {
    setEditingService(svc);
    setEditServiceForm({
      name: svc.name, category: svc.category,
      description: svc.description ?? "", location: svc.location ?? "",
      hours: svc.hours ?? "", contact: svc.contact ?? "", website: svc.website ?? "",
    });
    setEditServiceDialogOpen(true);
  };

  const handleSaveServiceEdit = async () => {
    if (!editingService) return;
    setSavingEdit(true);
    const { error } = await supabase.from("UtilityService").update({
      name: editServiceForm.name, category: editServiceForm.category,
      description: editServiceForm.description || null, location: editServiceForm.location || null,
      hours: editServiceForm.hours || null, contact: editServiceForm.contact || null,
      website: editServiceForm.website || null,
    }).eq("id", editingService.id);
    if (error) toast.error("Failed to update service.");
    else { toast.success("Service updated."); setEditServiceDialogOpen(false); setEditingService(null); loadServices(); }
    setSavingEdit(false);
  };

  const handleSuggestService = async () => {
    if (!universityId || !userId) return;
    if (!suggestionForm.title) { toast.error("Suggestion title is required."); return; }
    setSubmittingSuggestion(true);
    const { error } = await supabase.from("UtilitySuggestion").insert({
      universityId, suggestedBy: userId, category: "SERVICE",
      title: suggestionForm.title, serviceCategory: suggestionForm.serviceCategory || null,
      description: suggestionForm.description || null, location: suggestionForm.location || null,
      hours: suggestionForm.hours || null, contact: suggestionForm.contact || null,
      website: suggestionForm.website || null, mapX: null, mapY: null, notes: suggestionForm.notes || null,
    });
    if (error) toast.error("Failed to submit suggestion.");
    else { toast.success("Suggestion sent."); setSuggestionForm(emptySuggestionForm); setSuggestDialogOpen(false); loadSuggestions(); }
    setSubmittingSuggestion(false);
  };

  const handleApproveSuggestion = async (s: UtilitySuggestion) => {
    if (!universityId) return;
    const { error } = await supabase.from("UtilityService").insert({
      universityId, name: s.title ?? "Service", category: s.serviceCategory ?? "General",
      description: s.description ?? null, location: s.location ?? null,
      hours: s.hours ?? null, contact: s.contact ?? null, website: s.website ?? null,
      mapX: null, mapY: null,
    });
    if (error) { toast.error("Failed to approve suggestion."); return; }
    await supabase.from("UtilitySuggestion").update({ status: "APPROVED" }).eq("id", s.id);
    toast.success("Approved — place it on the map using Edit Mode.");
    loadServices(); loadSuggestions();
  };

  const handleRejectSuggestion = async (s: UtilitySuggestion) => {
    const adminNote = window.prompt("Optional rejection note") || null;
    await supabase.from("UtilitySuggestion").update({ status: "REJECTED", adminNote }).eq("id", s.id);
    toast.success("Suggestion rejected."); loadSuggestions();
  };

  //  Derived state 
  const allCategories = useMemo(() => Array.from(new Set(services.map(s => s.category))).sort(), [services]);

  const filteredServices = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return services.filter(s => {
      if (hiddenCategories.has(s.category)) return false;
      if (!q) return true;
      return `${s.name} ${s.category} ${s.location ?? ""} ${s.description ?? ""}`.toLowerCase().includes(q);
    });
  }, [services, searchTerm, hiddenCategories]);

  const mapPins = useMemo(() =>
    filteredServices
      .map(s => ({ service: s, pos: getEffectivePosition(s) }))
      .filter((p): p is { service: UtilityService; pos: PinPosition } => p.pos !== null),
    [filteredServices, getEffectivePosition]);

  const selectedService = useMemo(() => services.find(s => s.id === selectedServiceId) ?? null, [services, selectedServiceId]);
  const placedCount = useMemo(() => filteredServices.filter(s => getEffectivePosition(s) !== null).length, [filteredServices, getEffectivePosition]);
  const unplacedCount = useMemo(() => filteredServices.filter(s => getEffectivePosition(s) === null).length, [filteredServices, getEffectivePosition]);

  const canvasTransform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;

  if (!userContextLoading && !universityId) {
    return (
      <Card className="border-none shadow-xl bg-background/60 backdrop-blur-md overflow-hidden">
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          Add your university in your profile to use Campus Map services.
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className={cn(
        "border-none shadow-xl bg-background/60 backdrop-blur-md overflow-hidden transition-all duration-300",
        isEditMode && "ring-2 ring-primary/40 shadow-primary/10"
      )}>
        {/*  Header  */}
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Navigation className="h-6 w-6 text-primary" />
                Interactive Campus Map
                {isEditMode && (
                  <Badge className="ml-2 bg-primary/15 text-primary border border-primary/30 gap-1.5 text-xs font-semibold animate-pulse">
                    <Edit3 className="h-3 w-3" /> Layout Mode
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {isEditMode
                  ? "Drag services or draw shadow boxes for buildings. Space+drag to pan. Scroll to zoom."
                  : "Locate essential services, labs, and student hubs across campus. Click any pin for details."}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {isAdmin && isEditMode ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/50 border border-border/50">
                    <Switch id="snap" checked={snapToGrid} onCheckedChange={setSnapToGrid} />
                    <Label htmlFor="snap" className="text-xs font-medium cursor-pointer select-none">Snap</Label>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" onClick={handleAddBuilding} className="gap-1.5 flex items-center border-dashed">
                        <Square className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Add Box</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Draw a shadow box building on the map</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" onClick={handleUndo} disabled={history.length === 0} className="gap-1.5">
                        <Undo2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Undo</span>
                        {history.length > 0 && <Badge variant="secondary" className="text-[9px] h-4 min-w-4 px-1 shrink-0">{history.length}</Badge>}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Undo last change (Ctrl+Z)</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => setBgDialogOpen(true)} className="gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span className="hidden lg:inline">Background</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Set map image</TooltipContent>
                  </Tooltip>
                  <Button size="sm" variant="outline" onClick={cancelEditMode} className="gap-2">
                    <XCircle className="h-4 w-4" /> Cancel
                  </Button>
                  <Button
                    size="sm" onClick={saveLayout} disabled={isSavingLayout}
                    className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-500/20"
                  >
                    <Save className="h-4 w-4" />
                    {isSavingLayout ? "Saving" : "Save Layout"}
                    {hasUnsavedChanges && <span className="h-1.5 w-1.5 bg-white rounded-full animate-ping" />}
                  </Button>
                </>
              ) : (
                <>
                  {isAdmin && (
                    <>
                      <Button size="sm" variant="outline" onClick={enterEditMode}
                        className="gap-2 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50">
                        <Layers className="h-4 w-4" /> Edit Map
                      </Button>
                      <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Add Service</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Add campus service</DialogTitle>
                            <DialogDescription>Visible to all students. Place it on the map using Edit Mode.</DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-3 py-2">
                            {(["name", "category", "location", "hours", "contact", "website"] as const).map(key => (
                              <div key={key} className="grid gap-2">
                                <Label className="capitalize">{key === "category" ? "Category (e.g. Library, Health)" : key}</Label>
                                <Input value={serviceForm[key]} onChange={e => setServiceForm({ ...serviceForm, [key]: e.target.value })} />
                              </div>
                            ))}
                            <div className="grid gap-2">
                              <Label>Description</Label>
                              <Textarea value={serviceForm.description} onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })} />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleCreateService} disabled={submittingService}>
                              {submittingService ? "Saving" : "Save Service"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                  <Button size="sm" variant="outline" className="gap-2" onClick={refreshAll} disabled={refreshing}>
                    <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                  <div className="relative w-full max-w-[200px]">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Find building" className="pl-8 h-8 text-xs bg-background/50"
                      value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/*  Category filter chips  */}
          {!isEditMode && allCategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-3">
              {allCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all duration-150",
                    hiddenCategories.has(cat)
                      ? "bg-muted/20 text-muted-foreground/50 border-border/20 line-through"
                      : getCategoryBadge(cat)
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", getCategoryColor(cat))} />
                  {cat}
                </button>
              ))}
              {hiddenCategories.size > 0 && (
                <button
                  onClick={() => setHiddenCategories(new Set<string>())}
                  className="text-[11px] text-primary/70 hover:text-primary px-1.5 underline underline-offset-2"
                >
                  Show all
                </button>
              )}
            </div>
          )}
        </CardHeader>

        {/*  Body  */}
        <CardContent className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_350px] p-0 overflow-hidden rounded-b-xl">

          {/*  Map viewport  */}
          <div
            ref={mapRef}
            className={cn(
              "relative min-h-[520px] overflow-hidden",
              isEditMode
                ? (spaceHeld ? "cursor-grab" : "cursor-crosshair")
                : (isPanning ? "cursor-grabbing" : "cursor-default"),
              isPanning && "select-none",
              "bg-muted/10",
            )}
            onMouseDown={handleViewportMouseDown}
            onDragOver={isEditMode ? handleMapDragOver : undefined}
            onDrop={isEditMode ? handleMapDrop : undefined}
            onDragLeave={() => setDropIndicator(null)}
          >
            {/*  Inner transformable canvas  */}
            <div
              className="absolute inset-0"
              style={{ transform: canvasTransform, transformOrigin: "50% 50%", willChange: "transform" }}
            >
              {/* Image Background */}
              {mapBgUrl && (
                <img
                  src={mapBgUrl} alt="Campus map"
                  className={cn("absolute inset-0 w-full h-full object-cover pointer-events-none",
                    isEditMode ? "opacity-55" : "opacity-85")}
                  draggable={false}
                />
              )}

              {/* Grid Background */}
              {!mapBgUrl && (
                <div
                  className={cn("absolute inset-0 pointer-events-none transition-opacity", isEditMode ? "opacity-[0.10]" : "opacity-[0.04]")}
                  style={{
                    backgroundImage: "linear-gradient(to right, currentColor 1px, transparent 1px),linear-gradient(to bottom, currentColor 1px, transparent 1px)",
                    backgroundSize: "30px 30px",
                  }}
                />
              )}

              {/* Edit mode border */}
              {isEditMode && (
                <div className="absolute inset-2 border-2 border-dashed border-primary/30 rounded-xl pointer-events-none z-10" />
              )}

              {/* Snap grid overlay */}
              {isEditMode && snapToGrid && (
                <div
                  className="absolute inset-0 pointer-events-none opacity-[0.07] z-[5]"
                  style={{
                    backgroundImage: "linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px),linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)",
                    backgroundSize: "2% 2%",
                  }}
                />
              )}

              {/* Default Abstract Shapes (only if no map image and no custom buildings exist) */}
              {!mapBgUrl && dbBuildings.length === 0 && localBuildings.length === 0 && !hasUnsavedChanges && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.07]" aria-hidden="true">
                  <rect x="8%" y="8%" width="22%" height="14%" rx="10" fill="currentColor" />
                  <rect x="38%" y="13%" width="16%" height="26%" rx="10" fill="currentColor" />
                  <rect x="63%" y="8%" width="28%" height="22%" rx="10" fill="currentColor" />
                  <rect x="8%" y="55%" width="18%" height="20%" rx="10" fill="currentColor" />
                  <rect x="65%" y="55%" width="22%" height="18%" rx="10" fill="currentColor" />
                  <circle cx="50%" cy="55%" r="45" fill="currentColor" />
                  <path d="M 0 88 Q 300 72 600 88 T 1200 82" stroke="currentColor" strokeWidth="18" fill="none" opacity="0.5" />
                </svg>
              )}

              {/* Custom Shadow Box Buildings */}
              {localBuildings.map((b) => {
                const isDragging = dragState?.type === 'building' && dragState.id === b.id;
                const isResizing = dragState?.type === 'resize' && dragState.id === b.id;
                const currentShape = b.shape ?? DEFAULT_BUILDING_SHAPE;
                
                return (
                  <div
                    key={b.id}
                    className={cn(
                      "absolute group overflow-visible",
                      (isDragging || isResizing) && "z-30",
                      !isEditMode && "pointer-events-none"
                    )}
                    style={{
                      left: `${b.x}%`,
                      top: `${b.y}%`,
                      width: `${b.w}%`,
                      height: `${b.h}%`,
                      cursor: isEditMode ? (isDragging ? "grabbing" : "grab") : "default",
                      transition: dragState ? "none" : "all 0.15s ease",
                    }}
                    onMouseDown={isEditMode ? (e) => handleEntityMouseDown(e, 'building', b.id) : undefined}
                  >
                    <div
                      className={cn(
                        "absolute inset-0 border",
                        isEditMode ? "bg-foreground/5 border-foreground/15 hover:border-primary/50" : "bg-foreground/10 border-transparent",
                        (isDragging || isResizing) && "border-primary bg-primary/10",
                      )}
                      style={getBuildingShapeStyle(currentShape)}
                    />
                     {isEditMode && !isDragging && !isResizing && (
                       <>
                         <div
                           className="absolute -top-8 left-0 z-20"
                           onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                           onClick={(e) => e.stopPropagation()}
                         >
                           <Select
                             value={currentShape}
                             onValueChange={(value) => handleBuildingShapeChange(b.id, value as BuildingShapeType)}
                           >
                             <SelectTrigger className="h-6 min-w-[130px] px-2 text-[10px] bg-background/95 border-border/80 shadow-sm">
                               <SelectValue placeholder="Shape" />
                             </SelectTrigger>
                             <SelectContent>
                               {BUILDING_SHAPE_OPTIONS.map((shapeOption) => (
                                 <SelectItem key={shapeOption.value} value={shapeOption.value}>
                                   {shapeOption.label}
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                         </div>
                         <button
                           className="absolute -top-2.5 -right-2.5 h-5 w-5 bg-destructive text-white rounded-full
                                      flex items-center justify-center opacity-0 group-hover:opacity-100
                                      transition-all scale-90 group-hover:scale-100 shadow-xl z-20"
                           onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                           onClick={(e) => { e.stopPropagation(); handleDeleteBuilding(b.id); }}
                           title="Remove box"
                         >
                           <X className="h-3 w-3" />
                         </button>
                         <div
                           className="absolute -bottom-2 -right-2 h-4 w-4 bg-background border-2 border-primary rounded-full
                                      cursor-nwse-resize opacity-0 group-hover:opacity-100 shadow-md transition-opacity z-20"
                           onMouseDown={(e) => handleEntityMouseDown(e, 'resize', b.id)}
                           title="Resize box"
                         />
                       </>
                     )}
                  </div>
                );
              })}

              {/* Drop indicator */}
              {isEditMode && dropIndicator && (
                <div
                  className="absolute z-40 pointer-events-none"
                  style={{ top: `${dropIndicator.y}%`, left: `${dropIndicator.x}%`, transform: "translate(-50%,-50%)" }}
                >
                  <div className="h-12 w-12 rounded-full border-2 border-dashed border-primary opacity-70 animate-ping" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-3 w-3 bg-primary rounded-full" />
                  </div>
                </div>
              )}

              {/* Pins */}
              {mapPins.map(({ service, pos }) => {
                const isDraggingPin = dragState?.type === 'pin' && dragState.id === service.id;
                const colorClass = getCategoryColor(service.category);
                const isSelected = selectedServiceId === service.id;
                const serviceShape = getServiceShape(service.id);
                return (
                  <div
                    key={service.id}
                    className={cn(
                      "absolute group z-40",
                      !isDraggingPin && "transition-[top,left] duration-75",
                      isEditMode ? "hover:z-50" : "hover:z-50",
                      isDraggingPin && "z-[60]",
                    )}
                    style={{
                      top: `${pos.y}%`,
                      left: `${pos.x}%`,
                      transform: `translate(-50%,-50%) scale(${isDraggingPin ? 1.25 : isSelected ? 1.15 : 1})`,
                      cursor: isEditMode ? (isDraggingPin ? "grabbing" : "grab") : "pointer",
                      userSelect: "none",
                      willChange: isDraggingPin ? "transform,top,left" : "auto",
                      transition: isDraggingPin ? "none" : undefined,
                    }}
                    onMouseDown={isEditMode ? e => handleEntityMouseDown(e, 'pin', service.id) : undefined}
                    onClick={!isEditMode ? e => { e.stopPropagation(); setSelectedServiceId(prev => prev === service.id ? null : service.id); } : undefined}
                  >
                    {/* Pulse */}
                    {!isDraggingPin && (
                      <div className={cn(
                        "absolute -inset-2 opacity-20 transition-opacity",
                        isSelected ? "animate-pulse opacity-40" : "animate-[pulse_3s_ease-in-out_infinite]",
                        colorClass
                      )} style={getBuildingShapeStyle(serviceShape)} />
                    )}

                    {/* Circle */}
                    <div className={cn(
                      "relative h-9 w-9 flex items-center justify-center text-white shadow-lg ring-2 transition-all duration-150",
                      colorClass,
                      isDraggingPin && "shadow-2xl ring-white/70 scale-110",
                      isSelected && !isEditMode && "ring-white shadow-xl",
                      !isSelected && !isDraggingPin && "ring-white/20 group-hover:ring-white/60",
                    )} style={getBuildingShapeStyle(serviceShape)}>
                      {isEditMode ? <GripVertical className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                    </div>

                    {isEditMode && !isDraggingPin && (
                      <div
                        className="absolute -top-8 left-1/2 -translate-x-1/2 z-20"
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Select
                          value={serviceShape}
                          onValueChange={(value) => handleServiceShapeChange(service.id, value as BuildingShapeType)}
                        >
                          <SelectTrigger className="h-6 min-w-[120px] px-2 text-[10px] bg-background/95 border-border/80 shadow-sm">
                            <SelectValue placeholder="Shape" />
                          </SelectTrigger>
                          <SelectContent>
                            {BUILDING_SHAPE_OPTIONS.map((shapeOption) => (
                              <SelectItem key={shapeOption.value} value={shapeOption.value}>
                                {shapeOption.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Remove pin button (edit mode) */}
                    {isEditMode && !isDraggingPin && (
                      <button
                        className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-destructive text-white rounded-full
                                   flex items-center justify-center opacity-0 group-hover:opacity-100
                                   transition-all scale-90 group-hover:scale-100 shadow-md z-20"
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onClick={e => { e.stopPropagation(); handleRemoveFromMap(service.id); }}
                        title="Remove from map"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}

                    {/* Edit mode tooltip */}
                    {isEditMode && (
                      <div className={cn(
                        "absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap pointer-events-none z-50 transition-opacity",
                        isDraggingPin ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}>
                        <span className="text-[10px] font-bold bg-background/95 backdrop-blur-sm border border-border/80 rounded-md px-2 py-0.5 shadow-md">
                          {service.name}
                        </span>
                      </div>
                    )}

                    {/* View mode hover card */}
                    {!isEditMode && !isSelected && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56
                                      opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-y-0
                                      transition-all duration-150 pointer-events-none z-50">
                        <div className="bg-background/95 backdrop-blur-md border border-border/80 p-3 rounded-xl shadow-xl">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={cn("h-2 w-2 rounded-full shrink-0", colorClass)} />
                            <p className="font-bold text-sm leading-tight">{service.name}</p>
                          </div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{service.category}</p>
                          {service.location && <p className="text-[11px] text-muted-foreground mt-1.5">{service.location}</p>}
                          {service.hours && (
                            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
                              <Clock className="h-3 w-3 shrink-0" /> {service.hours}
                            </div>
                          )}
                          <p className="text-[10px] text-primary/60 mt-2 italic">Click for full details</p>
                        </div>
                        <div className="w-2 h-2 bg-background border-r border-b border-border/80 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Empty state */}
              {!loading && mapPins.length === 0 && localBuildings.length === 0 && !isEditMode && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-3">
                  <MapIcon className="h-14 w-14 text-muted-foreground/20" />
                  <p className="text-sm font-medium text-muted-foreground/40 text-center px-8">
                    No services or map structures have been placed yet.
                  </p>
                </div>
              )}
            </div>{/* end inner canvas */}

            {/*  Fixed overlay controls  */}

            {/* Zoom controls */}
            <div className="absolute bottom-4 left-4 z-50 flex flex-col gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="secondary" className="h-7 w-7 shadow-md bg-background/85 backdrop-blur-sm" onClick={() => adjustZoom(0.2)}>
                    <ZoomIn className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Zoom in</TooltipContent>
              </Tooltip>
              <div className="h-6 px-1.5 flex items-center justify-center rounded border border-border/50 bg-background/85 backdrop-blur-sm text-[10px] font-mono font-bold text-muted-foreground shadow-md min-w-[40px] text-center pointer-events-none">
                {Math.round(zoom * 100)}%
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="secondary" className="h-7 w-7 shadow-md bg-background/85 backdrop-blur-sm" onClick={() => adjustZoom(-0.2)}>
                    <ZoomOut className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Zoom out</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="secondary" className="h-7 w-7 shadow-md bg-background/85 backdrop-blur-sm" onClick={resetView}>
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Reset view (100%)</TooltipContent>
              </Tooltip>
            </div>

            {/* Edit mode status strip */}
            {isEditMode && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
                              bg-background/90 backdrop-blur-md border border-border/50 rounded-full
                              px-4 py-1.5 shadow-lg text-[11px] font-medium pointer-events-none">
                <span className="text-green-600 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                  {placedCount} placed
                </span>
                <Separator orientation="vertical" className="h-3" />
                <span className="text-amber-600 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                  {unplacedCount} unplaced
                </span>
                <Separator orientation="vertical" className="h-3" />
                <span className="text-blue-600 flex items-center gap-1.5">
                  <Square className="h-3 w-3 text-blue-500 shrink-0 fill-blue-500/20" />
                  {localBuildings.length} blocks
                </span>
                {hasUnsavedChanges && (
                  <>
                    <Separator orientation="vertical" className="h-3" />
                    <span className="text-primary flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping shrink-0" />
                      Unsaved
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Category legend (view mode) */}
            {!isEditMode && allCategories.length > 0 && (
              <div className="absolute bottom-4 right-4 z-50 bg-background/85 backdrop-blur-sm border border-border/50 rounded-xl p-3 shadow-lg">
                <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground mb-2">Legend</p>
                <div className="space-y-1.5">
                  {allCategories
                    .filter(c => !hiddenCategories.has(c))
                    .map(cat => (
                      <div key={cat} className="flex items-center gap-2">
                        <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", getCategoryColor(cat))} />
                        <span className="text-[11px] font-medium">{cat}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Pan hint */}
            {!isEditMode && !isPanning && zoom === 1 && pan.x === 0 && pan.y === 0 && (
              <div className="absolute top-3 right-3 z-30 text-[10px] text-muted-foreground/40 pointer-events-none bg-background/50 rounded-md px-2 py-1 backdrop-blur-sm">
                Scroll to zoom  Drag to pan
              </div>
            )}
          </div>{/* end viewport */}

          {/*  Sidebar  */}
          <div className="flex flex-col h-full bg-background/30 backdrop-blur-xs border-l border-border/50 min-h-[520px]">

            {/* Service detail panel */}
            {!isEditMode && selectedService && (
              <div className="border-b border-border/50 p-4 bg-card/20">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md", getCategoryColor(selectedService.category))}>
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-tight">{selectedService.name}</p>
                      <Badge className={cn("text-[9px] h-4 px-1.5 mt-0.5 border font-semibold", getCategoryBadge(selectedService.category))}>
                        {selectedService.category}
                      </Badge>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedServiceId(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors mt-0.5 p-0.5 hover:bg-muted rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  {selectedService.description && (
                    <div className="flex gap-2">
                      <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary/60" />
                      <p className="leading-relaxed">{selectedService.description}</p>
                    </div>
                  )}
                  {selectedService.location && (
                    <div className="flex gap-2">
                      <Navigation className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary/60" />
                      <p>{selectedService.location}</p>
                    </div>
                  )}
                  {selectedService.hours && (
                    <div className="flex gap-2">
                      <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary/60" />
                      <p>{selectedService.hours}</p>
                    </div>
                  )}
                  {selectedService.contact && (
                    <div className="flex gap-2">
                      <Phone className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary/60" />
                      <p>{selectedService.contact}</p>
                    </div>
                  )}
                  {selectedService.website && (
                    <div className="flex gap-2">
                      <Globe className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary/60" />
                      <a href={selectedService.website} target="_blank" rel="noopener noreferrer"
                        className="text-primary hover:underline underline-offset-2 truncate">
                        {selectedService.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border/40">
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 flex-1"
                      onClick={() => openEditService(selectedService)}>
                      <Pencil className="h-3 w-3" /> Edit Details
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteService(selectedService.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Sidebar header */}
            <div className="p-4 border-b border-border/50 flex items-center justify-between shrink-0">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                {isEditMode
                  ? <><GripVertical className="h-4 w-4 text-primary" /> Drag to Place</>
                  : <><MapPin className="h-4 w-4 text-primary" /> Directory</>
                }
              </h4>
              <Badge variant="secondary" className="text-[10px] h-5">{filteredServices.length} locations</Badge>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 w-full rounded-lg bg-muted animate-pulse" />)}
                  </div>
                ) : filteredServices.length === 0 ? (
                  <div className="text-center py-10">
                    <MapIcon className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No campus services listed yet.</p>
                  </div>
                ) : (
                  filteredServices.map(item => {
                    const pos = getEffectivePosition(item);
                    const isOnMap = pos !== null;
                    const isDraggingThis = draggingFromListId === item.id;
                    const colorClass = getCategoryColor(item.category);
                    const isDraggableFromList = isEditMode && !isOnMap;
                    const isSelected = selectedServiceId === item.id;

                    return (
                      <div
                        key={item.id}
                        draggable={isDraggableFromList}
                        onDragStart={isDraggableFromList ? e => handleListDragStart(e, item.id) : undefined}
                        onDragEnd={handleListDragEnd}
                        className={cn(
                          "group rounded-xl border p-3 transition-all select-none",
                          !isEditMode && "cursor-pointer bg-card/40 hover:bg-card/80",
                          !isEditMode && (isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border/50"),
                          isDraggableFromList && "cursor-grab active:cursor-grabbing border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary/70",
                          isEditMode && isOnMap && "border-green-500/25 bg-green-500/5 opacity-60",
                          isDraggingThis && "opacity-25 scale-95",
                        )}
                        onClick={!isEditMode ? () => setSelectedServiceId(prev => prev === item.id ? null : item.id) : undefined}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-white",
                            colorClass,
                            isDraggableFromList && "group-hover:scale-110 transition-transform"
                          )}>
                            {isDraggableFromList ? <GripVertical className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{item.name}</p>
                            <p className="text-[10px] font-semibold text-primary/80">{item.category}</p>
                            {item.location && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{item.location}</p>}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {isEditMode && isOnMap && (
                              <Badge className="text-[9px] h-4 px-1.5 bg-green-500/15 text-green-600 border border-green-500/30">
                                Placed
                              </Badge>
                            )}
                            {isAdmin && !isEditMode && (
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="icon" variant="ghost" className="h-7 w-7"
                                  onClick={e => { e.stopPropagation(); openEditService(item); }}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7"
                                  onClick={e => { e.stopPropagation(); handleDeleteService(item.id); }}>
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Edit mode keyboard shortcuts */}
                {isEditMode && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3 mt-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-primary/50">Edit map structures</p>
                    <div className="text-[11px] text-muted-foreground space-y-2">
                       <p><strong className="text-foreground">Add Box:</strong> Use the button up top to add a resizable building block.</p>
                       <p><strong className="text-foreground">Resize:</strong> Drag the bottom-right corner of any block.</p>
                       <p><strong className="text-foreground">Hold Space:</strong> Drag anywhere to pan the map without moving objects.</p>
                    </div>
                  </div>
                )}

                {/* View mode: Suggest & moderation */}
                {!isEditMode && (
                  <>
                    <div className="pt-4 border-t border-border/50">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Propose Addition</h4>
                      <Dialog open={suggestDialogOpen} onOpenChange={setSuggestDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full border-dashed gap-2 text-xs">
                            <Plus className="h-3 w-3" /> Add to Suggestion Box
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Suggest a Campus Service</DialogTitle>
                            <DialogDescription>Know a place that belongs on the map? Let the admins know.</DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="grid gap-2">
                                <Label>Service Name</Label>
                                <Input placeholder="e.g. Central ATM" value={suggestionForm.title}
                                  onChange={e => setSuggestionForm({ ...suggestionForm, title: e.target.value })} />
                              </div>
                              <div className="grid gap-2">
                                <Label>Category</Label>
                                <Input placeholder="e.g. Finance" value={suggestionForm.serviceCategory}
                                  onChange={e => setSuggestionForm({ ...suggestionForm, serviceCategory: e.target.value })} />
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <Label>Location / Building</Label>
                              <Input placeholder="e.g. Student Union, 2nd Floor" value={suggestionForm.location}
                                onChange={e => setSuggestionForm({ ...suggestionForm, location: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                              <Label>Description</Label>
                              <Textarea placeholder="What is this place for?" className="h-20 resize-none"
                                value={suggestionForm.description}
                                onChange={e => setSuggestionForm({ ...suggestionForm, description: e.target.value })} />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleSuggestService} className="w-full" disabled={!userId || submittingSuggestion}>
                              {submittingSuggestion ? "Submitting" : "Submit Proposal"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {isAdmin && pendingSuggestions.length > 0 && (
                      <div className="pt-6 border-t border-border/50">
                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-3 flex items-center gap-2">
                          <Shield className="h-3 w-3" /> Moderation Queue ({pendingSuggestions.length})
                        </h5>
                        <div className="space-y-2">
                          {pendingSuggestions.map(item => (
                            <div key={item.id} className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                              <p className="text-xs font-bold">{item.title}</p>
                              {item.serviceCategory && (
                                <Badge variant="outline" className="text-[9px] h-4 px-1.5">{item.serviceCategory}</Badge>
                              )}
                              <p className="text-[10px] text-muted-foreground line-clamp-2">{item.description}</p>
                              <div className="flex gap-2 pt-1">
                                <Button size="sm" className="h-7 px-2 text-[10px] gap-1 bg-green-600 hover:bg-green-700"
                                  onClick={() => handleApproveSuggestion(item)}>
                                  <Check className="h-3 w-3" /> Approve
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] gap-1 text-destructive"
                                  onClick={() => handleRejectSuggestion(item)}>
                                  <X className="h-3 w-3" /> Deny
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!isAdmin && userSuggestions.length > 0 && (
                      <div className="pt-6 border-t border-border/50">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Your Suggestions</h4>
                        <div className="space-y-2">
                          {userSuggestions.map(item => (
                            <div key={item.id} className="rounded-xl border border-border/50 p-3 bg-background/40">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold">{item.title}</p>
                                <Badge variant="outline" className="text-[10px]">{item.status}</Badge>
                              </div>
                              {item.adminNote && (
                                <p className="text-[10px] text-muted-foreground mt-1">Admin note: {item.adminNote}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/*  Edit Service Dialog  */}
      <Dialog open={editServiceDialogOpen} onOpenChange={setEditServiceDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>Update the details for this campus service.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            {(["name", "category", "location", "hours", "contact", "website"] as const).map(key => (
              <div key={key} className="grid gap-2">
                <Label className="capitalize">{key === "category" ? "Category" : key}</Label>
                <Input value={editServiceForm[key]} onChange={e => setEditServiceForm({ ...editServiceForm, [key]: e.target.value })} />
              </div>
            ))}
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea className="resize-none h-20" value={editServiceForm.description}
                onChange={e => setEditServiceForm({ ...editServiceForm, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditServiceDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveServiceEdit} disabled={savingEdit}>
              {savingEdit ? "Saving" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/*  Background Image Dialog  */}
      <Dialog open={bgDialogOpen} onOpenChange={setBgDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" /> Campus Map Background
            </DialogTitle>
            <DialogDescription>
              Paste an image URL or choose a local image file. Stored locally in your browser per university.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <Label>Local Image</Label>
            <Input type="file" accept="image/*" onChange={handleBackgroundFileChange} />
            {bgFileName && <p className="text-xs text-muted-foreground">Selected: {bgFileName}</p>}
            <Label>Image URL</Label>
            <Input
              placeholder="https://example.com/campus-map.png"
              value={bgUrlInput}
              onChange={e => setBgUrlInput(e.target.value)}
            />
            {bgUrlInput && (
              <div className="rounded-xl overflow-hidden border border-border/50 h-40 bg-muted/30 flex items-center justify-center">
                <img src={bgUrlInput} alt="Preview" className="w-full h-full object-cover"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            {mapBgUrl && (
              <Button variant="destructive" className="sm:mr-auto" onClick={removeBgUrl}>Remove Background</Button>
            )}
            <Button variant="outline" onClick={() => setBgDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveBgUrl} disabled={!bgUrlInput.trim()}>Apply Background</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}