"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useUserUniversity } from "@/hooks/useUserUniversity";
import { Plus, Pencil, Trash2, Users, UserPlus, UserMinus } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type ResearchProject = {
  id: string;
  title: string;
  description?: string | null;
  status?: "IDEA" | "ACTIVE" | "PAUSED" | "COMPLETED";
  universityId?: string | null;
  createdAt?: string | null;
};

const emptyForm = { title: "", description: "", status: "IDEA" };

type ResearchProjectsCardProps = {
  canManage?: (projectId: string) => boolean;
  onChange?: () => void;
};

export function ResearchProjectsCard({ canManage, onChange }: ResearchProjectsCardProps) {
  const { universityId, userId, loading: userContextLoading } = useUserUniversity();

  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [loading, setLoading] = useState(true);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = async () => {
    if (!universityId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ResearchProject")
        .select("*")
        .eq("universityId", universityId)
        .order("createdAt", { ascending: false });
      if (error) throw error;
      setProjects((data ?? []) as ResearchProject[]);
    } catch (err) {
      toast.error("Failed to load research projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userContextLoading) fetchProjects();
  }, [universityId, userContextLoading]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpenDialog(true);
  };

  const openEdit = (project: ResearchProject) => {
    setEditingId(project.id);
    setForm({
      title: project.title || "",
      description: project.description || "",
      status: project.status || "IDEA",
    });
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!universityId) {
      toast.error("Add your university in profile first.");
      return;
    }
    if (!form.title.trim()) {
      toast.error("Project title is required.");
      return;
    }
    setSubmitting(true);
    try {
      const payload: Partial<ResearchProject> = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: (form.status as ResearchProject["status"]) || "IDEA",
        universityId,
      };

      if (editingId) {
        const { error } = await supabase.from("ResearchProject").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Project updated.");
      } else {
        const { error } = await supabase.from("ResearchProject").insert({ id: crypto.randomUUID(), ...payload });
        if (error) throw error;
        void import("@/lib/analytics").then(({ track }) => track("create_research_project"));
        toast.success("Project created.");
      }

      setOpenDialog(false);
      await fetchProjects();
      onChange?.();
    } catch {
      toast.error("Save failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project? This action cannot be undone.")) return;
    try {
      const { error } = await supabase.from("ResearchProject").delete().eq("id", id);
      if (error) throw error;
      toast.success("Project removed.");
      await fetchProjects();
      onChange?.();
    } catch {
      toast.error("Failed to delete project.");
    }
  };

  // Member management
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [managingProjectId, setManagingProjectId] = useState<string | null>(null);
  const [projectCollaborators, setProjectCollaborators] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [inviteQuery, setInviteQuery] = useState("");
  const [inviteResults, setInviteResults] = useState<any[]>([]);
  const [searchingProfiles, setSearchingProfiles] = useState(false);
  const [inviting, setInviting] = useState(false);

  const openManage = async (projectId: string) => {
    setManagingProjectId(projectId);
    setManageDialogOpen(true);
    await fetchCollaborators(projectId);
  };

  const fetchCollaborators = async (projectId: string | null) => {
    if (!projectId) return;
    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from("ProjectCollaborator")
        .select("id, role, user:Profile(id, fullName, username, avatarUrl)")
        .eq("projectId", projectId)
        .order("id", { ascending: true });
      if (error) throw error;
      setProjectCollaborators((data ?? []) as any[]);
    } catch (err) {
      toast.error("Failed to load collaborators.");
    } finally {
      setLoadingMembers(false);
    }
  };

  const searchProfiles = async (q: string) => {
    const query = q.trim();
    if (!query) return setInviteResults([]);
    setSearchingProfiles(true);
    try {
      // search by username or fullName
      const { data } = await supabase
        .from("Profile")
        .select("id, fullName, username, avatarUrl")
        .or(`username.ilike.%${query}%,fullName.ilike.%${query}%`)
        .limit(20);
      setInviteResults((data ?? []) as any[]);
    } catch {
      toast.error("Profile search failed.");
    } finally {
      setSearchingProfiles(false);
    }
  };

  const inviteUserToProject = async (userIdToInvite: string, role: string = "MEMBER") => {
    if (!managingProjectId) return;
    setInviting(true);
    try {
      const { error } = await supabase.from("ProjectCollaborator").insert({ id: crypto.randomUUID(), projectId: managingProjectId, userId: userIdToInvite, role });
      if (!error) void import("@/lib/analytics").then(({ track }) => track("invite_research_collaborator", { role }));
      if (error) throw error;
      toast.success("User invited to project.");
      setInviteQuery("");
      setInviteResults([]);
      await fetchCollaborators(managingProjectId);
      onChange?.();
    } catch (err: any) {
      const msg = err?.message || "Invite failed.";
      if (msg.includes("duplicate") || msg.includes("unique")) {
        toast.info("User is already a collaborator.");
      } else {
        toast.error(msg);
      }
    } finally {
      setInviting(false);
    }
  };

  const updateCollaboratorRole = async (collabId: string, nextRole: string) => {
    try {
      const { error } = await supabase.from("ProjectCollaborator").update({ role: nextRole }).eq("id", collabId);
      if (error) throw error;
      toast.success("Role updated.");
      if (managingProjectId) await fetchCollaborators(managingProjectId);
      onChange?.();
    } catch {
      toast.error("Failed to update role.");
    }
  };

  const removeCollaborator = async (collabId: string) => {
    if (!confirm("Remove this collaborator from project?")) return;
    try {
      const { error } = await supabase.from("ProjectCollaborator").delete().eq("id", collabId);
      if (error) throw error;
      toast.success("Collaborator removed.");
      if (managingProjectId) await fetchCollaborators(managingProjectId);
      onChange?.();
    } catch {
      toast.error("Failed to remove collaborator.");
    }
  };

  if (!userContextLoading && !universityId) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">Add your university in profile to manage research projects.</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Research Projects</CardTitle>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> New Project
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-64">
            <ScrollArea>
              <div className="space-y-3 p-2">
                {loading ? (
                  <div className="text-sm text-muted-foreground p-4">Loading projects…</div>
                ) : projects.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-4">No projects yet. Create one to get started.</div>
                ) : (
                  projects.map((p) => (
                    <div key={p.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border/40 bg-card/40">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold">{p.title}</h4>
                          <Badge variant="secondary">{p.status ?? "IDEA"}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{p.description ?? "—"}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Users className="h-3.5 w-3.5" /> <span>Manage collaborators</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        {canManage?.(p.id) ? (
                          <>
                            <Button size="sm" variant="outline" onClick={() => openEdit(p)} className="gap-2"><Pencil className="h-4 w-4" /> Edit</Button>
                            <Button size="sm" variant="secondary" onClick={() => openManage(p.id)} className="gap-2"><Users className="h-4 w-4" /> Manage</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)} className="gap-2"><Trash2 className="h-4 w-4" /> Delete</Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Project" : "New Project"}</DialogTitle>
            <DialogDescription>{editingId ? "Update project details." : "Create a new research project to manage."}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IDEA">Idea</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={submitting}>{submitting ? "Saving…" : editingId ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Members Dialog */}
      <Dialog open={manageDialogOpen} onOpenChange={(open) => { if (!open) { setManagingProjectId(null); setProjectCollaborators([]); } setManageDialogOpen(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Project Members</DialogTitle>
            <DialogDescription>Invite, remove, or change roles for collaborators.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label>Invite by name or username</Label>
              <div className="flex gap-2">
                <Input value={inviteQuery} onChange={(e) => setInviteQuery(e.target.value)} placeholder="Search students..." />
                <Button onClick={() => searchProfiles(inviteQuery)} disabled={searchingProfiles || !inviteQuery.trim()}>{searchingProfiles ? "Searching…" : "Search"}</Button>
              </div>
              {inviteResults.length > 0 && (
                <div className="space-y-2 mt-2">
                  {inviteResults.map((res) => (
                    <div key={res.id} className="flex items-center justify-between gap-2 p-2 rounded border border-border/30">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8"><AvatarImage src={res.avatarUrl || undefined} /><AvatarFallback>{res.fullName?.[0] || res.username?.[0] || "?"}</AvatarFallback></Avatar>
                        <div>
                          <div className="font-bold text-sm">{res.fullName}</div>
                          <div className="text-xs text-muted-foreground">@{res.username}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select defaultValue="MEMBER" onValueChange={(v) => inviteUserToProject(res.id, v)}>
                          <SelectTrigger className="h-8"><SelectValue placeholder="Role" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MEMBER">Member</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="LEAD">Lead</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="sm" onClick={() => inviteUserToProject(res.id)} disabled={inviting} className="gap-2">{inviting ? "Inviting…" : <><UserPlus className="h-4 w-4" /> Invite</>}</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label>Current Collaborators</Label>
              <div className="space-y-2 mt-2">
                {loadingMembers ? (
                  <div className="text-sm text-muted-foreground">Loading collaborators…</div>
                ) : projectCollaborators.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No collaborators yet.</div>
                ) : (
                  projectCollaborators.map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-3 p-2 rounded border border-border/30">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8"><AvatarImage src={c.user?.avatarUrl || undefined} /><AvatarFallback>{c.user?.fullName?.[0] || c.user?.username?.[0] || "?"}</AvatarFallback></Avatar>
                        <div>
                          <div className="font-bold text-sm">{c.user?.fullName || c.user?.username}</div>
                          <div className="text-xs text-muted-foreground">@{c.user?.username}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select value={c.role || "MEMBER"} onValueChange={(v) => updateCollaboratorRole(c.id, v)}>
                          <SelectTrigger className="h-8"><SelectValue placeholder="Role" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LEAD">Lead</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="MEMBER">Member</SelectItem>
                            <SelectItem value="APPLICANT">Applicant</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="destructive" onClick={() => removeCollaborator(c.id)} className="gap-2"><UserMinus className="h-4 w-4" /> Remove</Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setManageDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default ResearchProjectsCard;
