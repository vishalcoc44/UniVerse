'use client';

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Zap, CheckCircle2, XCircle, BookOpen, ExternalLink, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GapItem {
  skill: string;
  status: 'have' | 'gap' | 'learning';
  resourceUrl?: string;
  resourceLabel?: string;
}

const LEARNING_RESOURCES: Record<string, { label: string; url: string }> = {
  'react': { label: 'React Docs', url: 'https://react.dev' },
  'typescript': { label: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/' },
  'python': { label: 'Python.org', url: 'https://docs.python.org/3/' },
  'node.js': { label: 'Node.js Docs', url: 'https://nodejs.org/docs/latest/api/' },
  'aws': { label: 'AWS Training', url: 'https://aws.amazon.com/training/' },
  'machine learning': { label: 'ML Crash Course', url: 'https://developers.google.com/machine-learning/crash-course' },
  'sql': { label: 'SQL Tutorial', url: 'https://www.w3schools.com/sql/' },
  'next.js': { label: 'Next.js Docs', url: 'https://nextjs.org/docs' },
  'docker': { label: 'Docker Docs', url: 'https://docs.docker.com/get-started/' },
  'system design': { label: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' },
  'kubernetes': { label: 'K8s Docs', url: 'https://kubernetes.io/docs/home/' },
  'graphql': { label: 'GraphQL Docs', url: 'https://graphql.org/learn/' },
  'tensorflow': { label: 'TensorFlow', url: 'https://www.tensorflow.org/learn' },
};

function getResource(skill: string) {
  const key = skill.toLowerCase();
  return LEARNING_RESOURCES[key] ?? { label: `Learn ${skill}`, url: `https://www.google.com/search?q=learn+${encodeURIComponent(skill)}` };
}

interface SkillGapAnalysisProps {
  jobSkills?: string[];
  jobTitle?: string;
}

export function SkillGapAnalysis({ jobSkills, jobTitle }: SkillGapAnalysisProps) {
  const [resumeSkills, setResumeSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [gapItems, setGapItems] = useState<GapItem[]>([]);

  const fetchAndCompute = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: resume } = await supabase
      .from('Resume')
      .select('feedback, skillsExtracted')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false })
      .limit(1)
      .single();

    let skills: string[] = [];
    if (resume?.skillsExtracted?.length) {
      skills = resume.skillsExtracted;
    } else if (resume?.feedback?.keywords) {
      skills = resume.feedback.keywords;
    }
    setResumeSkills(skills);

    if (jobSkills && jobSkills.length > 0) {
      const normalise = (s: string) => s.toLowerCase().trim();
      const haveSet = new Set(skills.map(normalise));
      const items: GapItem[] = jobSkills.map(skill => {
        const have = haveSet.has(normalise(skill));
        const res = getResource(skill);
        return {
          skill,
          status: have ? 'have' : 'gap',
          resourceUrl: res.url,
          resourceLabel: res.label,
        };
      });
      setGapItems(items);
    }
    setLoading(false);
  }, [jobSkills]);

  useEffect(() => { fetchAndCompute(); }, [fetchAndCompute]);

  const haveCount = gapItems.filter(g => g.status === 'have').length;
  const total = gapItems.length;
  const matchPct = total > 0 ? Math.round((haveCount / total) * 100) : 0;

  if (loading) return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
      <Loader2 className="h-4 w-4 animate-spin" /> Analysing skill gap...
    </div>
  );

  if (!jobSkills || jobSkills.length === 0) return (
    <div className="bg-card/30 border border-border/30 rounded-2xl p-4 text-center">
      <BookOpen className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
      <p className="text-xs text-muted-foreground font-bold">Select a job to see skill gap analysis.</p>
    </div>
  );

  return (
    <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black text-lg italic tracking-tight">Skill Gap</h3>
          {jobTitle && <p className="text-xs text-muted-foreground font-bold">for {jobTitle}</p>}
        </div>
        <div className="text-right">
          <p className={cn("text-2xl font-black italic",
            matchPct >= 75 ? "text-green-400" : matchPct >= 50 ? "text-amber-400" : "text-red-400")}>
            {matchPct}%
          </p>
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-wider">match</p>
        </div>
      </div>

      <Progress value={matchPct} className="h-2 rounded-full" />

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-3">
          <p className="text-xl font-black italic text-green-400">{haveCount}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">You have</p>
        </div>
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-3">
          <p className="text-xl font-black italic text-red-400">{total - haveCount}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Gaps</p>
        </div>
      </div>

      <div className="space-y-2">
        {gapItems.map((item, i) => (
          <motion.div
            key={item.skill}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-3"
          >
            {item.status === 'have' ? (
              <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-red-400 shrink-0" />
            )}
            <span className={cn("text-xs font-bold flex-1",
              item.status === 'have' ? "text-foreground" : "text-muted-foreground")}>
              {item.skill}
            </span>
            {item.status === 'gap' && item.resourceUrl && (
              <a
                href={item.resourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[9px] font-black text-primary hover:text-primary/80 border border-primary/30 bg-primary/5 px-2 py-0.5 rounded-lg"
              >
                <BookOpen className="h-2.5 w-2.5" />
                {item.resourceLabel}
                <ExternalLink className="h-2 w-2" />
              </a>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
