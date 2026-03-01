'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, CheckCircle2, Star, BarChart2, Trash2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ResumeRow {
  id: string;
  fileName: string;
  fileUrl: string;
  score: number | null;
  label: string | null;
  isActive: boolean | null;
  createdAt: string;
  feedback: Record<string, unknown> | null;
}

export function ResumeHistory() {
  const [resumes, setResumes] = useState<ResumeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchResumes = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('Resume')
      .select('id, fileName, fileUrl, score, label, isActive, createdAt, feedback')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false });
    setResumes((data as ResumeRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchResumes(); }, []);

  const setActive = async (id: string) => {
    setActionId(id);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setActionId(null); return; }
    // Unset all, then set this one
    await supabase.from('Resume').update({ isActive: false }).eq('userId', user.id);
    await supabase.from('Resume').update({ isActive: true }).eq('id', id);
    setResumes(prev => prev.map(r => ({ ...r, isActive: r.id === id })));
    setActionId(null);
  };

  const deleteResume = async (id: string) => {
    setActionId(id);
    await supabase.from('Resume').delete().eq('id', id);
    setResumes(prev => prev.filter(r => r.id !== id));
    setActionId(null);
  };

  const scoreColor = (s: number | null) =>
    s == null ? 'text-muted-foreground' : s >= 80 ? 'text-green-400' : s >= 60 ? 'text-amber-400' : 'text-red-400';

  const scoreLabel = (s: number | null) =>
    s == null ? '—' : s >= 80 ? 'Great' : s >= 60 ? 'Good' : 'Needs Work';

  if (loading) return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading resumes...
    </div>
  );

  if (!resumes.length) return (
    <div className="text-center py-10 text-muted-foreground">
      <FileText className="h-8 w-8 mx-auto mb-3 opacity-40" />
      <p className="text-sm font-bold">No resumes uploaded yet.</p>
    </div>
  );

  const activeResume = resumes.find(r => r.isActive);
  const scores = resumes.map(r => r.score).filter(Boolean) as number[];
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  return (
    <div className="space-y-4">
      {/* Stats Strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: resumes.length, icon: FileText },
          { label: 'Avg Score', value: avgScore != null ? `${avgScore}%` : '—', icon: BarChart2 },
          { label: 'Active', value: activeResume?.label || activeResume?.fileName.slice(0, 14) + '…' || '—', icon: CheckCircle2 },
        ].map(stat => (
          <div key={stat.label} className="bg-card/40 border border-border/40 rounded-2xl p-3 text-center">
            <stat.icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-base font-black italic truncate">{stat.value}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Score Comparison Bar */}
      {resumes.length >= 2 && (
        <div className="bg-card/30 border border-border/20 rounded-2xl p-4 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Score History</p>
          <div className="flex items-end gap-2 h-16">
            {[...resumes].reverse().map((r, i) => {
              const h = r.score ? Math.max(8, (r.score / 100) * 64) : 8;
              return (
                <div key={r.id} className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-[8px] font-black text-muted-foreground">{r.score ?? '?'}</span>
                  <div
                    className={cn("w-full rounded-t-md transition-all",
                      r.isActive ? "bg-primary" : "bg-border/60")}
                    style={{ height: h }}
                    title={r.label ?? r.fileName}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resume Cards */}
      <AnimatePresence mode="popLayout">
        {resumes.map((resume, i) => (
          <motion.div
            key={resume.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              "relative bg-card/40 border rounded-2xl p-4 transition-all",
              resume.isActive ? "border-primary/60 bg-primary/5" : "border-border/40 hover:border-border"
            )}
          >
            {resume.isActive && (
              <span className="absolute top-3 right-3 text-[8px] font-black uppercase tracking-widest bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-border/20 rounded-xl shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm truncate">{resume.label || resume.fileName}</p>
                {resume.label && (
                  <p className="text-[10px] text-muted-foreground truncate">{resume.fileName}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn("text-xs font-black italic", scoreColor(resume.score))}>
                    {resume.score != null ? `${resume.score}% — ${scoreLabel(resume.score)}` : 'Not scored'}
                  </span>
                  <span className="text-[9px] text-muted-foreground">
                    {new Date(resume.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {Array.isArray(resume.feedback?.keywords) && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(resume.feedback!.keywords as string[]).slice(0, 4).map((kw: string) => (
                      <Badge key={kw} variant="outline" className="text-[8px] font-bold px-1.5 py-0">{kw}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
              <a
                href={resume.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] font-black text-primary hover:text-primary/80"
              >
                View PDF
              </a>
              {!resume.isActive && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] font-black rounded-xl ml-auto"
                  onClick={() => setActive(resume.id)}
                  disabled={actionId === resume.id}
                >
                  {actionId === resume.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Star className="h-3 w-3 mr-1" />Set Active</>}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[10px] font-black rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 ml-auto"
                onClick={() => deleteResume(resume.id)}
                disabled={actionId === resume.id}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
