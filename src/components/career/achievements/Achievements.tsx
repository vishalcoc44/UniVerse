'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Trophy, Star, Zap, Award, Target, Users, FileCheck, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Achievement {
  id: string;
  type: string;
  title: string;
  description: string | null;
  earnedAt: string;
  metadata: Record<string, unknown> | null;
}

const ACHIEVEMENT_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  RESUME_UPLOADED:         { icon: FileCheck, color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30' },
  JOB_APPLIED:             { icon: Briefcase, color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30' },
  INTERVIEW_COMPLETED:     { icon: Zap,       color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/30' },
  MENTOR_SESSION:          { icon: Users,     color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  PROFILE_COMPLETE:        { icon: Target,    color: 'text-teal-400',   bg: 'bg-teal-500/10 border-teal-500/30' },
  OFFER_RECEIVED:          { icon: Star,      color: 'text-pink-400',   bg: 'bg-pink-500/10 border-pink-500/30' },
  FIVE_APPLICATIONS:       { icon: Award,     color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
  FIRST_INTERVIEW:         { icon: Zap,       color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  QUESTION_BANK_MASTERED:  { icon: Trophy,    color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
};

const ALL_POSSIBLE: { type: string; title: string; description: string }[] = [
  { type: 'RESUME_UPLOADED',        title: 'Resume Ready',         description: 'Upload your first resume' },
  { type: 'JOB_APPLIED',            title: 'First Application',    description: 'Apply to your first job' },
  { type: 'INTERVIEW_COMPLETED',    title: 'Practice Makes Perfect', description: 'Complete a mock interview' },
  { type: 'MENTOR_SESSION',         title: 'Network Builder',      description: 'Book a mentor session' },
  { type: 'PROFILE_COMPLETE',       title: 'Profile Pro',          description: 'Complete your career profile' },
  { type: 'OFFER_RECEIVED',         title: 'Offer in Hand',        description: 'Receive a job offer' },
  { type: 'FIVE_APPLICATIONS',      title: 'On a Roll',            description: 'Apply to 5 jobs' },
  { type: 'FIRST_INTERVIEW',        title: 'Interview Unlocked',   description: 'Land your first interview' },
  { type: 'QUESTION_BANK_MASTERED', title: 'Q&A Champion',         description: 'Answer 20 practice questions' },
];

export function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from('CareerAchievement')
        .select('id, type, title, description, earnedAt, metadata')
        .eq('userId', user.id)
        .order('earnedAt', { ascending: false });
      setAchievements((data as Achievement[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const earnedTypes = new Set(achievements.map(a => a.type));

  if (loading) return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading achievements...
    </div>
  );

  const completionPct = Math.round((earnedTypes.size / ALL_POSSIBLE.length) * 100);

  return (
    <div className="space-y-5">
      {/* Header Progress */}
      <div className="bg-card/40 border border-border/40 rounded-2xl p-5 text-center">
        <div className="relative inline-block mb-3">
          <Trophy className="h-12 w-12 text-yellow-400 mx-auto" />
          <span className="absolute -top-1 -right-1 text-[10px] font-black bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded-full">
            {achievements.length}
          </span>
        </div>
        <p className="text-2xl font-black italic">{achievements.length} Earned</p>
        <p className="text-xs text-muted-foreground font-bold mb-3">of {ALL_POSSIBLE.length} possible</p>
        <div className="h-2 bg-border/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 rounded-full"
          />
        </div>
        <p className="text-[10px] text-muted-foreground font-black mt-1">{completionPct}% complete</p>
      </div>

      {/* Recent Achievements */}
      {achievements.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Earned</p>
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((a, i) => {
              const config = ACHIEVEMENT_CONFIG[a.type] ?? ACHIEVEMENT_CONFIG['MILESTONE'];
              const Icon = config.icon;
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className={cn("border rounded-2xl p-3 text-center", config.bg)}
                >
                  <Icon className={cn("h-7 w-7 mx-auto mb-2", config.color)} />
                  <p className="text-[11px] font-black leading-tight">{a.title}</p>
                  {a.description && (
                    <p className="text-[8px] text-muted-foreground mt-0.5">{a.description}</p>
                  )}
                  <p className="text-[8px] font-bold text-muted-foreground mt-1">
                    {new Date(a.earnedAt).toLocaleDateString()}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Locked Achievements */}
      {ALL_POSSIBLE.filter(a => !earnedTypes.has(a.type)).length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Still to unlock</p>
          <div className="grid grid-cols-2 gap-3">
            {ALL_POSSIBLE.filter(a => !earnedTypes.has(a.type)).map((a, i) => {
              const config = ACHIEVEMENT_CONFIG[a.type] ?? ACHIEVEMENT_CONFIG['MILESTONE'];
              const Icon = config.icon;
              return (
                <motion.div
                  key={a.type}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className="border border-border/20 rounded-2xl p-3 text-center opacity-40 grayscale"
                >
                  <Icon className="h-7 w-7 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-[11px] font-black leading-tight">{a.title}</p>
                  <p className="text-[8px] text-muted-foreground mt-0.5">{a.description}</p>
                  <p className="text-[8px] font-black text-muted-foreground mt-1">Locked</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
