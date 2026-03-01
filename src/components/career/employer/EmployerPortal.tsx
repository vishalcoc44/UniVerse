'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Briefcase, Plus, Users, Check, X, ChevronRight, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface PostedJob {
  id: string;
  title: string;
  status: string;
  applicationCount: number;
  createdAt: string;
}

interface Applicant {
  id: string;
  userId: string;
  status: string;
  appliedAt: string;
  user: {
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
  };
}

const POST_FORM_DEFAULTS = {
  title: '', description: '', location: '', salary: '', jobType: 'FULL_TIME', isRemote: false, applyUrl: '', skills: '',
};

export function EmployerPortal() {
  const [role, setRole] = useState<string | null>(null);
  const [postedJobs, setPostedJobs] = useState<PostedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostForm, setShowPostForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(POST_FORM_DEFAULTS);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [allCompanies, setAllCompanies] = useState<{ id: string; name: string }[]>([]);
  const [adminCompanyId, setAdminCompanyId] = useState<string>('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from('Profile')
        .select('role')
        .eq('id', user.id)
        .single();
      const userRole = profile?.role ?? null;
      setRole(userRole);

      if (userRole === 'EMPLOYER' || userRole === 'ADMIN') {
        const { data: employer } = await supabase
          .from('EmployerProfile')
          .select('companyId')
          .eq('userId', user.id)
          .single();

        const resolvedCompanyId = employer?.companyId ?? null;
        setCompanyId(resolvedCompanyId);

        if (userRole === 'ADMIN' || !resolvedCompanyId) {
          // Load all companies so admin can pick which one to post for
          const { data: companies } = await supabase
            .from('Company')
            .select('id, name')
            .order('name');
          setAllCompanies((companies ?? []) as { id: string; name: string }[]);
          if (resolvedCompanyId) setAdminCompanyId(resolvedCompanyId);
          else if (companies?.[0]) setAdminCompanyId(companies[0].id);

          if (userRole !== 'ADMIN') {
            const { data: jobsByPoster } = await supabase
              .from('Job')
              .select('id, title, status, createdAt, JobApplication(count)')
              .eq('postedById', user.id)
              .order('createdAt', { ascending: false });
            setPostedJobs((jobsByPoster ?? []).map((j: Record<string, unknown>) => ({
              id: j.id as string,
              title: j.title as string,
              status: j.status as string,
              applicationCount: (j.JobApplication as Array<{count: number}>)?.[0]?.count ?? 0,
              createdAt: j.createdAt as string,
            })));
          }

          if (userRole === 'ADMIN') {
          // Admin sees ALL jobs across all companies
            const { data: jobs } = await supabase
              .from('Job')
              .select('id, title, status, createdAt, JobApplication(count)')
              .order('createdAt', { ascending: false });
            setPostedJobs((jobs ?? []).map((j: Record<string, unknown>) => ({
              id: j.id as string,
              title: j.title as string,
              status: j.status as string,
              applicationCount: (j.JobApplication as Array<{count: number}>)?.[0]?.count ?? 0,
              createdAt: j.createdAt as string,
            })));
          }
        } else if (resolvedCompanyId) {
          const { data: jobs } = await supabase
            .from('Job')
            .select('id, title, status, createdAt, JobApplication(count)')
            .eq('companyId', resolvedCompanyId)
            .order('createdAt', { ascending: false });
          setPostedJobs((jobs ?? []).map((j: Record<string, unknown>) => ({
            id: j.id as string,
            title: j.title as string,
            status: j.status as string,
            applicationCount: (j.JobApplication as Array<{count: number}>)?.[0]?.count ?? 0,
            createdAt: j.createdAt as string,
          })));
        }
      }
      setLoading(false);
    })();
  }, []);

  const loadApplicants = async (jobId: string) => {
    if (selectedJobId === jobId) { setSelectedJobId(null); return; }
    setSelectedJobId(jobId);
    setApplicantsLoading(true);
    const { data } = await supabase
      .from('JobApplication')
      .select('id, userId, status, appliedAt, Profile:userId(name, avatarUrl)')
      .eq('jobId', jobId)
      .order('appliedAt', { ascending: false });

    setApplicants((data ?? []).map((a: Record<string, unknown>) => ({
      id: a.id as string,
      userId: a.userId as string,
      status: a.status as string,
      appliedAt: a.appliedAt as string,
      user: {
        name: (a.Profile as {name: string | null})?.name ?? null,
        email: null,
        avatarUrl: (a.Profile as {avatarUrl: string | null})?.avatarUrl ?? null,
      },
    })));
    setApplicantsLoading(false);
  };

  const updateApplicantStatus = async (appId: string, newStatus: string) => {
    setActionId(appId);
    await supabase.from('JobApplication').update({ status: newStatus }).eq('id', appId);
    setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
    setActionId(null);
  };

  const postJob = async () => {
    const effectiveCompanyId = role === 'ADMIN' ? adminCompanyId : companyId;
    const pickedCompanyId = effectiveCompanyId || adminCompanyId;
    if (!form.title || !pickedCompanyId) {
      alert('Please choose a company before posting.');
      return;
    }
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }

    const skills = form.skills.split(',').map(s => s.trim()).filter(Boolean);

    if (editingJobId) {
      const { error, data: updated } = await supabase.from('Job').update({
        companyId: pickedCompanyId,
        title: form.title,
        description: form.description || null,
        location: form.location || null,
        isRemote: form.isRemote,
        salaryMax: form.salary ? parseInt(form.salary) : null,
        type: form.jobType,
        applyUrl: form.applyUrl || null,
        skills,
      }).eq('id', editingJobId).select('id, title, status, createdAt, JobApplication(count)').single();

      if (error) {
        alert(error.message);
        setSubmitting(false);
        return;
      }

      if (updated) {
        setPostedJobs(prev => prev.map(j => j.id === editingJobId ? {
          id: updated.id as string,
          title: updated.title as string,
          status: updated.status as string,
          applicationCount: (updated.JobApplication as Array<{count: number}>)?.[0]?.count ?? 0,
          createdAt: updated.createdAt as string,
        } : j));
      }

      setEditingJobId(null);
      setForm(POST_FORM_DEFAULTS);
      setShowPostForm(false);
      setSubmitting(false);
      return;
    }

    const { error, data: created } = await supabase.from('Job').insert({
      companyId: pickedCompanyId,
      postedById: user.id,
      title: form.title,
      description: form.description || null,
      location: form.location || null,
      isRemote: form.isRemote,
      salaryMax: form.salary ? parseInt(form.salary) : null,
      type: form.jobType,
      applyUrl: form.applyUrl || null,
      skills,
      status: 'ACTIVE',
    }).select('id, title, status, createdAt, JobApplication(count)').single();

    if (error) {
      alert(error.message);
      setSubmitting(false);
      return;
    }

    if (created) {
      setPostedJobs(prev => [{
        id: created.id as string,
        title: created.title as string,
        status: created.status as string,
        applicationCount: (created.JobApplication as Array<{count: number}>)?.[0]?.count ?? 0,
        createdAt: created.createdAt as string,
      }, ...prev]);
    }
    setForm(POST_FORM_DEFAULTS);
    setShowPostForm(false);
    setSubmitting(false);
  };

  const startEditJob = async (jobId: string) => {
    setSubmitting(true);
    const { data, error } = await supabase.from('Job').select('companyId, title, description, location, isRemote, salaryMax, type, applyUrl, skills').eq('id', jobId).single();
    setSubmitting(false);
    if (error || !data) {
      alert(error?.message ?? 'Failed to load job for editing');
      return;
    }

    setEditingJobId(jobId);
    if (role === 'ADMIN' && data.companyId) setAdminCompanyId(data.companyId as string);
    setForm({
      title: data.title ?? '',
      description: data.description ?? '',
      location: data.location ?? '',
      salary: data.salaryMax ? String(data.salaryMax) : '',
      jobType: data.type ?? 'FULL_TIME',
      isRemote: data.isRemote ?? false,
      applyUrl: data.applyUrl ?? '',
      skills: Array.isArray(data.skills) ? (data.skills as string[]).join(', ') : (data.skills as string ?? ''),
    });
    setShowPostForm(true);
  };

  const deleteJob = async (jobId: string) => {
    if (!confirm('Delete this job posting?')) return;
    setActionId(`delete-${jobId}`);
    const { error } = await supabase.from('Job').delete().eq('id', jobId);
    if (error) {
      alert(error.message);
      setActionId(null);
      return;
    }
    setPostedJobs(prev => prev.filter(j => j.id !== jobId));
    if (selectedJobId === jobId) setSelectedJobId(null);
    setActionId(null);
  };

  if (loading) return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading employer portal...
    </div>
  );

  if (role !== 'EMPLOYER' && role !== 'ADMIN') return (
    <div className="text-center py-12">
      <Briefcase className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
      <p className="font-black text-sm">Employer Access Only</p>
      <p className="text-xs text-muted-foreground mt-1">Contact an admin to request employer access.</p>
    </div>
  );

  const STATUS_COLORS: Record<string, string> = {
    ACTIVE: 'bg-green-500/20 text-green-300 border-green-500/40',
    CLOSED: 'bg-red-500/20 text-red-300 border-red-500/40',
    DRAFT:  'bg-border/40 text-muted-foreground border-border/40',
    PAUSED: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  };

  const APP_STATUS_COLORS: Record<string, string> = {
    APPLIED: 'text-blue-400',
    SCREENING: 'text-amber-400',
    INTERVIEW: 'text-purple-400',
    OFFER: 'text-green-400',
    REJECTED: 'text-red-400',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black text-lg italic">Employer Portal</h3>
          <p className="text-xs text-muted-foreground font-bold">{postedJobs.length} posted jobs</p>
        </div>
        <Button size="sm" className="h-8 text-[11px] font-black rounded-xl gap-1" onClick={() => setShowPostForm(s => !s)}>
          <Plus className="h-3.5 w-3.5" /> Post Job
        </Button>
      </div>

      {/* Post Job Form */}
      <AnimatePresence>
        {showPostForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card/30 border border-border/30 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-black uppercase tracking-widest">New Job Posting</p>
              <div className="grid grid-cols-2 gap-3">
                {(role === 'ADMIN' || !companyId) && allCompanies.length > 0 && (
                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground pl-1">Post on behalf of *</label>
                    <select
                      value={adminCompanyId}
                      onChange={e => setAdminCompanyId(e.target.value)}
                      className="h-9 bg-card/40 border border-primary/40 rounded-xl text-xs px-2 text-foreground"
                    >
                      {allCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
                <Input placeholder="Job title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="h-9 bg-card/40 border-border/40 rounded-xl text-xs col-span-2" />
                <Input placeholder="Location" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  className="h-9 bg-card/40 border-border/40 rounded-xl text-xs" />
                <Input placeholder="Max salary ($)" type="number" value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))}
                  className="h-9 bg-card/40 border-border/40 rounded-xl text-xs" />
                <Input placeholder="Apply URL (optional)" value={form.applyUrl} onChange={e => setForm(p => ({ ...p, applyUrl: e.target.value }))}
                  className="h-9 bg-card/40 border-border/40 rounded-xl text-xs col-span-2" />
                <select value={form.jobType} onChange={e => setForm(p => ({ ...p, jobType: e.target.value }))}
                  className="h-9 bg-card/40 border border-border/40 rounded-xl text-xs px-2 col-span-2 text-foreground">
                  {['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT', 'FREELANCE'].map(t => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>
                <label className="col-span-2 flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isRemote}
                    onChange={e => setForm(p => ({ ...p, isRemote: e.target.checked }))}
                    className="rounded"
                  />
                  Remote role
                </label>
                <Input placeholder="Skills (comma-separated)" value={form.skills} onChange={e => setForm(p => ({ ...p, skills: e.target.value }))}
                  className="h-9 bg-card/40 border-border/40 rounded-xl text-xs col-span-2" />
                <textarea
                  placeholder="Job description..."
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="col-span-2 bg-card/40 border border-border/40 rounded-xl text-xs px-3 py-2 resize-none text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
                />
              </div>
              <Button size="sm" className="h-8 text-[11px] font-black rounded-xl w-full" onClick={postJob} disabled={submitting}>
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (editingJobId ? 'Update Job' : 'Publish Job')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Job List */}
      {postedJobs.length === 0 ? (
        <div className="text-center py-8">
          <Briefcase className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-30" />
          <p className="text-sm font-bold text-muted-foreground">No jobs posted yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {postedJobs.map(job => (
            <div key={job.id} className="bg-card/40 border border-border/40 rounded-2xl overflow-hidden">
              <div
                role="button"
                tabIndex={0}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-card/60 transition-all"
                onClick={() => loadApplicants(job.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                    e.preventDefault();
                    // @ts-ignore
                    loadApplicants(job.id);
                  }
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-black text-sm truncate">{job.title}</p>
                    <span className={cn("text-[8px] font-black px-2 py-0.5 rounded-full border", STATUS_COLORS[job.status] ?? STATUS_COLORS.ACTIVE)}>
                      {job.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold">
                    <Users className="h-3 w-3" />
                    {job.applicationCount} applicants
                    <span>· Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditJob(job.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground"
                    title="Edit job"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteJob(job.id);
                    }}
                    disabled={actionId === `delete-${job.id}`}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                    title="Delete job"
                  >
                    {actionId === `delete-${job.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform",
                  selectedJobId === job.id ? "rotate-90" : "")} />
              </div>

              <AnimatePresence>
                {selectedJobId === job.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-border/20"
                  >
                    <div className="p-3 space-y-2">
                      {applicantsLoading ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading applicants...
                        </div>
                      ) : applicants.length === 0 ? (
                        <p className="text-xs text-muted-foreground p-2">No applicants yet.</p>
                      ) : (
                        applicants.map(app => (
                          <div key={app.id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-card/40 transition-all">
                            <div className="h-7 w-7 rounded-full bg-border/40 flex items-center justify-center text-[10px] font-black shrink-0">
                              {app.user.name?.charAt(0) ?? 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black truncate">{app.user.name ?? 'Applicant'}</p>
                              <p className={cn("text-[9px] font-black", APP_STATUS_COLORS[app.status] ?? 'text-muted-foreground')}>
                                {app.status}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {app.status !== 'INTERVIEW' && (
                                <button
                                  className="p-1 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400"
                                  onClick={() => updateApplicantStatus(app.id, 'INTERVIEW')}
                                  disabled={actionId === app.id}
                                  title="Move to Interview"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {app.status !== 'REJECTED' && (
                                <button
                                  className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                                  onClick={() => updateApplicantStatus(app.id, 'REJECTED')}
                                  disabled={actionId === app.id}
                                  title="Reject"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
