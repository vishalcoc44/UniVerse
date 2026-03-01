'use client';

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2, Plus, Building2, ChevronRight, Edit2,
  Trash2, ClipboardList, Calendar, ExternalLink, FileText,
  CheckCircle2, XCircle, Clock, MessageSquare, MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, Reorder } from "framer-motion";

type AppStatus = 'SAVED' | 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'WITHDRAWN';

interface Application {
  id: string;
  userId: string;
  jobId?: string;
  resumeId?: string;
  status: AppStatus;
  appliedAt: string;
  updatedAt: string;
  notes?: string;
  companyName?: string;
  jobTitle?: string;
  jobUrl?: string;
  job?: { title: string; company?: { name: string; logoUrl?: string } };
}

const COLUMNS: { key: AppStatus; label: string; color: string; bg: string; icon: React.ElementType }[] = [
  { key: 'SAVED',     label: 'Saved',       color: 'text-slate-400',  bg: 'bg-slate-500/10 border-slate-500/20',   icon: ClipboardList },
  { key: 'APPLIED',   label: 'Applied',     color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',      icon: FileText },
  { key: 'SCREENING', label: 'Screening',   color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20',    icon: Clock },
  { key: 'INTERVIEW', label: 'Interview',   color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20',  icon: MessageSquare },
  { key: 'OFFER',     label: 'Offer 🎉',   color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20',    icon: CheckCircle2 },
  { key: 'REJECTED',  label: 'Rejected',    color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20',        icon: XCircle },
];

interface AddModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (data: Partial<Application>) => void;
}

function AddApplicationModal({ open, onClose, onAdd }: AddModalProps) {
  const [form, setForm] = useState({ jobTitle: '', companyName: '', jobUrl: '', notes: '', status: 'APPLIED' as AppStatus });
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border/50 rounded-3xl p-6 w-full max-w-md space-y-4"
      >
        <h3 className="font-black text-xl italic tracking-tight">Track Application</h3>
        {(['jobTitle', 'companyName', 'jobUrl'] as const).map(k => (
          <Input
            key={k}
            placeholder={k === 'jobTitle' ? 'Job title *' : k === 'companyName' ? 'Company name *' : 'Job URL (optional)'}
            value={form[k]}
            onChange={e => setForm({ ...form, [k]: e.target.value })}
            className="h-10 rounded-2xl bg-background/40 border-border/40 text-sm font-bold"
          />
        ))}
        <div className="flex flex-wrap gap-2">
          {(['SAVED','APPLIED','SCREENING','INTERVIEW'] as AppStatus[]).map(s => (
            <button
              key={s}
              onClick={() => setForm({ ...form, status: s })}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-black border transition-all",
                form.status === s
                  ? "bg-primary/20 text-primary border-primary/30"
                  : "bg-muted/30 text-muted-foreground border-border/30"
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <Input
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          className="h-10 rounded-2xl bg-background/40 border-border/40 text-sm font-bold"
        />
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1 rounded-2xl" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1 rounded-2xl font-black italic"
            disabled={!form.jobTitle || !form.companyName}
            onClick={() => { onAdd(form); onClose(); setForm({ jobTitle: '', companyName: '', jobUrl: '', notes: '', status: 'APPLIED' }); }}
          >
            Track It
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export function ApplicationTracker() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const fetchApps = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from('JobApplication')
      .select('*, job:Job(title, company:Company(name, logoUrl))')
      .eq('userId', userId)
      .order('updatedAt', { ascending: false });
    setApps((data ?? []) as Application[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const updateStatus = async (id: string, status: AppStatus) => {
    await supabase.from('JobApplication').update({ status, updatedAt: new Date().toISOString() }).eq('id', id);
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const deleteApp = async (id: string) => {
    await supabase.from('JobApplication').delete().eq('id', id);
    setApps(prev => prev.filter(a => a.id !== id));
  };

  const addApp = async (data: Partial<Application>) => {
    if (!userId) return;
    const { data: newApp } = await supabase
      .from('JobApplication')
      .insert({ userId, ...data })
      .select()
      .single();
    if (newApp) setApps(prev => [newApp as Application, ...prev]);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  const stats = COLUMNS.map(c => ({ ...c, count: apps.filter(a => a.status === c.key).length }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter">Application Tracker</h2>
          <p className="text-xs text-muted-foreground font-bold mt-0.5">
            {apps.length} total applications tracked
          </p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="h-9 px-4 rounded-2xl font-black text-xs"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Track Application
        </Button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map(col => (
          <div key={col.key} className={cn("rounded-2xl p-3 border text-center", col.bg)}>
            <p className={cn("text-2xl font-black italic", col.color)}>{col.count}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mt-0.5">{col.label.replace(' 🎉', '')}</p>
          </div>
        ))}
      </div>

      {/* Kanban board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {COLUMNS.map(col => {
            const columnApps = apps.filter(a => a.status === col.key);
            const Icon = col.icon;
            return (
              <div key={col.key} className="w-64 shrink-0">
                {/* Column header */}
                <div className={cn("flex items-center gap-2 px-3 py-2 rounded-2xl border mb-3", col.bg)}>
                  <Icon className={cn("h-3.5 w-3.5", col.color)} />
                  <span className={cn("text-xs font-black uppercase tracking-wider", col.color)}>{col.label}</span>
                  <span className={cn("ml-auto text-xs font-black", col.color)}>{columnApps.length}</span>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  <AnimatePresence>
                    {columnApps.map(app => {
                      const company = app.job?.company?.name ?? app.companyName ?? 'Unknown';
                      const title = app.job?.title ?? app.jobTitle ?? 'Unknown Role';
                      const logo = app.job?.company?.logoUrl;
                      return (
                        <motion.div
                          key={app.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-3 group hover:border-primary/30 transition-all"
                        >
                          <div className="flex items-start gap-2">
                            <div className="h-8 w-8 rounded-xl bg-muted/50 border border-border/30 flex items-center justify-center shrink-0 overflow-hidden">
                              {logo ? (
                                <img src={logo} alt={company} className="h-full w-full object-cover" />
                              ) : (
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black italic truncate">{title}</p>
                              <p className="text-[10px] text-muted-foreground font-bold truncate">{company}</p>
                            </div>
                          </div>

                          {app.notes && (
                            <p className="text-[10px] text-muted-foreground mt-2 line-clamp-2 italic">{app.notes}</p>
                          )}

                          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/20 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[9px] text-muted-foreground font-bold">
                              {new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            <div className="flex gap-1 ml-auto">
                              {app.jobUrl && (
                                <button
                                  className="p-1 rounded-lg hover:bg-muted/50 text-muted-foreground"
                                  onClick={() => window.open(app.jobUrl, '_blank')}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </button>
                              )}
                              {/* Move to next status */}
                              {col.key !== 'OFFER' && col.key !== 'REJECTED' && col.key !== 'WITHDRAWN' && (() => {
                                const nextIdx = COLUMNS.findIndex(c => c.key === col.key) + 1;
                                const next = COLUMNS[nextIdx];
                                return next ? (
                                  <button
                                    className="p-1 rounded-lg hover:bg-muted/50 text-muted-foreground"
                                    title={`Move to ${next.label}`}
                                    onClick={() => updateStatus(app.id, next.key)}
                                  >
                                    <ChevronRight className="h-3 w-3" />
                                  </button>
                                ) : null;
                              })()}
                              <button
                                className="p-1 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                                onClick={() => deleteApp(app.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {columnApps.length === 0 && (
                    <div className="border border-dashed border-border/30 rounded-2xl p-4 text-center">
                      <p className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-wider">Empty</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AddApplicationModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={addApp} />
    </div>
  );
}
