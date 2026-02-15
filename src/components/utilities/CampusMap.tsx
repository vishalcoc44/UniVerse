"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Plus, Trash2, Clock, Check, X, Shield, Navigation, Map } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useUserUniversity } from "@/hooks/useUserUniversity";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

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

const emptyServiceForm = {
  name: "",
  category: "",
  description: "",
  location: "",
  hours: "",
  contact: "",
  website: "",
  mapX: "",
  mapY: "",
};

const emptySuggestionForm = {
  title: "",
  serviceCategory: "",
  description: "",
  location: "",
  hours: "",
  contact: "",
  website: "",
  mapX: "",
  mapY: "",
  notes: "",
};

export function CampusMap() {
  const { universityId, userId, role } = useUserUniversity();
  const isAdmin = role === "ADMIN";
  const [services, setServices] = useState<UtilityService[]>([]);
  const [pendingSuggestions, setPendingSuggestions] = useState<UtilitySuggestion[]>([]);
  const [userSuggestions, setUserSuggestions] = useState<UtilitySuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceForm, setServiceForm] = useState(emptyServiceForm);
  const [suggestionForm, setSuggestionForm] = useState(emptySuggestionForm);

  const loadServices = async () => {
    if (!universityId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("UtilityService")
      .select("*")
      .eq("universityId", universityId)
      .order("createdAt", { ascending: false });

    if (error) {
      toast.error("Failed to load campus services.");
    } else {
      setServices(data ?? []);
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
        .eq("category", "SERVICE")
        .eq("status", "PENDING")
        .order("createdAt", { ascending: false });
      setPendingSuggestions(data ?? []);
    } else {
      const { data } = await supabase
        .from("UtilitySuggestion")
        .select("*")
        .eq("suggestedBy", userId)
        .eq("category", "SERVICE")
        .order("createdAt", { ascending: false });
      setUserSuggestions(data ?? []);
    }
  };

  useEffect(() => {
    if (!universityId) return;
    loadServices();
    loadSuggestions();
  }, [universityId, userId, role]);

  const mapPins = useMemo(
    () => services.filter((item) => item.mapX !== null && item.mapY !== null),
    [services]
  );

  const handleCreateService = async () => {
    if (!universityId) return;
    if (!serviceForm.name || !serviceForm.category) {
      toast.error("Name and category are required.");
      return;
    }
    const payload = {
      universityId,
      name: serviceForm.name,
      category: serviceForm.category,
      description: serviceForm.description || null,
      location: serviceForm.location || null,
      hours: serviceForm.hours || null,
      contact: serviceForm.contact || null,
      website: serviceForm.website || null,
      mapX: serviceForm.mapX ? Number(serviceForm.mapX) : null,
      mapY: serviceForm.mapY ? Number(serviceForm.mapY) : null,
    };
    const { error } = await supabase.from("UtilityService").insert(payload);
    if (error) {
      toast.error("Failed to add service.");
      return;
    }
    toast.success("Service added.");
    setServiceForm(emptyServiceForm);
    loadServices();
  };

  const handleDeleteService = async (id: string) => {
    const { error } = await supabase.from("UtilityService").delete().eq("id", id);
    if (error) {
      toast.error("Failed to remove service.");
      return;
    }
    toast.success("Service removed.");
    loadServices();
  };

  const handleSuggestService = async () => {
    if (!universityId || !userId) return;
    if (!suggestionForm.title) {
      toast.error("Suggestion title is required.");
      return;
    }
    const payload = {
      universityId,
      suggestedBy: userId,
      category: "SERVICE",
      title: suggestionForm.title,
      serviceCategory: suggestionForm.serviceCategory || null,
      description: suggestionForm.description || null,
      location: suggestionForm.location || null,
      hours: suggestionForm.hours || null,
      contact: suggestionForm.contact || null,
      website: suggestionForm.website || null,
      mapX: suggestionForm.mapX ? Number(suggestionForm.mapX) : null,
      mapY: suggestionForm.mapY ? Number(suggestionForm.mapY) : null,
      notes: suggestionForm.notes || null,
    };
    const { error } = await supabase.from("UtilitySuggestion").insert(payload);
    if (error) {
      toast.error("Failed to submit suggestion.");
      return;
    }
    toast.success("Suggestion sent.");
    setSuggestionForm(emptySuggestionForm);
    loadSuggestions();
  };

  const handleApproveSuggestion = async (suggestion: UtilitySuggestion) => {
    if (!universityId) return;
    const servicePayload = {
      universityId,
      name: suggestion.title ?? "Service",
      category: suggestion.serviceCategory ?? "General",
      description: suggestion.description ?? null,
      location: suggestion.location ?? null,
      hours: suggestion.hours ?? null,
      contact: suggestion.contact ?? null,
      website: suggestion.website ?? null,
      mapX: suggestion.mapX ?? null,
      mapY: suggestion.mapY ?? null,
    };
    const insert = await supabase.from("UtilityService").insert(servicePayload);
    if (insert.error) {
      toast.error("Failed to approve suggestion.");
      return;
    }
    await supabase
      .from("UtilitySuggestion")
      .update({ status: "APPROVED" })
      .eq("id", suggestion.id);
    toast.success("Suggestion approved.");
    loadServices();
    loadSuggestions();
  };

  const handleRejectSuggestion = async (suggestion: UtilitySuggestion) => {
    const adminNote = window.prompt("Optional rejection note") || null;
    await supabase
      .from("UtilitySuggestion")
      .update({ status: "REJECTED", adminNote })
      .eq("id", suggestion.id);
    toast.success("Suggestion rejected.");
    loadSuggestions();
  };

  return (
    <Card className="border-none shadow-xl bg-background/60 backdrop-blur-md overflow-hidden">
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Navigation className="h-6 w-6 text-primary" />
              Interactive Campus Map
            </CardTitle>
            <CardDescription>Locate essential services, labs, and student hubs across campus.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" /> Add Service
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add campus service</DialogTitle>
                    <DialogDescription>Visible to everyone at your university.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3 py-2">
                    <div className="grid gap-2">
                      <Label>Name</Label>
                      <Input value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Category</Label>
                      <Input value={serviceForm.category} onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Description</Label>
                      <Textarea value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Location</Label>
                      <Input value={serviceForm.location} onChange={(e) => setServiceForm({ ...serviceForm, location: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Hours</Label>
                      <Input value={serviceForm.hours} onChange={(e) => setServiceForm({ ...serviceForm, hours: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Contact</Label>
                      <Input value={serviceForm.contact} onChange={(e) => setServiceForm({ ...serviceForm, contact: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Website</Label>
                      <Input value={serviceForm.website} onChange={(e) => setServiceForm({ ...serviceForm, website: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <Label>Map X (0-100)</Label>
                        <Input type="number" value={serviceForm.mapX} onChange={(e) => setServiceForm({ ...serviceForm, mapX: e.target.value })} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Map Y (0-100)</Label>
                        <Input type="number" value={serviceForm.mapY} onChange={(e) => setServiceForm({ ...serviceForm, mapY: e.target.value })} />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateService}>Save Service</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <div className="relative w-full max-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input 
                placeholder="Find building..." 
                className="pl-8 h-8 text-xs bg-background/50"
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_350px] p-0 overflow-hidden rounded-b-xl">
        {/* Map Area */}
        <div className="relative min-h-[500px] bg-muted/20 overflow-hidden cursor-crosshair">
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 bg-[size:30px_30px] opacity-[0.03] dark:opacity-[0.05]" 
               style={{ backgroundImage: "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)" }}>
          </div>
          
          {/* Abstract Campus Shapes */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10">
            <rect x="10%" y="10%" width="20%" height="15%" rx="8" fill="currentColor" />
            <rect x="40%" y="15%" width="15%" height="25%" rx="8" fill="currentColor" />
            <rect x="65%" y="10%" width="25%" height="20%" rx="8" fill="currentColor" />
            <circle cx="50%" cy="60%" r="40" fill="currentColor" />
            <path d="M 0 80 Q 250 100 500 70 T 1000 90" stroke="currentColor" strokeWidth="20" fill="none" className="opacity-20" />
          </svg>

          {mapPins.map((loc) => (
            <div 
              key={loc.id} 
              className="absolute group z-20 transition-all hover:z-30" 
              style={{ top: `${loc.mapY}%`, left: `${loc.mapX}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div className="relative">
                <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center animate-pulse absolute -inset-0 scale-75"></div>
                <div className="h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                  <MapPin className="h-4 w-4" />
                </div>
                
                {/* Information Popover on Hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-background/95 backdrop-blur-sm border border-border p-3 rounded-lg shadow-xl ring-1 ring-black/5">
                    <p className="font-bold text-sm leading-tight">{loc.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">{loc.category}</p>
                    {loc.hours && (
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" /> {loc.hours}
                      </div>
                    )}
                  </div>
                  <div className="w-2 h-2 bg-background border-r border-b border-border rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col h-full bg-background/30 backdrop-blur-xs border-l border-border/50">
          <div className="p-4 border-b border-border/50 flex items-center justify-between">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" /> Directory
            </h4>
            <Badge variant="secondary" className="text-[10px] h-5">{services.length} Locations</Badge>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {loading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-16 w-full rounded-lg bg-muted animate-pulse" />)}
                </div>
              ) : services.length === 0 ? (
                <div className="text-center py-8">
                  <Map className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No campus services listed yet.</p>
                </div>
              ) : (
                services.map((item) => (
                  <div key={item.id} className="group rounded-xl border border-border/50 p-3 bg-card/40 hover:bg-card/80 transition-all cursor-pointer">
                    <div className="flex items-start justify-between gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{item.name}</p>
                        <p className="text-[10px] text-primary font-medium">{item.category}</p>
                        {item.location && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{item.location}</p>}
                      </div>
                      {isAdmin && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteService(item.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* Suggestions Section */}
              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Propose Addition</h4>
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full border-dashed gap-2 text-xs">
                      <Plus className="h-3 w-3" /> Add to Suggestion Box
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Suggest a Campus Service</DialogTitle>
                      <DialogDescription>
                        Know a place that belongs on the map? Let the admins know.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label>Service Name</Label>
                          <Input 
                            placeholder="e.g. Central ATM" 
                            value={suggestionForm.title || ""} 
                            onChange={(e) => setSuggestionForm({ ...suggestionForm, title: e.target.value })} 
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Category</Label>
                          <Input 
                            placeholder="e.g. Finance" 
                            value={suggestionForm.serviceCategory || ""} 
                            onChange={(e) => setSuggestionForm({ ...suggestionForm, serviceCategory: e.target.value })} 
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Location / Building</Label>
                        <Input 
                          placeholder="e.g. Student Union, 2nd Floor" 
                          value={suggestionForm.location || ""} 
                          onChange={(e) => setSuggestionForm({ ...suggestionForm, location: e.target.value })} 
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Description</Label>
                        <Textarea 
                          placeholder="What is this place for?" 
                          className="h-20"
                          value={suggestionForm.description || ""} 
                          onChange={(e) => setSuggestionForm({ ...suggestionForm, description: e.target.value })} 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label>Map X (Approx %)</Label>
                          <Input type="number" value={suggestionForm.mapX || ""} onChange={(e) => setSuggestionForm({ ...suggestionForm, mapX: Number(e.target.value) })} />
                        </div>
                        <div className="grid gap-2">
                          <Label>Map Y (Approx %)</Label>
                          <Input type="number" value={suggestionForm.mapY || ""} onChange={(e) => setSuggestionForm({ ...suggestionForm, mapY: Number(e.target.value) })} />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleSuggestService} className="w-full" disabled={!userId}>Submit Proposal</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Pending Proposals (Admin only) */}
              {isAdmin && pendingSuggestions.length > 0 && (
                <div className="pt-6 border-t border-border/50">
                  <h5 className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-3 flex items-center gap-2">
                    <Shield className="h-3 w-3" /> Moderation Queue
                  </h5>
                  <div className="space-y-2">
                    {pendingSuggestions.map((item) => (
                      <div key={item.id} className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-2">
                        <p className="text-xs font-bold">{item.title}</p>
                        <p className="text-[10px] text-muted-foreground line-clamp-2">{item.description}</p>
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" className="h-7 px-2 text-[10px] gap-1 bg-green-600 hover:bg-green-700" onClick={() => handleApproveSuggestion(item)}>
                            <Check className="h-3 w-3" /> Approve
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] gap-1 text-destructive" onClick={() => handleRejectSuggestion(item)}>
                            <X className="h-3 w-3" /> Deny
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Your Suggestions (User) */}
              {!isAdmin && userSuggestions.length > 0 && (
                <div className="pt-6 border-t border-border/50">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Your Suggestions</h4>
                  <div className="space-y-2">
                    {userSuggestions.map((item) => (
                      <div key={item.id} className="rounded-lg border border-border/50 p-3 bg-background/40">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">{item.title}</p>
                          <Badge variant="outline" className="text-[10px]">{item.status}</Badge>
                        </div>
                        {item.adminNote && <p className="text-[10px] text-muted-foreground mt-1">Admin note: {item.adminNote}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}