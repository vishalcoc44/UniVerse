'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ShieldCheck,
  Users,
  FileText,
  Calendar,
  AlertTriangle,
  Building2,
  CheckCircle2,
  XCircle,
  Search,
  Loader2,
  Trash2,
  Eye,
  BarChart3,
  Flag,
  GraduationCap,
  Globe,
  Mail,
  UserCog,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface AnalyticsCounts {
  totalUsers: number;
  totalPosts: number;
  totalEvents: number;
  pendingUniversities: number;
  openReports: number;
}

interface PendingUniversity {
  id: string;
  name: string;
  abbreviation: string | null;
  adminEmail: string | null;
  adminName: string | null;
  website: string | null;
  status: string;
  createdAt: string;
}

interface ForumReport {
  id: string;
  threadId: string | null;
  replyId: string | null;
  reporterId: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter?: { fullName: string } | null;
}

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  createdAt: string;
  University?: { name: string; abbreviation: string } | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Analytics
  const [counts, setCounts] = useState<AnalyticsCounts>({
    totalUsers: 0,
    totalPosts: 0,
    totalEvents: 0,
    pendingUniversities: 0,
    openReports: 0,
  });
  const [countsLoading, setCountsLoading] = useState(true);

  // Universities
  const [universities, setUniversities] = useState<PendingUniversity[]>([]);
  const [uniLoading, setUniLoading] = useState(true);
  const [processingUni, setProcessingUni] = useState<string | null>(null);

  // Reports
  const [reports, setReports] = useState<ForumReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [processingReport, setProcessingReport] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ForumReport | null>(null);

  // Users
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Auth check
  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/dashboard");
        return;
      }
      const { data: profile } = await supabase
        .from("Profile")
        .select("role, universityId")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "ADMIN") {
        toast.error("Access denied — admin privileges required.");
        router.replace("/dashboard");
        return;
      }

      if (profile?.universityId) {
        toast.error("Use University Admins page for campus admin management.");
        router.replace("/settings/university-admins");
        return;
      }
      setIsAdmin(true);
      setAuthChecked(true);
    };
    checkAdmin();
  }, [router]);

  // Fetch analytics counts
  const fetchCounts = useCallback(async () => {
    setCountsLoading(true);
    const [usersRes, postsRes, eventsRes, pendingRes, reportsRes] =
      await Promise.all([
        supabase
          .from("Profile")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("Post")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("Event")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("University")
          .select("*", { count: "exact", head: true })
          .eq("status", "PENDING"),
        supabase
          .from("ForumReport")
          .select("*", { count: "exact", head: true })
          .eq("status", "PENDING"),
      ]);
    setCounts({
      totalUsers: usersRes.count ?? 0,
      totalPosts: postsRes.count ?? 0,
      totalEvents: eventsRes.count ?? 0,
      pendingUniversities: pendingRes.count ?? 0,
      openReports: reportsRes.count ?? 0,
    });
    setCountsLoading(false);
  }, []);

  // Fetch pending universities
  const fetchUniversities = useCallback(async () => {
    setUniLoading(true);
    const { data } = await supabase
      .from("University")
      .select("*")
      .eq("status", "PENDING")
      .order("createdAt", { ascending: false });
    setUniversities(data ?? []);
    setUniLoading(false);
  }, []);

  // Fetch open reports
  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    const { data } = await supabase
      .from("ForumReport")
      .select(
        "*, reporter:Profile!ForumReport_reporterId_fkey(fullName)"
      )
      .eq("status", "PENDING")
      .order("createdAt", { ascending: false });
    setReports(data ?? []);
    setReportsLoading(false);
  }, []);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    let query = supabase
      .from("Profile")
      .select("*, University(name, abbreviation)")
      .order("createdAt", { ascending: false })
      .limit(50);

    if (roleFilter !== "ALL") {
      query = query.eq("role", roleFilter);
    }
    if (searchQuery.trim()) {
      query = query.or(
        `fullName.ilike.%${searchQuery.trim()}%,email.ilike.%${searchQuery.trim()}%`
      );
    }
    const { data } = await query;
    setUsers(data ?? []);
    setUsersLoading(false);
  }, [roleFilter, searchQuery]);

  // Load data when admin is confirmed and tab changes
  useEffect(() => {
    if (!isAdmin) return;
    fetchCounts();
  }, [isAdmin, fetchCounts]);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === "universities") fetchUniversities();
    if (activeTab === "reports") fetchReports();
    if (activeTab === "users") fetchUsers();
  }, [
    isAdmin,
    activeTab,
    fetchUniversities,
    fetchReports,
    fetchUsers,
  ]);

  // University actions
  const handleUniversityAction = async (
    id: string,
    action: "APPROVED" | "REJECTED"
  ) => {
    setProcessingUni(id);
    const { error } = await supabase.rpc("review_university_request", {
      p_university_id: id,
      p_new_status: action,
      p_review_note: null,
    });

    if (error) {
      toast.error(
        error.message || `Failed to ${action.toLowerCase()} university.`
      );
    } else {
      toast.success(
        `University ${action === "APPROVED" ? "approved" : "rejected"} successfully.`
      );
      setUniversities((prev) => prev.filter((u) => u.id !== id));
      setCounts((prev) => ({
        ...prev,
        pendingUniversities: Math.max(0, prev.pendingUniversities - 1),
      }));
    }
    setProcessingUni(null);
  };

  // Report actions
  const handleDismissReport = async (report: ForumReport) => {
    setProcessingReport(report.id);
    const { error } = await supabase
      .from("ForumReport")
      .update({ status: "RESOLVED" })
      .eq("id", report.id);

    if (error) {
      toast.error("Failed to dismiss report.");
    } else {
      toast.success("Report dismissed.");
      setReports((prev) => prev.filter((r) => r.id !== report.id));
      setCounts((prev) => ({
        ...prev,
        openReports: Math.max(0, prev.openReports - 1),
      }));
    }
    setProcessingReport(null);
  };

  const handleRemoveContent = async (report: ForumReport) => {
    setProcessingReport(report.id);
    let deleteError = false;

    if (report.replyId) {
      const { error } = await supabase
        .from("ForumReply")
        .delete()
        .eq("id", report.replyId);
      if (error) deleteError = true;
    } else if (report.threadId) {
      const { error } = await supabase
        .from("ForumThread")
        .delete()
        .eq("id", report.threadId);
      if (error) deleteError = true;
    }

    if (deleteError) {
      toast.error("Failed to remove content.");
      setProcessingReport(null);
      return;
    }

    await supabase
      .from("ForumReport")
      .update({ status: "RESOLVED" })
      .eq("id", report.id);

    toast.success("Reported content removed and report resolved.");
    setReports((prev) => prev.filter((r) => r.id !== report.id));
    setCounts((prev) => ({
      ...prev,
      openReports: Math.max(0, prev.openReports - 1),
    }));
    setProcessingReport(null);
    setConfirmDelete(null);
  };

  // Loading gate
  if (!authChecked) {
    return (
      <DashboardLayout
        title="Admin Panel"
        breadcrumb={["UniVerse", "Admin"]}
      >
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
          <p className="text-xs font-black italic tracking-widest text-muted-foreground uppercase">
            Verifying admin access...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) return null;

  const statCards = [
    {
      label: "Total Users",
      value: counts.totalUsers,
      icon: Users,
      color: "from-sky-500/10 to-sky-500/5 border-sky-200/50 dark:border-sky-900/50",
      iconColor: "bg-sky-500 shadow-sky-500/20",
      textColor: "text-sky-700 dark:text-sky-400",
    },
    {
      label: "Total Posts",
      value: counts.totalPosts,
      icon: FileText,
      color: "from-violet-500/10 to-violet-500/5 border-violet-200/50 dark:border-violet-900/50",
      iconColor: "bg-violet-500 shadow-violet-500/20",
      textColor: "text-violet-700 dark:text-violet-400",
    },
    {
      label: "Total Events",
      value: counts.totalEvents,
      icon: Calendar,
      color: "from-emerald-500/10 to-emerald-500/5 border-emerald-200/50 dark:border-emerald-900/50",
      iconColor: "bg-emerald-500 shadow-emerald-500/20",
      textColor: "text-emerald-700 dark:text-emerald-400",
    },
    {
      label: "Pending Universities",
      value: counts.pendingUniversities,
      icon: Building2,
      color: "from-amber-500/10 to-amber-500/5 border-amber-200/50 dark:border-amber-900/50",
      iconColor: "bg-amber-500 shadow-amber-500/20",
      textColor: "text-amber-700 dark:text-amber-400",
    },
    {
      label: "Open Reports",
      value: counts.openReports,
      icon: AlertTriangle,
      color: "from-rose-500/10 to-rose-500/5 border-rose-200/50 dark:border-rose-900/50",
      iconColor: "bg-rose-500 shadow-rose-500/20",
      textColor: "text-rose-700 dark:text-rose-400",
    },
  ];

  const roleBadgeColor: Record<string, string> = {
    ADMIN: "bg-red-500/10 text-red-500 border-red-500/20",
    FACULTY: "bg-violet-500/10 text-violet-500 border-violet-500/20",
    ALUMNI: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    STUDENT: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  };

  return (
    <DashboardLayout
      title={
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/5">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Admin <span className="text-red-500">Panel</span>
          </h1>
        </div>
      }
      subtitle="Platform administration — users, universities, and content moderation."
      breadcrumb={["UniVerse", "Admin"]}
    >
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md pb-4 pt-1 -mt-1">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 bg-card/60 backdrop-blur-sm border border-border/50 rounded-[1.25rem] p-1 h-11">
            <TabsTrigger
              value="overview"
              className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300 gap-1.5 text-xs font-bold"
            >
              <BarChart3 className="w-3.5 h-3.5" /> Overview
            </TabsTrigger>
            <TabsTrigger
              value="universities"
              className="rounded-xl data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 gap-1.5 text-xs font-bold"
            >
              <Building2 className="w-3.5 h-3.5" /> Universities
              {counts.pendingUniversities > 0 && (
                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-amber-600 text-white text-[10px]">
                  {counts.pendingUniversities}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="rounded-xl data-[state=active]:bg-rose-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 gap-1.5 text-xs font-bold"
            >
              <Flag className="w-3.5 h-3.5" /> Reports
              {counts.openReports > 0 && (
                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-rose-600 text-white text-[10px]">
                  {counts.openReports}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="rounded-xl data-[state=active]:bg-sky-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 gap-1.5 text-xs font-bold"
            >
              <UserCog className="w-3.5 h-3.5" /> Users
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ============================================================
            TAB 1: OVERVIEW / ANALYTICS
        ============================================================ */}
        <TabsContent value="overview" className="mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-xl font-black italic tracking-tighter mb-6 flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              Platform Analytics
            </h2>

            {countsLoading ? (
              <div className="flex items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                <p className="text-xs font-black italic tracking-widest text-muted-foreground uppercase">
                  Crunching numbers...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {statCards.map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06 }}
                    >
                      <div
                        className={cn(
                          "relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-gradient-to-br",
                          stat.color,
                          stat.textColor
                        )}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-lg shadow-lg text-white",
                                stat.iconColor
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <p className="text-sm font-medium opacity-80">
                              {stat.label}
                            </p>
                          </div>
                          <h3 className="text-3xl font-black italic tracking-tighter">
                            {stat.value.toLocaleString()}
                          </h3>
                        </div>
                        <div
                          className={cn(
                            "absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-10 blur-xl",
                            stat.iconColor
                          )}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Quick-access grid */}
            {!countsLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                <Card
                  className="bg-card/40 backdrop-blur-xl border-border/50 rounded-[2rem] p-6 cursor-pointer hover:border-amber-500/30 transition-all"
                  onClick={() => setActiveTab("universities")}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-black italic tracking-tighter text-lg">
                        University Queue
                      </h3>
                      <p className="text-sm text-muted-foreground italic">
                        {counts.pendingUniversities} pending
                        {counts.pendingUniversities === 1
                          ? " application"
                          : " applications"}{" "}
                        awaiting review
                      </p>
                    </div>
                  </div>
                </Card>
                <Card
                  className="bg-card/40 backdrop-blur-xl border-border/50 rounded-[2rem] p-6 cursor-pointer hover:border-rose-500/30 transition-all"
                  onClick={() => setActiveTab("reports")}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                      <Flag className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-black italic tracking-tighter text-lg">
                        Content Reports
                      </h3>
                      <p className="text-sm text-muted-foreground italic">
                        {counts.openReports} open{" "}
                        {counts.openReports === 1
                          ? "report"
                          : "reports"}{" "}
                        needing moderation
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* ============================================================
            TAB 2: UNIVERSITY APPROVALS
        ============================================================ */}
        <TabsContent value="universities" className="mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-xl font-black italic tracking-tighter mb-6 flex items-center gap-3">
              <Building2 className="h-5 w-5 text-amber-500" />
              Pending University Applications
            </h2>

            {uniLoading ? (
              <div className="flex items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500/40" />
                <p className="text-xs font-black italic tracking-widest text-muted-foreground uppercase">
                  Loading applications...
                </p>
              </div>
            ) : universities.length === 0 ? (
              <div className="text-center py-24 bg-card/20 rounded-[3rem] border-2 border-dashed border-border/50">
                <CheckCircle2 className="h-12 w-12 text-emerald-500/40 mx-auto mb-4" />
                <p className="text-lg font-black italic tracking-tighter">
                  All caught up!
                </p>
                <p className="text-muted-foreground italic text-sm mt-1">
                  No pending university applications right now.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {universities.map((uni, idx) => (
                    <motion.div
                      key={uni.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{
                        opacity: 0,
                        x: -100,
                        transition: { duration: 0.3 },
                      }}
                      transition={{ delay: idx * 0.04 }}
                    >
                      <Card className="bg-card/40 backdrop-blur-xl border-border/50 rounded-[1.5rem] shadow-lg overflow-hidden">
                        <div className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                <GraduationCap className="h-6 w-6" />
                              </div>
                              <div className="space-y-1">
                                <h3 className="font-black italic tracking-tighter text-lg leading-tight">
                                  {uni.name}
                                </h3>
                                {uni.abbreviation && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] font-black italic tracking-widest uppercase"
                                  >
                                    {uni.abbreviation}
                                  </Badge>
                                )}
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
                                  {uni.adminName && (
                                    <span className="flex items-center gap-1.5 italic">
                                      <UserCog className="h-3.5 w-3.5" />
                                      {uni.adminName}
                                    </span>
                                  )}
                                  {uni.adminEmail && (
                                    <span className="flex items-center gap-1.5 italic">
                                      <Mail className="h-3.5 w-3.5" />
                                      {uni.adminEmail}
                                    </span>
                                  )}
                                  {uni.website && (
                                    <span className="flex items-center gap-1.5 italic">
                                      <Globe className="h-3.5 w-3.5" />
                                      {uni.website}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 italic mt-1">
                                  Applied{" "}
                                  {formatDistanceToNow(
                                    new Date(uni.createdAt),
                                    { addSuffix: true }
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl font-black italic tracking-tight text-rose-500 border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-600"
                                disabled={processingUni === uni.id}
                                onClick={() =>
                                  handleUniversityAction(
                                    uni.id,
                                    "REJECTED"
                                  )
                                }
                              >
                                {processingUni === uni.id ? (
                                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                                ) : (
                                  <XCircle className="h-4 w-4 mr-1.5" />
                                )}
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                className="rounded-xl font-black italic tracking-tight bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                                disabled={processingUni === uni.id}
                                onClick={() =>
                                  handleUniversityAction(
                                    uni.id,
                                    "APPROVED"
                                  )
                                }
                              >
                                {processingUni === uni.id ? (
                                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                )}
                                Approve
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* ============================================================
            TAB 3: CONTENT MODERATION (FORUM REPORTS)
        ============================================================ */}
        <TabsContent value="reports" className="mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-xl font-black italic tracking-tighter mb-6 flex items-center gap-3">
              <Flag className="h-5 w-5 text-rose-500" />
              Open Forum Reports
            </h2>

            {reportsLoading ? (
              <div className="flex items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-rose-500/40" />
                <p className="text-xs font-black italic tracking-widest text-muted-foreground uppercase">
                  Loading reports...
                </p>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-24 bg-card/20 rounded-[3rem] border-2 border-dashed border-border/50">
                <CheckCircle2 className="h-12 w-12 text-emerald-500/40 mx-auto mb-4" />
                <p className="text-lg font-black italic tracking-tighter">
                  No open reports
                </p>
                <p className="text-muted-foreground italic text-sm mt-1">
                  The community is behaving well.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {reports.map((report, idx) => (
                    <motion.div
                      key={report.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{
                        opacity: 0,
                        x: -100,
                        transition: { duration: 0.3 },
                      }}
                      transition={{ delay: idx * 0.04 }}
                    >
                      <Card className="bg-card/40 backdrop-blur-xl border-border/50 rounded-[1.5rem] shadow-lg overflow-hidden">
                        <div className="p-6">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0 mt-0.5">
                                <AlertTriangle className="h-5 w-5" />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-[10px] font-black italic tracking-widest uppercase">
                                    {report.threadId && report.replyId
                                      ? "Reply Report"
                                      : report.threadId
                                        ? "Thread Report"
                                        : "Report"}
                                  </Badge>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 italic">
                                    {formatDistanceToNow(
                                      new Date(report.createdAt),
                                      { addSuffix: true }
                                    )}
                                  </span>
                                </div>
                                <p className="text-sm font-medium italic text-foreground/90 leading-relaxed">
                                  &ldquo;{report.reason}&rdquo;
                                </p>
                                <p className="text-xs text-muted-foreground italic">
                                  Reported by{" "}
                                  <span className="font-bold text-foreground/70">
                                    {(report.reporter as any)
                                      ?.fullName ?? "Unknown"}
                                  </span>
                                </p>
                                {report.threadId && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-lg text-xs font-bold italic text-primary gap-1.5 px-2 h-7"
                                    onClick={() =>
                                      router.push(
                                        `/forums/${report.threadId}`
                                      )
                                    }
                                  >
                                    <Eye className="h-3 w-3" />
                                    View Thread
                                  </Button>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl font-black italic tracking-tight"
                                disabled={
                                  processingReport === report.id
                                }
                                onClick={() =>
                                  handleDismissReport(report)
                                }
                              >
                                {processingReport === report.id ? (
                                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                                ) : (
                                  <XCircle className="h-4 w-4 mr-1.5" />
                                )}
                                Dismiss
                              </Button>
                              <Button
                                size="sm"
                                className="rounded-xl font-black italic tracking-tight bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20"
                                disabled={
                                  processingReport === report.id
                                }
                                onClick={() =>
                                  setConfirmDelete(report)
                                }
                              >
                                {processingReport === report.id ? (
                                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 mr-1.5" />
                                )}
                                Remove Content
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* ============================================================
            TAB 4: USER MANAGEMENT
        ============================================================ */}
        <TabsContent value="users" className="mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-xl font-black italic tracking-tighter mb-6 flex items-center gap-3">
              <Users className="h-5 w-5 text-sky-500" />
              User Directory
            </h2>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") fetchUsers();
                  }}
                  className="pl-10 rounded-xl bg-card/40 border-border/50 font-medium italic"
                />
              </div>
              <Select
                value={roleFilter}
                onValueChange={(v) => setRoleFilter(v)}
              >
                <SelectTrigger className="w-full sm:w-[180px] rounded-xl bg-card/40 border-border/50 font-bold italic">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="FACULTY">Faculty</SelectItem>
                  <SelectItem value="ALUMNI">Alumni</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={fetchUsers}
                className="rounded-xl font-black italic tracking-tight"
              >
                <Search className="h-4 w-4 mr-1.5" />
                Search
              </Button>
            </div>

            {usersLoading ? (
              <div className="flex items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-sky-500/40" />
                <p className="text-xs font-black italic tracking-widest text-muted-foreground uppercase">
                  Loading users...
                </p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-24 bg-card/20 rounded-[3rem] border-2 border-dashed border-border/50">
                <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-lg font-black italic tracking-tighter">
                  No users found
                </p>
                <p className="text-muted-foreground italic text-sm mt-1">
                  Try adjusting your search or filters.
                </p>
              </div>
            ) : (
              <Card className="bg-card/40 backdrop-blur-xl border-border/50 rounded-[2rem] shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/30">
                        <th className="text-left px-6 py-4 text-[10px] font-black italic tracking-widest uppercase text-muted-foreground">
                          User
                        </th>
                        <th className="text-left px-6 py-4 text-[10px] font-black italic tracking-widest uppercase text-muted-foreground">
                          Email
                        </th>
                        <th className="text-left px-6 py-4 text-[10px] font-black italic tracking-widest uppercase text-muted-foreground">
                          Role
                        </th>
                        <th className="text-left px-6 py-4 text-[10px] font-black italic tracking-widest uppercase text-muted-foreground">
                          University
                        </th>
                        <th className="text-left px-6 py-4 text-[10px] font-black italic tracking-widest uppercase text-muted-foreground">
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user, idx) => {
                        const uniData = user.University as any;
                        const uniName = Array.isArray(uniData)
                          ? uniData[0]?.name
                          : uniData?.name;
                        const uniAbbr = Array.isArray(uniData)
                          ? uniData[0]?.abbreviation
                          : uniData?.abbreviation;
                        const initials = user.fullName
                          ?.split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase();

                        return (
                          <motion.tr
                            key={user.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.02 }}
                            className="border-b border-border/10 hover:bg-muted/5 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                  {user.avatarUrl ? (
                                    <img
                                      src={user.avatarUrl}
                                      alt=""
                                      className="h-9 w-9 rounded-full object-cover"
                                    />
                                  ) : (
                                    initials || "U"
                                  )}
                                </div>
                                <span className="font-bold italic tracking-tight text-sm whitespace-nowrap">
                                  {user.fullName || "Unnamed"}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground italic">
                              {user.email || "—"}
                            </td>
                            <td className="px-6 py-4">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] font-black italic tracking-widest uppercase",
                                  roleBadgeColor[user.role] ??
                                    "bg-muted/10 text-muted-foreground"
                                )}
                              >
                                {user.role}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground italic whitespace-nowrap">
                              {uniAbbr || uniName || "—"}
                            </td>
                            <td className="px-6 py-4 text-xs text-muted-foreground/60 italic whitespace-nowrap">
                              {user.createdAt
                                ? formatDistanceToNow(
                                    new Date(user.createdAt),
                                    { addSuffix: true }
                                  )
                                : "—"}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-3 border-t border-border/20 text-xs text-muted-foreground italic">
                  Showing {users.length} users (max 50)
                </div>
              </Card>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Confirm Content Removal Dialog */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
      >
        <AlertDialogContent className="bg-card border-border rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black italic tracking-tighter text-xl">
              Remove Reported Content?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium italic text-muted-foreground">
              This will permanently delete the reported{" "}
              {confirmDelete?.replyId ? "reply" : "thread"} and mark the
              report as resolved. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-black italic tracking-tight bg-muted hover:bg-muted/80">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) handleRemoveContent(confirmDelete);
              }}
              className="rounded-xl font-black italic tracking-tight bg-rose-500 hover:bg-rose-600 text-white"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Remove Content
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
