'use client';

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { JobCard, type Job } from "./JobCard";
import { JobFiltersPanel, type JobFilters } from "./JobFilters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Sparkles,
  Loader2,
  RefreshCw,
  Bookmark,
  TrendingUp,
  Plus,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_FILTERS: JobFilters = {
  query: '',
  types: [],
  isRemote: null,
  skills: [],
  salaryMin: null,
  salaryMax: null,
};

type ViewMode = 'all' | 'saved' | 'recommended';

interface ApplyModalState {
  open: boolean;
  job?: Job;
}

export function JobBoard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [loading, setLoading] = useState(true);
  const [recommendedLoading, setRecommendedLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [applyModal, setApplyModal] = useState<ApplyModalState>({ open: false });

  // Fetch user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  // Fetch saved job IDs
  useEffect(() => {
    if (!userId) return;
    supabase.from('SavedJob').select('jobId').eq('userId', userId).then(({ data }) => {
      if (data) setSavedIds(new Set(data.map(r => r.jobId)));
    });
  }, [userId]);

  // Fetch jobs
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('Job')
        .select(`
          *,
          company:Company(id, name, logoUrl, industry, verified)
        `)
        .eq('status', 'ACTIVE')
        .order('createdAt', { ascending: false })
        .limit(50);

      if (filters.types.length > 0) {
        query = query.in('type', filters.types);
      }
      if (filters.isRemote === true) {
        query = query.eq('isRemote', true);
      }
      if (filters.salaryMin !== null) {
        query = query.gte('salaryMin', filters.salaryMin);
      }
      if (filters.salaryMax !== null) {
        query = query.lte('salaryMax', filters.salaryMax);
      }

      const { data, error } = await query;
      if (!error && data) {
        setJobs(data as Job[]);
      }
    } finally {
      setLoading(false);
    }
  }, [filters.types, filters.isRemote, filters.salaryMin, filters.salaryMax]);

  // Fetch AI-matched recommended jobs via Edge Function
  const fetchRecommended = useCallback(async () => {
    if (!userId) return;
    setRecommendedLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('match-jobs', {
        body: { userId },
      });
      if (!error && Array.isArray(data?.matches)) {
        setRecommendedJobs(data.matches as Job[]);
      } else {
        // Fallback: show all jobs sorted by savedIds overlap
        setRecommendedJobs(jobs);
      }
    } catch {
      setRecommendedJobs(jobs);
    } finally {
      setRecommendedLoading(false);
    }
  }, [userId, jobs]);

  // Trigger recommended fetch when switching to that tab
  useEffect(() => {
    if (viewMode === 'recommended' && recommendedJobs.length === 0) {
      fetchRecommended();
    }
  }, [viewMode, fetchRecommended, recommendedJobs.length]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Client-side text/skill filter
  const filteredJobs = useMemo(() => {
    let result = viewMode === 'recommended' ? recommendedJobs : jobs;

    if (filters.query.trim()) {
      const q = filters.query.toLowerCase();
      result = result.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.company?.name?.toLowerCase().includes(q) ||
        j.description?.toLowerCase().includes(q) ||
        j.skills.some(s => s.toLowerCase().includes(q))
      );
    }

    if (filters.skills.length > 0) {
      result = result.filter(j =>
        filters.skills.some(fs => j.skills.map(s => s.toLowerCase()).includes(fs.toLowerCase()))
      );
    }

    if (viewMode === 'saved') {
      result = result.filter(j => savedIds.has(j.id));
    }

    return result.map(j => ({ ...j, isSaved: savedIds.has(j.id) }));
  }, [jobs, recommendedJobs, filters.query, filters.skills, viewMode, savedIds]);

  const handleSave = async (jobId: string) => {
    if (!userId) return;
    if (savedIds.has(jobId)) {
      await supabase.from('SavedJob').delete().eq('userId', userId).eq('jobId', jobId);
      setSavedIds(prev => { const n = new Set(prev); n.delete(jobId); return n; });
    } else {
      await supabase.from('SavedJob').insert({ userId, jobId });
      setSavedIds(prev => new Set([...prev, jobId]));
    }
  };

  const handleApply = async (job: Job) => {
    if (!userId) return;
    // Log application
    const { error } = await supabase.from('JobApplication').insert({
      userId,
      jobId: job.id,
      status: 'APPLIED',
      companyName: job.company?.name,
      jobTitle: job.title,
      jobUrl: job.applyUrl,
    });
    if (!error && job.applyUrl) {
      window.open(job.applyUrl, '_blank');
    }
    setApplyModal({ open: false });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter">Job Board</h2>
          <p className="text-xs text-muted-foreground font-bold mt-0.5">
            {filteredJobs.length} opportunities found
          </p>
        </div>
        <Button
          onClick={fetchJobs}
          variant="outline"
          size="sm"
          className="h-9 px-4 rounded-2xl font-black text-xs border-border/50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* View mode tabs */}
      <div className="flex gap-2">
        {([
          { key: 'all', label: 'All Jobs', icon: Briefcase },
          { key: 'saved', label: `Saved (${savedIds.size})`, icon: Bookmark },
          { key: 'recommended', label: 'For You', icon: Sparkles },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setViewMode(key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-black transition-all border",
              viewMode === key
                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                : "bg-card/40 text-muted-foreground border-border/50 hover:border-primary/30 hover:text-primary"
            )}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
        {/* Filters sidebar */}
        <div className="shrink-0">
          <JobFiltersPanel
            filters={filters}
            onChange={setFilters}
            resultsCount={filteredJobs.length}
          />
        </div>

        {/* Job list */}
        <div className="space-y-3 min-w-0">
          {loading || (viewMode === 'recommended' && recommendedLoading) ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-bold text-muted-foreground italic">
                {viewMode === 'recommended' ? 'Finding your best matches…' : 'Loading jobs...'}
              </p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 bg-card/30 rounded-3xl border border-border/30">
              <div className="p-4 rounded-2xl bg-muted/30">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-black italic text-foreground">No jobs found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {viewMode === 'saved'
                    ? 'Bookmark jobs to see them here.'
                    : viewMode === 'recommended'
                    ? 'Complete your career profile to improve matches.'
                    : 'Try adjusting your filters.'}
                </p>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredJobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <JobCard
                    job={job}
                    onSave={handleSave}
                    onApply={handleApply}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
