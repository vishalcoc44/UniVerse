"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Tag, Plus, Trash2, Check, X, Shield, Search, Copy, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";
import { useUserUniversity } from "@/hooks/useUserUniversity";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface UtilityDiscount {
  id: string;
  title: string;
  brand: string;
  offer: string;
  code?: string | null;
  category?: string | null;
  link?: string | null;
  expiresAt?: string | null;
  eligibility?: string | null;
  termsUrl?: string | null;
  redeemType?: string | null;
  campusLocation?: string | null;
  isActive?: boolean | null;
}

interface UtilitySuggestion {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  title?: string | null;
  brand?: string | null;
  offer?: string | null;
  code?: string | null;
  discountCategory?: string | null;
  link?: string | null;
  expiresAt?: string | null;
  eligibility?: string | null;
  termsUrl?: string | null;
  redeemType?: string | null;
  campusLocation?: string | null;
  notes?: string | null;
  adminNote?: string | null;
}

const emptyDiscountForm = {
  title: "",
  brand: "",
  offer: "",
  code: "",
  category: "",
  link: "",
  expiresAt: "",
  eligibility: "",
  termsUrl: "",
  redeemType: "",
  campusLocation: "",
};

const emptySuggestionForm = {
  title: "",
  brand: "",
  offer: "",
  code: "",
  discountCategory: "",
  link: "",
  expiresAt: "",
  eligibility: "",
  termsUrl: "",
  redeemType: "",
  campusLocation: "",
  notes: "",
};

