'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Search,
  SlidersHorizontal,
  X,
  Wifi,
  MapPin,
  Briefcase,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";

export interface JobFilters {
  query: string;
  types: string[];
  isRemote: boolean | null;
  skills: string[];
  salaryMin: number | null;
  salaryMax: number | null;
}

const JOB_TYPES = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'FREELANCE', label: 'Freelance' },
];

const POPULAR_SKILLS = [
  'React', 'TypeScript', 'Python', 'Node.js', 'AWS',
  'Machine Learning', 'SQL', 'Next.js', 'Docker', 'System Design',
];

interface JobFiltersProps {
  filters: JobFilters;
  onChange: (filters: JobFilters) => void;
  resultsCount?: number;
}

export function JobFiltersPanel({ filters, onChange, resultsCount }: JobFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  const update = (partial: Partial<JobFilters>) => onChange({ ...filters, ...partial });

  const toggleType = (type: string) => {
    const types = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    update({ types });
  };

  const toggleSkill = (skill: string) => {
    const skills = filters.skills.includes(skill)
      ? filters.skills.filter(s => s !== skill)
      : [...filters.skills, skill];
    update({ skills });
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !filters.skills.includes(s)) {
      update({ skills: [...filters.skills, s] });
    }
    setSkillInput('');
  };

  const hasActiveFilters =
    filters.types.length > 0 ||
    filters.isRemote !== null ||
    filters.skills.length > 0 ||
    filters.salaryMin !== null ||
    filters.salaryMax !== null;

  const reset = () => onChange({
    query: filters.query,
    types: [],
    isRemote: null,
    skills: [],
    salaryMin: null,
    salaryMax: null,
  });

  return (
    <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-6 space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={filters.query}
          onChange={e => update({ query: e.target.value })}
          placeholder="Search job title, skills, company..."
          className="pl-11 h-12 rounded-2xl bg-background/40 border-border/40 font-bold text-sm"
        />
        {filters.query && (
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => update({ query: '' })}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Quick filters row */}
      <div className="flex flex-wrap gap-2">
        {/* Remote toggle */}
        <button
          onClick={() => update({ isRemote: filters.isRemote ? null : true })}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition-all",
            filters.isRemote
              ? "bg-teal-500/20 text-teal-400 border-teal-500/30"
              : "bg-muted/30 text-muted-foreground border-border/30 hover:border-teal-500/30"
          )}
        >
          <Wifi className="h-3 w-3" /> Remote
        </button>

        {/* Job types */}
        {JOB_TYPES.map(t => (
          <button
            key={t.value}
            onClick={() => toggleType(t.value)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-black border transition-all",
              filters.types.includes(t.value)
                ? "bg-primary/20 text-primary border-primary/30"
                : "bg-muted/30 text-muted-foreground border-border/30 hover:border-primary/30"
            )}
          >
            {t.label}
          </button>
        ))}

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black border border-border/30 bg-muted/30 text-muted-foreground hover:text-foreground ml-auto"
        >
          <SlidersHorizontal className="h-3 w-3" />
          More
          <ChevronDown className={cn("h-3 w-3 transition-transform", showAdvanced && "rotate-180")} />
        </button>

        {hasActiveFilters && (
          <button
            onClick={reset}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        )}
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="space-y-4 pt-2 border-t border-border/20">
          {/* Salary range */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">
              Salary Range (annual)
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.salaryMin ?? ''}
                onChange={e => update({ salaryMin: e.target.value ? Number(e.target.value) : null })}
                className="h-9 rounded-xl bg-background/40 border-border/40 text-xs font-bold"
              />
              <span className="text-muted-foreground text-sm">–</span>
              <Input
                type="number"
                placeholder="Max"
                value={filters.salaryMax ?? ''}
                onChange={e => update({ salaryMax: e.target.value ? Number(e.target.value) : null })}
                className="h-9 rounded-xl bg-background/40 border-border/40 text-xs font-bold"
              />
            </div>
          </div>

          {/* Skills */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">
              Required Skills
            </p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {POPULAR_SKILLS.map(s => (
                <button
                  key={s}
                  onClick={() => toggleSkill(s)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all",
                    filters.skills.includes(s)
                      ? "bg-primary/20 text-primary border-primary/30"
                      : "bg-muted/30 text-muted-foreground border-border/30 hover:border-primary/20"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            {/* Custom skill input */}
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSkill()}
                placeholder="Add custom skill..."
                className="h-8 rounded-xl bg-background/40 border-border/40 text-xs font-bold"
              />
              <Button size="sm" variant="outline" className="h-8 px-3 rounded-xl text-xs" onClick={addSkill}>
                Add
              </Button>
            </div>
            {/* Selected custom skills */}
            {filters.skills.filter(s => !POPULAR_SKILLS.includes(s)).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {filters.skills.filter(s => !POPULAR_SKILLS.includes(s)).map(s => (
                  <span key={s} className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
                    {s}
                    <button onClick={() => toggleSkill(s)}><X className="h-2.5 w-2.5" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results count */}
      {resultsCount !== undefined && (
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 text-center pt-1">
          {resultsCount} job{resultsCount !== 1 ? 's' : ''} found
        </p>
      )}
    </div>
  );
}
