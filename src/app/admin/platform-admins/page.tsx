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
import { Loader2, Search, ShieldCheck, UserPlus, UserMinus } from "lucide-react";

interface ProfileRow {
  id: string;
  fullName: string | null;
  email: string | null;
  role: string;
  universityId: string | null;
}

export default function PlatformAdminsPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);

  const platformAdmins = useMemo(
    () => profiles.filter((p) => p.role === "ADMIN" && !p.universityId),
    [profiles]
  );

  const candidates = useMemo(
    () => profiles.filter((p) => !(p.role === "ADMIN" && !p.universityId)),
    [profiles]
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

    const allowed = profile?.role === "ADMIN" && !profile?.universityId;
    if (!allowed) {
      toast.error("Platform admin privileges required.");
      router.replace("/dashboard");
      return;
    }

    setIsPlatformAdmin(true);
    setAuthChecked(true);
  }, [router]);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("Profile")
      .select("id, fullName, email, role, universityId")
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
    setLoading(false);
  }, [search]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  useEffect(() => {
    if (!isPlatformAdmin) return;
    loadProfiles();
  }, [isPlatformAdmin, loadProfiles]);

  const handleGrant = async (targetUserId: string) => {
    setProcessingUserId(targetUserId);
    const { error } = await supabase.rpc("grant_platform_admin", {
      p_target_user_id: targetUserId,
    });

    if (error) {
      toast.error(error.message || "Failed to grant platform admin.");
    } else {
      toast.success("Platform admin granted.");
      await loadProfiles();
    }
    setProcessingUserId(null);
  };

  const handleRevoke = async (targetUserId: string) => {
    setProcessingUserId(targetUserId);
    const { error } = await supabase.rpc("revoke_platform_admin", {
      p_target_user_id: targetUserId,
    });

    if (error) {
      toast.error(error.message || "Failed to revoke platform admin.");
    } else {
      toast.success("Platform admin revoked.");
      await loadProfiles();
    }
    setProcessingUserId(null);
  };

  if (!authChecked) {
    return (
      <DashboardLayout icon={ShieldCheck} title="Platform Admins" breadcrumb={["UniVerse", "Admin", "Platform Admins"]}>
        <div className="py-24 flex items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
          <p className="text-sm text-muted-foreground">Checking access...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      icon={ShieldCheck}
      title="Platform Admin Management"
      subtitle="Grant and revoke platform-wide admin access"
      breadcrumb={["UniVerse", "Admin", "Platform Admins"]}
    >
      <div className="space-y-6">
        <Card className="p-4 rounded-2xl border-border/50 bg-card/50">
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
            <Button onClick={loadProfiles} className="rounded-xl">
              Search
            </Button>
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border-border/50 bg-card/50">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Current Platform Admins ({platformAdmins.length})
          </h2>
          <div className="space-y-3">
            {platformAdmins.map((user) => (
              <div key={user.id} className="flex items-center justify-between border border-border/40 rounded-xl p-3">
                <div>
                  <p className="font-medium">{user.fullName || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground">{user.email || "No email"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">PLATFORM ADMIN</Badge>
                  {user.id !== currentUserId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevoke(user.id)}
                      disabled={processingUserId === user.id}
                    >
                      {processingUserId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                      Revoke
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {platformAdmins.length === 0 && <p className="text-sm text-muted-foreground">No platform admins found.</p>}
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border-border/50 bg-card/50">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Eligible Users ({candidates.length})
          </h2>
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
                  Make Platform Admin
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
