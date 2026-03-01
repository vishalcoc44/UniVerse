'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Bookmark,
  BookmarkCheck,
  MapPin,
  Clock,
  DollarSign,
  Wifi,
  ChevronRight,
  Building2,
  ExternalLink,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export interface Job {
  id: string;
  title: string;
  description?: string;
  type: 'FULL_TIME' | 'PART_TIME' | 'INTERNSHIP' | 'CONTRACT' | 'FREELANCE';
  status: string;
  location?: string;
  isRemote: boolean;
  skills: string[];
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  deadline?: string;
  createdAt: string;
  applyUrl?: string;
  company?: {
    id: string;
    name: string;
    logoUrl?: string;
    industry?: string;
    verified: boolean;
  };
  isSaved?: boolean;
  matchScore?: number;
}

const JOB_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  INTERNSHIP: 'Internship',
  CONTRACT: 'Contract',
  FREELANCE: 'Freelance',
};

const JOB_TYPE_COLORS: Record<string, string> = {
  FULL_TIME: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PART_TIME: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  INTERNSHIP: 'bg-green-500/10 text-green-400 border-green-500/20',
  CONTRACT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  FREELANCE: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
};

function formatSalary(min?: number, max?: number, currency = 'USD') {
  if (!min && !max) return null;
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(0)}k` : `${n}`;
  const sym = currency === 'USD' ? '$' : currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency;
  if (min && max) return `${sym}${fmt(min)} – ${sym}${fmt(max)}`;
  if (min) return `${sym}${fmt(min)}+`;
  return `Up to ${sym}${fmt(max!)}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

interface JobCardProps {
  job: Job;
  onSave?: (jobId: string) => void;
  onApply?: (job: Job) => void;
  onViewCompany?: (companyId: string) => void;
  variant?: 'default' | 'compact';
}

export function JobCard({ job, onSave, onApply, onViewCompany, variant = 'default' }: JobCardProps) {
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaving(true);
    await onSave?.(job.id);
    setSaving(false);
  };

  const salary = formatSalary(job.salaryMin, job.salaryMax, job.currency);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-6 transition-all duration-300",
        "hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5",
        variant === 'compact' && "p-4 rounded-2xl"
      )}
    >
      {/* Match score badge */}
      {job.matchScore !== undefined && job.matchScore > 70 && (
        <div className="absolute -top-2 -right-2 flex items-center gap-1 bg-primary px-2.5 py-1 rounded-full text-[10px] font-black text-white shadow-lg shadow-primary/30">
          <Zap className="h-3 w-3" />
          {job.matchScore}% match
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Company avatar */}
        <div
          className="h-12 w-12 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:scale-105 transition-transform"
          onClick={() => job.company && onViewCompany?.(job.company.id)}
        >
          {job.company?.logoUrl ? (
            <img src={job.company.logoUrl} alt={job.company.name} className="h-full w-full object-cover" />
          ) : (
            <Building2 className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-black text-sm italic tracking-tight truncate group-hover:text-primary transition-colors">
                {job.title}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground font-bold">
                  {job.company?.name ?? 'Company'}
                </span>
                {job.company?.verified && (
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                    Verified
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className={cn(
                "shrink-0 p-1.5 rounded-xl transition-all duration-300",
                job.isSaved
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              )}
            >
              {job.isSaved
                ? <BookmarkCheck className="h-4 w-4" />
                : <Bookmark className="h-4 w-4" />}
            </button>
          </div>

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className={cn(
              "text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border",
              JOB_TYPE_COLORS[job.type] ?? 'bg-muted/50 text-muted-foreground border-border/30'
            )}>
              {JOB_TYPE_LABELS[job.type]}
            </span>

            {job.isRemote && (
              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Wifi className="h-2.5 w-2.5" /> Remote
              </span>
            )}

            {job.location && !job.isRemote && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold">
                <MapPin className="h-2.5 w-2.5" />{job.location}
              </span>
            )}

            {salary && (
              <span className="flex items-center gap-1 text-[10px] text-green-400 font-bold">
                <DollarSign className="h-2.5 w-2.5" />{salary}
              </span>
            )}

            <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold ml-auto">
              <Clock className="h-2.5 w-2.5" />{timeAgo(job.createdAt)}
            </span>
          </div>

          {/* Skills */}
          {job.skills.length > 0 && variant === 'default' && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {job.skills.slice(0, 5).map(skill => (
                <span key={skill} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-muted/40 text-muted-foreground border border-border/30">
                  {skill}
                </span>
              ))}
              {job.skills.length > 5 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-muted/40 text-muted-foreground border border-border/30">
                  +{job.skills.length - 5}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action row */}
      {variant === 'default' && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/20">
          {job.deadline && (
            <span className="text-[10px] font-bold text-muted-foreground">
              Closes {new Date(job.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          <div className="flex gap-2 ml-auto">
            {job.applyUrl && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 rounded-xl text-xs font-black border-border/50 hover:border-primary/30"
                onClick={() => window.open(job.applyUrl, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" /> View
              </Button>
            )}
            <Button
              size="sm"
              className="h-8 px-4 rounded-xl text-xs font-black bg-primary hover:bg-primary/90 shadow-md shadow-primary/20"
              onClick={() => onApply?.(job)}
            >
              Apply <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
