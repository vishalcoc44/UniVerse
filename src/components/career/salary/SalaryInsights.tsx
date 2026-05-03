'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, DollarSign, Plus, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface SalaryReport {
  id: string;
  userId: string;
  role: string;
  company: string | null;
  location: string | null;
  baseSalary: number;
  experienceYears: number | null;
  isAnonymous: boolean;
  createdAt: string;
}

interface RoleStats {
  role: string;
  count: number;
  avg: number;
  min: number;
  max: number;
  reports: SalaryReport[];
}

const formatSalary = (n: number) => {
  if (n >= 100000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n.toLocaleString()}`;
};

export function SalaryInsights() {
  const [reports, setReports] = useState<SalaryReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [form, setForm] = useState({
    role: '', company: '', location: '', baseSalary: '', experienceYears: '', isAnonymous: true,
  });
  const [editingReportId, setEditingReportId] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('SalaryReport')
      .select('id, userId, role, company, location, baseSalary, experienceYears, isAnonymous, createdAt')
      .order('createdAt', { ascending: false });
    setReports((data as unknown as SalaryReport[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // FC-1 fix: SalaryReport admin RLS is is_platform_admin() (audit/fixes/05). Match here.
        const { data: profile } = await supabase.from('Profile').select('role, universityId').eq('id', user.id).single();
        setIsAdmin(profile?.role === 'ADMIN' && !profile?.universityId);
      }
      await fetchReports();
    })();
  }, []);

  const submitReport = async () => {
    if (!form.role || !form.baseSalary) return;
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }
    if (editingReportId) {
      const { error } = await supabase.from('SalaryReport').update({
        role: form.role,
        company: form.company || null,
        location: form.location || null,
        baseSalary: parseInt(form.baseSalary),
        experienceYears: form.experienceYears ? parseInt(form.experienceYears) : null,
        isAnonymous: form.isAnonymous,
      }).eq('id', editingReportId);
      if (error) { alert(error.message); setSubmitting(false); return; }
      setEditingReportId(null);
      setForm({ role: '', company: '', location: '', baseSalary: '', experienceYears: '', isAnonymous: true });
      setShowForm(false);
      await fetchReports();
      setSubmitting(false);
      return;
    }

    await supabase.from('SalaryReport').insert({
      userId: user.id,
      role: form.role,
      company: form.company || 'Anonymous',
      location: form.location || null,
      baseSalary: parseInt(form.baseSalary),
      experienceYears: form.experienceYears ? parseInt(form.experienceYears) : null,
      isAnonymous: form.isAnonymous,
    });
    setForm({ role: '', company: '', location: '', baseSalary: '', experienceYears: '', isAnonymous: true });
    setShowForm(false);
    await fetchReports();
    setSubmitting(false);
  };

  const startEditReport = (report: SalaryReport) => {
    setEditingReportId(report.id);
    setForm({
      role: report.role,
      company: report.company ?? '',
      location: report.location ?? '',
      baseSalary: String(report.baseSalary),
      experienceYears: report.experienceYears != null ? String(report.experienceYears) : '',
      isAnonymous: report.isAnonymous,
    });
    setShowForm(true);
  };

  const deleteReport = async (reportId: string) => {
    setActionId(reportId);
    const { error } = await supabase.from('SalaryReport').delete().eq('id', reportId);
    if (error) {
      alert(error.message);
      setActionId(null);
      return;
    }
    setReports(prev => prev.filter(r => r.id !== reportId));
    setActionId(null);
  };

  // Aggregate by role
  const byRole: RoleStats[] = Object.entries(
    reports.reduce((acc: Record<string, SalaryReport[]>, r) => {
      const key = r.role;
      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
    }, {})
  ).map(([role, roleReports]) => {
    const salaries = roleReports.map(r => r.baseSalary);
    return {
      role,
      count: roleReports.length,
      avg: Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length),
      min: Math.min(...salaries),
      max: Math.max(...salaries),
      reports: roleReports,
    };
  }).sort((a, b) => b.avg - a.avg);

  const maxAvg = byRole.length ? Math.max(...byRole.map(r => r.avg)) : 1;

  if (loading) return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading salary data...
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black text-lg italic">Salary Insights</h3>
          <p className="text-xs text-muted-foreground font-bold">{reports.length} anonymous reports</p>
        </div>
        <Button size="sm" className="h-8 text-[11px] font-black rounded-xl gap-1" onClick={() => setShowForm(s => !s)}>
          <Plus className="h-3.5 w-3.5" />
          Share Salary
        </Button>
      </div>

      {/* Submit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card/30 border border-border/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-black uppercase tracking-widest">Anonymous Salary Report</p>
                <button onClick={() => setShowForm(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Role title *" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  className="h-9 bg-card/40 border-border/40 rounded-xl text-xs" />
                <Input placeholder="Annual salary ($) *" type="number" value={form.baseSalary} onChange={e => setForm(p => ({ ...p, baseSalary: e.target.value }))}
                  className="h-9 bg-card/40 border-border/40 rounded-xl text-xs" />
                <Input placeholder="Company (optional)" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                  className="h-9 bg-card/40 border-border/40 rounded-xl text-xs" />
                <Input placeholder="Location (optional)" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  className="h-9 bg-card/40 border-border/40 rounded-xl text-xs" />
                <Input placeholder="Years of experience" type="number" value={form.experienceYears} onChange={e => setForm(p => ({ ...p, experienceYears: e.target.value }))}
                  className="h-9 bg-card/40 border-border/40 rounded-xl text-xs" />
              </div>
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input type="checkbox" checked={form.isAnonymous} onChange={e => setForm(p => ({ ...p, isAnonymous: e.target.checked }))} className="rounded" />
                Submit anonymously
              </label>
              <Button size="sm" className="h-8 text-[11px] font-black rounded-xl w-full" onClick={submitReport} disabled={submitting}>
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Submit Report'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* By-Role Chart */}
      {byRole.length === 0 ? (
        <div className="text-center py-10">
          <DollarSign className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-sm font-bold text-muted-foreground">No salary reports yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Be the first to share anonymously!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {byRole.map((stat, i) => (
            <motion.div
              key={stat.role}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "bg-card/40 border rounded-2xl p-3 cursor-pointer transition-all",
                selectedRole === stat.role ? "border-primary/50 bg-primary/5" : "border-border/40 hover:border-border"
              )}
              onClick={() => setSelectedRole(selectedRole === stat.role ? null : stat.role)}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-black">{stat.role}</p>
                <div className="text-right">
                  <p className="text-sm font-black italic text-primary">{formatSalary(stat.avg)}</p>
                  <p className="text-[8px] text-muted-foreground font-bold">{stat.count} report{stat.count !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="h-2 bg-border/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stat.avg / maxAvg) * 100}%` }}
                  transition={{ delay: i * 0.05 + 0.1, duration: 0.6, ease: 'easeOut' }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[8px] font-bold text-muted-foreground">{formatSalary(stat.min)} min</span>
                <span className="text-[8px] font-bold text-muted-foreground">{formatSalary(stat.max)} max</span>
              </div>

              {/* Drill down */}
              <AnimatePresence>
                {selectedRole === stat.role && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3 border-t border-border/30 space-y-2">
                      {stat.reports.map(r => (
                        <div key={r.id} className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-muted-foreground font-medium">
                            {r.isAnonymous ? 'Anonymous' : 'User'} {r.company ? `@ ${r.company}` : ''} {r.location ? `(${r.location})` : ''}
                            {r.experienceYears != null ? ` · ${r.experienceYears}yr exp` : ''}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="font-black text-foreground">{formatSalary(r.baseSalary)}</span>
                            {(isAdmin || r.userId === userId) && (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => startEditReport(r)}
                                    className="p-1 rounded-lg hover:bg-primary/10 text-muted-foreground"
                                    title="Edit report"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteReport(r.id)}
                                    disabled={actionId === r.id}
                                    className="p-1 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                                    title="Delete report"
                                  >
                                    {actionId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                  </button>
                                </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