export function DiscountHub() {
  const { universityId, userId, role, loading: userContextLoading } = useUserUniversity();
  const isAdmin = role === "ADMIN";
  const [discounts, setDiscounts] = useState<UtilityDiscount[]>([]);
  const [pendingSuggestions, setPendingSuggestions] = useState<UtilitySuggestion[]>([]);
  const [userSuggestions, setUserSuggestions] = useState<UtilitySuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [suggestDialogOpen, setSuggestDialogOpen] = useState(false);
  const [submittingDiscount, setSubmittingDiscount] = useState(false);
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false);
  const [discountForm, setDiscountForm] = useState(emptyDiscountForm);
  const [suggestionForm, setSuggestionForm] = useState(emptySuggestionForm);

  const categories = Array.from(new Set(discounts.map((item) => item.category || "General")));
  const filteredDiscounts = discounts.filter((item) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesQuery = !query || `${item.brand} ${item.title} ${item.offer} ${item.category || ""}`.toLowerCase().includes(query);
    const normalizedCategory = item.category || "General";
    const matchesCategory = categoryFilter === "ALL" || normalizedCategory === categoryFilter;
    return matchesQuery && matchesCategory;
  });

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([loadDiscounts(), loadSuggestions()]);
    setRefreshing(false);
  };

  const loadDiscounts = async () => {
    if (!universityId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("UtilityDiscount")
      .select("*")
      .eq("universityId", universityId)
      .eq("isActive", true)
      .order("createdAt", { ascending: false });

    if (error) {
      toast.error("Failed to load discounts.");
    } else {
      setDiscounts(data ?? []);
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
        .eq("category", "DISCOUNT")
        .eq("status", "PENDING")
        .order("createdAt", { ascending: false });
      setPendingSuggestions(data ?? []);
    } else {
      const { data } = await supabase
        .from("UtilitySuggestion")
        .select("*")
        .eq("suggestedBy", userId)
        .eq("category", "DISCOUNT")
        .order("createdAt", { ascending: false });
      setUserSuggestions(data ?? []);
    }
  };

  useEffect(() => {
    if (!universityId) return;
    loadDiscounts();
    loadSuggestions();
  }, [universityId, userId, role]);

  const handleCreateDiscount = async () => {
    if (!universityId) return;
    if (!discountForm.title || !discountForm.brand || !discountForm.offer) {
      toast.error("Title, brand, and offer are required.");
      return;
    }
    setSubmittingDiscount(true);
    const payload = {
      universityId,
      title: discountForm.title,
      brand: discountForm.brand,
      offer: discountForm.offer,
      code: discountForm.code || null,
      category: discountForm.category || null,
      link: discountForm.link || null,
      expiresAt: discountForm.expiresAt || null,
      eligibility: discountForm.eligibility || null,
      termsUrl: discountForm.termsUrl || null,
      redeemType: discountForm.redeemType || null,
      campusLocation: discountForm.campusLocation || null,
      isActive: true,
    };
    const { error } = await supabase.from("UtilityDiscount").insert(payload);
    if (error) {
      toast.error("Failed to add discount.");
      setSubmittingDiscount(false);
      return;
    }
    toast.success("Discount added.");
    setDiscountForm(emptyDiscountForm);
    setDiscountDialogOpen(false);
    loadDiscounts();
    setSubmittingDiscount(false);
  };

  const handleDeleteDiscount = async (id: string) => {
    const { error } = await supabase.from("UtilityDiscount").delete().eq("id", id);
    if (error) {
      toast.error("Failed to remove discount.");
      return;
    }
    toast.success("Discount removed.");
    loadDiscounts();
  };

  const handleSuggestDiscount = async () => {
    if (!universityId || !userId) return;
    if (!suggestionForm.title) {
      toast.error("Discount title is required.");
      return;
    }
    setSubmittingSuggestion(true);
    const payload = {
      universityId,
      suggestedBy: userId,
      category: "DISCOUNT",
      title: suggestionForm.title,
      brand: suggestionForm.brand || null,
      offer: suggestionForm.offer || null,
      code: suggestionForm.code || null,
      discountCategory: suggestionForm.discountCategory || null,
      link: suggestionForm.link || null,
      expiresAt: suggestionForm.expiresAt || null,
      eligibility: suggestionForm.eligibility || null,
      termsUrl: suggestionForm.termsUrl || null,
      redeemType: suggestionForm.redeemType || null,
      campusLocation: suggestionForm.campusLocation || null,
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

  if (!userContextLoading && !universityId) {
    return (
      <Card className="border-none shadow-xl bg-background/60 backdrop-blur-md overflow-hidden">
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          Add your university in your profile to view campus discounts.
        </CardContent>
      </Card>
    );
  }

  const handleApproveSuggestion = async (suggestion: UtilitySuggestion) => {
    if (!universityId) return;
    const payload = {
      universityId,
      title: suggestion.title ?? "Discount",
      brand: suggestion.brand ?? "Campus Partner",
      offer: suggestion.offer ?? "Student perk",
      code: suggestion.code ?? null,
      category: suggestion.discountCategory ?? null,
      link: suggestion.link ?? null,
      expiresAt: suggestion.expiresAt ?? null,
      eligibility: suggestion.eligibility ?? null,
      termsUrl: suggestion.termsUrl ?? null,
      redeemType: suggestion.redeemType ?? null,
      campusLocation: suggestion.campusLocation ?? null,
      isActive: true,
    };
    const insert = await supabase.from("UtilityDiscount").insert(payload);
    if (insert.error) {
      toast.error("Failed to approve suggestion.");
      return;
    }
    await supabase.from("UtilitySuggestion").update({ status: "APPROVED" }).eq("id", suggestion.id);
    toast.success("Suggestion approved.");
    loadDiscounts();
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
                <Tag className="h-6 w-6 text-primary" />
                Student Discount Hub
              </CardTitle>
              <CardDescription>Verified perks and exclusive campus deals for students.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" /> New Perk
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Add student discount</DialogTitle>
                      <DialogDescription>Setup a new official partnership offer.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 py-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label>Brand/Store</Label>
                          <Input value={discountForm.brand} onChange={(e) => setDiscountForm({ ...discountForm, brand: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                          <Label>Deal (e.g. 20% Off)</Label>
                          <Input value={discountForm.offer} onChange={(e) => setDiscountForm({ ...discountForm, offer: e.target.value })} />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Short Description</Label>
                        <Input value={discountForm.title} onChange={(e) => setDiscountForm({ ...discountForm, title: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label>Voucher Code</Label>
                          <Input value={discountForm.code} onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                          <Label>Category</Label>
                          <Input value={discountForm.category} onChange={(e) => setDiscountForm({ ...discountForm, category: e.target.value })} />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Offer Link</Label>
                        <Input value={discountForm.link} onChange={(e) => setDiscountForm({ ...discountForm, link: e.target.value })} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreateDiscount} disabled={submittingDiscount}>{submittingDiscount ? "Publishing..." : "Publish Perk"}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              <Button size="sm" variant="outline" className="gap-2" onClick={refreshAll} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
              </Button>
              <div className="flex items-center gap-1 border rounded-md px-1 py-1 bg-background/50">
                <Button size="sm" variant={categoryFilter === "ALL" ? "default" : "ghost"} className="h-6 px-2 text-[10px]" onClick={() => setCategoryFilter("ALL")}>All</Button>
                {categories.slice(0, 3).map((category) => (
                  <Button key={category} size="sm" variant={categoryFilter === category ? "default" : "ghost"} className="h-6 px-2 text-[10px]" onClick={() => setCategoryFilter(category)}>
                    {category}
                  </Button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search brands..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 h-8 w-[170px] bg-background/50" />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="h-48 rounded-xl bg-muted/30 animate-pulse" />
              ))
            ) : filteredDiscounts.length === 0 ? (
              <div className="col-span-full py-16 text-center border-2 border-dashed border-border/50 rounded-2xl">
                <Tag className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No discounts match your filters.</p>
              </div>
            ) : (
              filteredDiscounts.map((item) => (
                <div key={item.id} className="group relative bg-card/40 border border-border/50 rounded-2xl overflow-hidden hover:shadow-lg transition-all flex flex-col">
                  <div className="p-4 flex-1 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="h-10 w-10 rounded-lg bg-black/10 dark:bg-white/10 flex items-center justify-center font-bold text-[10px] text-center uppercase leading-tight">
                         {item.brand.substring(0, 2)}
                      </div>
                      <Badge variant="outline" className="text-[9px] uppercase tracking-wider">{item.category || "General"}</Badge>
                    </div>
                    
                    <div>
                      <h4 className="font-extrabold text-lg leading-tight text-primary">
                        {item.offer}
                      </h4>
                      <p className="font-semibold text-xs mt-0.5">{item.brand}</p>
                      <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2">{item.title}</p>
                    </div>

                    {item.code && (
                      <div className="mt-4 p-2 rounded-lg bg-muted/50 border border-muted flex items-center justify-between group/code transition-colors hover:bg-muted">
                        <code className="text-[11px] font-mono tracking-wider">{item.code}</code>
                        <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover/code:opacity-100" onClick={() => {
                          navigator.clipboard.writeText(item.code || "");
                          toast.success("Code copied!");
                        }}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-muted/20 border-t border-border/50 flex items-center justify-between">
                    <Button 
                      variant="link" 
                      className="h-auto p-0 text-[11px] font-bold h-6 gap-1"
                      asChild
                    >
                      <a href={item.link || "#"} target="_blank" rel="noopener noreferrer">
                        Redeem Offer <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                    {isAdmin && (
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteDiscount(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Suggestion Section */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
        <div className="space-y-4">
           <h3 className="text-lg font-bold flex items-center gap-2">
            <Check className="h-5 w-5 text-primary" /> Suggest a Deal
          </h3>
          <div className="grid gap-3">
             <Dialog open={suggestDialogOpen} onOpenChange={setSuggestDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-24 border-dashed bg-background/40 flex flex-col gap-2 items-center justify-center text-muted-foreground hover:text-foreground">
                  <Plus className="h-6 w-6" />
                  <div className="text-center">
                    <p className="text-xs font-bold">Know a student discount?</p>
                    <p className="text-[10px]">Submit it for verification and earn karma.</p>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Suggest Student Perk</DialogTitle>
                  <DialogDescription>Found a deal that works with university IDs?</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                       <Label>Brand/Store</Label>
                       <Input placeholder="e.g. Spotify" value={suggestionForm.brand} onChange={(e) => setSuggestionForm({ ...suggestionForm, brand: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                       <Label>Offer</Label>
                       <Input placeholder="e.g. 50% Student Plan" value={suggestionForm.offer} onChange={(e) => setSuggestionForm({ ...suggestionForm, offer: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                     <Label>Redemption Link</Label>
                     <Input placeholder="https://..." value={suggestionForm.link} onChange={(e) => setSuggestionForm({ ...suggestionForm, link: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                     <Label>Personal Note</Label>
                     <Textarea placeholder="Explain how to redeem..." value={suggestionForm.notes} onChange={(e) => setSuggestionForm({ ...suggestionForm, notes: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSuggestDiscount} className="w-full" disabled={submittingSuggestion}>{submittingSuggestion ? "Submitting..." : "Submit for Approval"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

             {/* User's History */}
             {!isAdmin && userSuggestions.length > 0 && (
                <div className="space-y-2 mt-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Your Submissions</h4>
                  {userSuggestions.map((item) => (
                    <div key={item.id} className="p-3 rounded-xl border border-border/50 bg-background/40 flex items-center justify-between">
                       <div>
                         <p className="font-bold text-sm tracking-tight">{item.brand}</p>
                         <p className="text-[10px] text-muted-foreground">{item.offer}</p>
                       </div>
                       <Badge variant="outline" className="text-[9px] uppercase">{item.status}</Badge>
                    </div>
                  ))}
                </div>
             )}
          </div>
        </div>

        {/* Moderation section (Admin only) */}
        {isAdmin && (
           <div className="space-y-4">
             <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Admin Queue</h3>
             <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-4 shadow-inner">
                <div className="flex items-center gap-2 text-amber-500">
                  <Shield className="h-4 w-4" />
                  <span className="text-xs font-black uppercase tracking-tighter">Perk Verification</span>
                </div>
                
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {pendingSuggestions.length === 0 ? (
                      <div className="text-center py-12 opacity-30">
                        <Tag className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-[10px]">No perks to verify.</p>
                      </div>
                    ) : (
                      pendingSuggestions.map((item) => (
                        <div key={item.id} className="p-4 rounded-xl border border-border bg-background shadow-xs group/item transition-all hover:border-amber-500/30">
                          <div className="space-y-2">
                            <p className="text-xs font-black uppercase tracking-tight">{item.brand}</p>
                            <p className="text-sm font-bold text-primary">{item.offer}</p>
                            <p className="text-[10px] text-muted-foreground line-clamp-2 italic">"{item.notes}"</p>
                          </div>
                          <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                            <Button size="sm" className="flex-1 h-7 text-[10px] bg-green-600 hover:bg-green-700 font-bold" onClick={() => handleApproveSuggestion(item)}>
                              <Check className="h-3 w-3 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-[10px] text-destructive hover:bg-destructive/5 font-bold" onClick={() => handleRejectSuggestion(item)}>
                              Reject
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