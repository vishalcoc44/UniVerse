'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Search, UserPlus, UserMinus, Building2 } from "lucide-react";

interface ProfileRow {
  id: string;
  fullName: string | null;
  email: string | null;
  role: string;
  universityId: string | null;
}

export default function UniversityAdminsPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isUniversityAdmin, setIsUniversityAdmin] = useState(false);
  const [isUniversitySuperAdmin, setIsUniversitySuperAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [universityId, setUniversityId] = useState<string | null>(null);
  const [universityName, setUniversityName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [superAdminUserIds, setSuperAdminUserIds] = useState<Set<string>>(new Set());

  const universityAdmins = useMemo(
    () => profiles.filter((p) => p.role === "ADMIN" && p.universityId === universityId),
    [profiles, universityId]
  );

  const candidates = useMemo(
    () => profiles.filter((p) => !(p.role === "ADMIN" && p.universityId === universityId)),
    [profiles, universityId]
  );

  const checkAccess = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/dashboard");
      return;
    }

    setCurrentUserId(user.id);

    const { data: profile } = await supabase
      .from("Profile")
      .select("role, universityId")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "ADMIN" || !profile?.universityId) {
      toast.error("University admin privileges required.");
      router.replace("/dashboard");
      return;
    }

    const { data: university } = await supabase
      .from("University")
      .select("id, name, status")
      .eq("id", profile.universityId)
      .single();

    if (!university || university.status !== "APPROVED") {
      toast.error("University must be approved before managing admins.");
      router.replace("/dashboard");
      return;
    }

    setUniversityId(profile.universityId);
    setUniversityName(university.name ?? "Your University");

    const { data: superCheck } = await supabase.rpc("is_university_super_admin");
    setIsUniversitySuperAdmin(!!superCheck);

    setIsUniversityAdmin(true);
    setAuthChecked(true);
  }, [router]);

  const loadProfiles = useCallback(async () => {
    if (!universityId) return;

    setLoading(true);
    let query = supabase
      .from("Profile")
      .select("id, fullName, email, role, universityId")
      .eq("universityId", universityId)
      .order("fullName", { ascending: true })
      .limit(200);

    if (search.trim()) {
      query = query.or(`fullName.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
    }

    const { data, error } = await query;
    if (error) {
      toast.error("Failed to load users.");
    } else {
      setProfiles((data ?? []) as ProfileRow[]);
    }

    const { data: superAdmins } = await supabase
      .from("UniversityAdminRole")
      .select("userId")
      .eq("universityId", universityId)
      .eq("isSuper", true);

    setSuperAdminUserIds(new Set((superAdmins ?? []).map((r: any) => r.userId)));
    setLoading(false);
  }, [search, universityId]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  useEffect(() => {
    if (!isUniversityAdmin) return;
    loadProfiles();
  }, [isUniversityAdmin, loadProfiles]);

  const handleGrant = async (targetUserId: string) => {
    setProcessingUserId(targetUserId);
    const { error } = await supabase.rpc("grant_university_admin", {
      p_target_user_id: targetUserId,
    });

    if (error) {
      toast.error(error.message || "Failed to grant university admin.");
    } else {
      toast.success("University admin granted.");
      await loadProfiles();
    }
    setProcessingUserId(null);
  };

  const handleRevoke = async (targetUserId: string) => {
    setProcessingUserId(targetUserId);
    const { error } = await supabase.rpc("revoke_university_admin", {
      p_target_user_id: targetUserId,
    });

    if (error) {
      toast.error(error.message || "Failed to revoke university admin.");
    } else {
      toast.success("University admin revoked.");
      await loadProfiles();
    }
    setProcessingUserId(null);
  };

  if (!authChecked) {
    return (
      <DashboardLayout icon={Building2} title="University Admins" breadcrumb={["UniVerse", "Settings", "University Admins"]}>
        <div className="py-24 flex items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
          <p className="text-sm text-muted-foreground">Checking access...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      icon={Building2}
      title="University Admin Management"
      subtitle="Manage admin contacts for your approved university"
      breadcrumb={["UniVerse", "Settings", "University Admins"]}
    >
      <div className="space-y-6">
        <Card className="p-5 rounded-2xl border-border/50 bg-card/50">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{universityName}</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search user by name or email"
                className="pl-9"
              />
            </div>
            <Button onClick={loadProfiles} className="rounded-xl" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border-border/50 bg-card/50">
          <h2 className="text-lg font-semibold mb-4">Current University Admins ({universityAdmins.length})</h2>
          <div className="space-y-3">
            {universityAdmins.map((user) => (
              <div key={user.id} className="flex items-center justify-between border border-border/40 rounded-xl p-3">
                <div>
                  <p className="font-medium">{user.fullName || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground">{user.email || "No email"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">UNIVERSITY ADMIN</Badge>
                  {superAdminUserIds.has(user.id) && (
                    <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">SUPER ADMIN</Badge>
                  )}
                  {user.id !== currentUserId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevoke(user.id)}
                      disabled={
                        processingUserId === user.id ||
                        !isUniversitySuperAdmin ||
                        superAdminUserIds.has(user.id)
                      }
                    >
                      {processingUserId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {universityAdmins.length === 0 && <p className="text-sm text-muted-foreground">No university admins found.</p>}
            {!isUniversitySuperAdmin && (
              <p className="text-xs text-muted-foreground">Only university super admins can remove university admins.</p>
            )}
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border-border/50 bg-card/50">
          <h2 className="text-lg font-semibold mb-4">Eligible University Users ({candidates.length})</h2>
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {candidates.map((user) => (
              <div key={user.id} className="flex items-center justify-between border border-border/40 rounded-xl p-3">
                <div>
                  <p className="font-medium">{user.fullName || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground">{user.email || "No email"}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleGrant(user.id)}
                  disabled={processingUserId === user.id}
                >
                  {processingUserId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Make University Admin
                </Button>
              </div>
            ))}
            {candidates.length === 0 && <p className="text-sm text-muted-foreground">No eligible users found.</p>}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
