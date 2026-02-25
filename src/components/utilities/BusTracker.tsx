"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bus, Clock, MapPin, Plus, Trash2, Check, X, Shield, Search, Info, Accessibility, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useUserUniversity } from "@/hooks/useUserUniversity";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

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

export function BusTracker() {
  const { universityId, userId, role, loading: userContextLoading } = useUserUniversity();
  const isAdmin = role === "ADMIN";
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

  const filteredRoutes = routes.filter((route) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesQuery = !query || `${route.routeName} ${route.routeNumber} ${route.nextStop || ""}`.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "ALL" || route.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([loadRoutes(), loadSuggestions()]);
    setRefreshing(false);
  };

  const loadRoutes = async () => {
    if (!universityId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("UtilityShuttle")
      .select("*")
      .eq("universityId", universityId)
      .order("createdAt", { ascending: false });

    if (error) {
      toast.error("Failed to load shuttles.");
    } else {
      setRoutes(data ?? []);
    }
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
    } else {
      const { data } = await supabase
        .from("UtilitySuggestion")
        .select("*")
        .eq("suggestedBy", userId)
        .eq("category", "SHUTTLE")
        .order("createdAt", { ascending: false });
      setUserSuggestions(data ?? []);
    }
  };

  useEffect(() => {
    if (!universityId) return;
    loadRoutes();
    loadSuggestions();
  }, [universityId, userId, role]);

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
      schedule: routeForm.schedule ? routeForm.schedule.split(",").map((s) => s.trim()) : null,
      operatingHours: routeForm.operatingHours || null,
      serviceAlerts: routeForm.serviceAlerts || null,
      isAccessible: routeForm.isAccessible,
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
    loadRoutes();
    setSubmittingRoute(false);
  };

  const handleDeleteRoute = async (id: string) => {
    const { error } = await supabase.from("UtilityShuttle").delete().eq("id", id);
    if (error) {
      toast.error("Failed to remove shuttle route.");
      return;
    }
    toast.success("Shuttle route removed.");
    loadRoutes();
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
      schedule: suggestionForm.schedule ? suggestionForm.schedule.split(",").map((s) => s.trim()) : null,
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
    loadSuggestions();
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

  if (!userContextLoading && !universityId) {
    return (
      <Card className="border-none shadow-xl bg-background/60 backdrop-blur-md overflow-hidden">
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          Add your university in your profile to use Shuttle Tracker.
        </CardContent>
      </Card>
    );
  }

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
    };
    const insert = await supabase.from("UtilityShuttle").insert(payload);
    if (insert.error) {
      toast.error("Failed to approve suggestion.");
      return;
    }
    await supabase.from("UtilitySuggestion").update({ status: "APPROVED" }).eq("id", suggestion.id);
    toast.success("Suggestion approved.");
    loadRoutes();
    loadSuggestions();
  };

  const handleRejectSuggestion = async (suggestion: UtilitySuggestion) => {
    const adminNote = window.prompt("Optional rejection note") || null;
    await supabase.from("UtilitySuggestion").update({ status: "REJECTED", adminNote }).eq("id", suggestion.id);
    toast.success("Suggestion rejected.");
    loadSuggestions();
  };

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
              <CardDescription>Real-time shuttle schedules and service alerts for campus routes.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
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
                          <Input value={routeForm.routeName} onChange={(e) => setRouteForm({ ...routeForm, routeName: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                          <Label>Number/ID</Label>
                          <Input value={routeForm.routeNumber} onChange={(e) => setRouteForm({ ...routeForm, routeNumber: e.target.value })} />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Current Status</Label>
                        <Input value={routeForm.status} onChange={(e) => setRouteForm({ ...routeForm, status: e.target.value as any })} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Next Stop</Label>
                        <Input value={routeForm.nextStop || ""} onChange={(e) => setRouteForm({ ...routeForm, nextStop: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label>ETA (minutes)</Label>
                          <Input type="number" value={routeForm.etaMinutes} onChange={(e) => setRouteForm({ ...routeForm, etaMinutes: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                          <Label>Accessible</Label>
                          <Button
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
                        <Input value={routeForm.operatingHours} onChange={(e) => setRouteForm({ ...routeForm, operatingHours: e.target.value })} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Service Alerts</Label>
                        <Textarea value={routeForm.serviceAlerts} onChange={(e) => setRouteForm({ ...routeForm, serviceAlerts: e.target.value })} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreateRoute} disabled={submittingRoute}>{submittingRoute ? "Saving..." : "Initialize Route"}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              <Button size="sm" variant="outline" className="gap-2" onClick={refreshAll} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
              </Button>
              <div className="flex items-center gap-1 border rounded-md px-1 py-1 bg-background/50">
                {(["ALL", "On Time", "Arriving", "Delayed"] as const).map((option) => (
                  <Button key={option} size="sm" variant={statusFilter === option ? "default" : "ghost"} className="h-6 px-2 text-[10px]" onClick={() => setStatusFilter(option)}>
                    {option}
                  </Button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Filter routes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 h-8 w-[170px] bg-background/50" />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-40 rounded-xl bg-muted/30 animate-pulse border border-border/50" />
              ))
            ) : filteredRoutes.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-muted/10 rounded-2xl border border-dashed border-border/50">
                <Bus className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">No routes match current filters.</p>
              </div>
            ) : (
              filteredRoutes.map((route) => (
                <div key={route.id} className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 p-5 hover:bg-card/80 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary text-lg">
                      {route.routeNumber}
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={route.status === "Delayed" ? "destructive" : "default"}
                        className={`h-5 px-2 text-[10px] uppercase font-bold tracking-tighter ${route.status === "On Time" ? "bg-green-500 hover:bg-green-600" :
                            route.status === "Arriving" ? "bg-blue-500 hover:bg-blue-600" : ""
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

                  <div className="space-y-3">
                    <h4 className="font-bold text-base leading-tight">{route.routeName}</h4>
                    {route.nextStop && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                        <span className="truncate">Next: <span className="text-foreground font-medium">{route.nextStop}</span></span>
                      </div>
                    )}

                    {/* Simulated Progress Line */}
                    <div className="relative pt-2">
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div className={`h-full bg-primary transition-all duration-1000 ${route.status === "Arriving" ? "w-[90%]" : "w-[40%]"}`}></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex gap-2">
                        {route.isAccessible && <span title="Wheelchair accessible"><Accessibility className="h-3.5 w-3.5 text-muted-foreground" /></span>}
                        {route.serviceAlerts && <span title="Active Alert"><Info className="h-3.5 w-3.5 text-amber-500" /></span>}
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" disabled={updatingRouteId === route.id} onClick={() => handleQuickStatusUpdate(route.id, "On Time")}>On Time</Button>
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" disabled={updatingRouteId === route.id} onClick={() => handleQuickStatusUpdate(route.id, "Arriving")}>Arriving</Button>
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-amber-600" disabled={updatingRouteId === route.id} onClick={() => handleQuickStatusUpdate(route.id, "Delayed")}>Delayed</Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive transition-opacity"
                            onClick={() => handleDeleteRoute(route.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Moderation section */}
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
                      <Input placeholder="e.g. Shopping Mall Circle" value={suggestionForm.routeName} onChange={(e) => setSuggestionForm({ ...suggestionForm, routeName: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Desired Number</Label>
                      <Input placeholder="e.g. S12" value={suggestionForm.routeNumber} onChange={(e) => setSuggestionForm({ ...suggestionForm, routeNumber: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Key Stops</Label>
                    <Input placeholder="List main stops..." value={suggestionForm.nextStop} onChange={(e) => setSuggestionForm({ ...suggestionForm, nextStop: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Proposed Hours</Label>
                    <Input placeholder="e.g. 7 AM - 10 PM" value={suggestionForm.operatingHours} onChange={(e) => setSuggestionForm({ ...suggestionForm, operatingHours: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Why is this route needed?</Label>
                    <Textarea placeholder="Explain the benefit for students..." value={suggestionForm.notes} onChange={(e) => setSuggestionForm({ ...suggestionForm, notes: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSuggestRoute} className="w-full" disabled={submittingSuggestion}>{submittingSuggestion ? "Submitting..." : "Submit Proposal"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* User's Suggestions */}
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

        {/* Admin Moderation Queue */}
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