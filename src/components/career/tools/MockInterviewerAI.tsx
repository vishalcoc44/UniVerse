'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Mic, MicOff, ChevronRight, Timer, Loader2, Award,
  RotateCcw, BrainCircuit, CheckCircle2, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Question { id: string; text: string; category: string; difficulty: string; }
interface SessionFeedback { clarity: number; starCompliance: number; confidence: number; summary: string; improvements: string[]; strengths: string[]; isLocal?: boolean }
interface PastSession { id: string; role?: string; overallScore?: number; createdAt: string; questions: Question[]; feedback: SessionFeedback[]; }

const CATEGORY_COLORS: Record<string, string> = {
  BEHAVIORAL: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  TECHNICAL: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  SYSTEM_DESIGN: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
  HR: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  CASE_STUDY: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
};

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function MockInterviewerAI() {
  const [mode, setMode] = useState<'practice' | 'review'>('practice');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [bars, setBars] = useState<number[]>(new Array(40).fill(10));
  const [transcript, setTranscript] = useState('');
  const [answers, setAnswers] = useState<string[]>([]);
  const [evaluating, setEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<SessionFeedback[]>([]);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [pastSessions, setPastSessions] = useState<PastSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState('Software Engineer');
  const [loadingQ, setLoadingQ] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const barsRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const loadQuestions = useCallback(async () => {
    setLoadingQ(true);
    const { data } = await supabase.from('InterviewQuestion').select('id, question, category, difficulty').limit(7);
    if (data && data.length > 0) {
      setQuestions(data.map(d => ({ id: d.id, text: d.question, category: d.category, difficulty: d.difficulty })));
      setCurrentQ(0);
    } else {
      setQuestions([]);
      setCurrentQ(0);
    }
    setLoadingQ(false);
  }, []);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        const rec = new SR();
        rec.continuous = true;
        rec.interimResults = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rec.onresult = (e: any) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setTranscript(Array.from(e.results).map((r: any) => r[0].transcript).join(' '));
        };
        recognitionRef.current = rec;
      } else {
        setSpeechSupported(false);
      }
    }
  }, []);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setTimer(p => p + 1), 1000);
      barsRef.current = setInterval(() => setBars(new Array(40).fill(0).map(() => Math.random() * 80 + 10)), 80);
      try { recognitionRef.current?.start(); } catch {}
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (barsRef.current) clearInterval(barsRef.current);
      setBars(new Array(40).fill(10));
      try { recognitionRef.current?.stop(); } catch {}
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (barsRef.current) clearInterval(barsRef.current);
    };
  }, [isRecording]);

  const localFeedback = (answer: string): SessionFeedback => {
    // Content-aware fallback so two different answers don't get identical
    // scores when the evaluate-interview edge function is unavailable.
    const text = (answer || '').trim();
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const lower = text.toLowerCase();
    const hasNumbers = /\d/.test(text);
    const hasHedging = /(maybe|kind of|sort of|i think|i guess|\bum\b|\buh\b)/.test(lower);
    const starHits = ['situation', 'task', 'action', 'result', 'because', 'so that', 'led to', 'resulted in']
      .filter(k => lower.includes(k)).length;

    const clamp = (n: number) => Math.max(2, Math.min(10, Math.round(n)));
    const clarity = clamp(3 + Math.log2(words + 1) * 0.9);
    const starCompliance = clamp(3 + starHits + (hasNumbers ? 1 : 0));
    const confidence = clamp(7 - (hasHedging ? 3 : 0) + (words > 80 ? 1 : 0));

    return {
      clarity, starCompliance, confidence,
      strengths: [
        words > 80 ? 'Detailed, well-developed response' : 'Concise and to the point',
        hasNumbers ? 'Quantified impact with concrete numbers' : 'Clear narrative structure',
        starHits >= 2 ? 'Includes situational and outcome context' : 'Stays focused on the question',
      ].slice(0, 3),
      improvements: [
        words < 60 ? 'Expand with a specific example or scenario' : null,
        !hasNumbers ? 'Add quantifiable outcomes (percentages, time saved, scale)' : null,
        starHits < 2 ? 'Use STAR structure: Situation → Task → Action → Result' : null,
        hasHedging ? 'Reduce hedging words for stronger delivery' : null,
      ].filter((s): s is string => Boolean(s)).slice(0, 3),
      summary: words < 30
        ? 'Answer is too short — interviewers expect richer context and outcomes.'
        : `Solid foundation${hasNumbers ? ' with concrete metrics' : ''}. ${starHits >= 2 ? 'Good structure.' : 'Tighten the structure to highlight cause-and-effect.'}`,
    };
  };

  const evaluateAnswer = async (q: Question, answer: string): Promise<SessionFeedback> => {
    const startedAt = Date.now();
    try {
      const { data, error } = await supabase.functions.invoke('evaluate-interview', {
        body: { question: q.text, answer, category: q.category },
      });
      if (!error && data && typeof data === 'object'
          && 'clarity' in data && 'starCompliance' in data && 'confidence' in data) {
        void import("@/lib/analytics").then(({ track }) => track("mock_interview_evaluated", { category: q.category }));
        return { ...(data as SessionFeedback), isLocal: false };
      }
      // The edge function responded but with a shape we don't trust.
      console.warn('[MockInterview] evaluate-interview returned unexpected shape — falling back to local analysis', error);
    } catch (err) {
      // Function not deployed, network blocked, etc.
      console.warn('[MockInterview] evaluate-interview unreachable — falling back to local analysis. Deploy the edge function and set OPENAI_API_KEY for AI evaluation.', err);
    }

    // Pad the local heuristic to ~1.2s so the UX matches the cadence of a
    // real evaluation call and doesn't feel jarring/fake.
    const elapsed = Date.now() - startedAt;
    if (elapsed < 1200) {
      await new Promise(resolve => setTimeout(resolve, 1200 - elapsed));
    }
    return { ...localFeedback(answer), isLocal: true };
  };

  const nextQuestion = async () => {
    if (!questions[currentQ]) return;
    if (isRecording) setIsRecording(false);
    const currentAnswer = transcript || '(No answer recorded)';
    const newAnswers = [...answers, currentAnswer];
    setAnswers(newAnswers);
    setEvaluating(true);
    const fb = await evaluateAnswer(questions[currentQ], currentAnswer);
    const newFeedback = [...feedback, fb];
    setFeedback(newFeedback);
    setEvaluating(false);
    setTranscript('');
    setTimer(0);

    if (currentQ + 1 >= questions.length) {
      setSessionComplete(true);
      if (userId) {
        const avgScore = Math.round(newFeedback.reduce((a, f) => a + (f.clarity + f.starCompliance + f.confidence) / 3, 0) / newFeedback.length * 10);
        await supabase.from('InterviewSession').insert({ userId, role, questions, answers: newAnswers, feedback: newFeedback, overallScore: avgScore });
      }
    } else {
      setCurrentQ(c => c + 1);
    }
  };

  const loadPastSessions = useCallback(async () => {
    if (!userId) return;
    setSessionsLoading(true);
    const { data } = await supabase.from('InterviewSession').select('*').eq('userId', userId).order('createdAt', { ascending: false }).limit(10);
    setPastSessions((data ?? []) as PastSession[]);
    setSessionsLoading(false);
  }, [userId]);

  useEffect(() => { if (mode === 'review') loadPastSessions(); }, [mode, loadPastSessions]);

  const restart = () => {
    setCurrentQ(0); setAnswers([]); setFeedback([]); setSessionComplete(false); setTranscript(''); setTimer(0);
    loadQuestions();
  };

  const overallScore = feedback.length > 0
    ? Math.round(feedback.reduce((a, f) => a + (f.clarity + f.starCompliance + f.confidence) / 3, 0) / feedback.length * 10)
    : null;

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {(['practice', 'review'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} className={cn(
            "px-4 py-2 rounded-2xl text-xs font-black border transition-all",
            mode === m ? "bg-violet-500 text-white border-violet-500 shadow-lg shadow-violet-500/20"
              : "bg-card/40 text-muted-foreground border-border/50 hover:text-violet-400"
          )}>
            {m === 'practice' ? '🎤 Practice' : '📋 History'}
          </button>
        ))}
      </div>

      {mode === 'practice' && sessionComplete && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-gradient-to-br from-violet-500/10 via-card/40 to-card/40 border border-violet-500/20 rounded-[2.5rem] p-8 text-center">
            <Award className="h-12 w-12 text-violet-400 mx-auto mb-4" />
            <p className="text-3xl font-black italic text-violet-400">{overallScore}/100</p>
            <p className="font-black text-xl italic mt-1">Session Complete!</p>
            <Button onClick={restart} className="mt-6 bg-violet-500 hover:bg-violet-600 font-black italic rounded-2xl">
              <RotateCcw className="h-4 w-4 mr-2" /> New Session
            </Button>
          </div>
          {feedback.some(fb => fb.isLocal) && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-2.5 flex items-start gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-300 leading-snug">
                <span className="font-black">Local analysis used</span> — the AI evaluator (evaluate-interview edge function) couldn't be reached.
                Scores are computed from heuristics on your answer text. Deploy the edge function and set <span className="font-bold">OPENAI_API_KEY</span> for full AI feedback.
              </p>
            </div>
          )}
          {feedback.map((fb, i) => (
            <div key={i} className="bg-card/40 border border-border/50 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-black italic text-muted-foreground">Q{i + 1}: {questions[i]?.text}</p>
                {fb.isLocal && (
                  <span className="shrink-0 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Local
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[['Clarity', fb.clarity], ['STAR', fb.starCompliance], ['Confidence', fb.confidence]].map(([l, s]) => (
                  <div key={String(l)} className="text-center bg-violet-500/5 rounded-xl p-2">
                    <p className="text-lg font-black italic text-violet-400">{s}/10</p>
                    <p className="text-[9px] text-muted-foreground font-black uppercase">{l}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground italic">{fb.summary}</p>
              {fb.improvements.map((imp, j) => (
                <p key={j} className="text-[10px] text-amber-400 flex items-center gap-1">
                  <AlertCircle className="h-2.5 w-2.5 shrink-0" />{imp}
                </p>
              ))}
            </div>
          ))}
        </motion.div>
      )}

      {mode === 'practice' && !sessionComplete && (
        <div className="space-y-4">
          {/* Role input */}
          <div className="flex items-center gap-3 bg-card/30 border border-border/30 rounded-2xl px-4 py-3">
            <BrainCircuit className="h-4 w-4 text-violet-400 shrink-0" />
            <input value={role} onChange={e => setRole(e.target.value)} placeholder="Target role..."
              className="flex-1 bg-transparent text-sm font-bold focus:outline-none placeholder:text-muted-foreground/50" />
            <Button size="sm" variant="outline" onClick={loadQuestions} disabled={loadingQ}
              className="h-7 px-3 rounded-xl text-[10px] font-black border-violet-500/30 text-violet-400">
              {loadingQ ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Reload'}
            </Button>
          </div>

          {questions.length === 0 ? (
            <div className="bg-card/40 border border-border/50 rounded-2xl p-6 text-center">
              <p className="text-sm font-black italic">No interview questions found in database.</p>
              <p className="text-xs text-muted-foreground mt-1">Add questions in the Question Bank tab, then press Reload.</p>
            </div>
          ) : (
            <>
              {/* Progress */}
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {questions.map((_, i) => (
                    <div key={i} className={cn("h-1.5 w-6 rounded-full transition-all",
                      i < currentQ ? "bg-violet-500" : i === currentQ ? "bg-violet-400" : "bg-border/50")} />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground font-bold">{currentQ + 1}/{questions.length}</span>
              </div>

              {/* Question */}
              <AnimatePresence mode="wait">
                <motion.div key={currentQ} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="bg-gradient-to-br from-violet-500/10 via-card/40 to-card/40 border border-violet-500/20 rounded-[2.5rem] p-8">
                  <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border inline-block mb-4",
                    CATEGORY_COLORS[questions[currentQ]?.category] ?? 'text-muted-foreground bg-muted border-border')}>
                    {questions[currentQ]?.category}
                  </span>
                  <p className="text-lg font-black italic tracking-tight leading-relaxed">{questions[currentQ]?.text}</p>
                </motion.div>
              </AnimatePresence>

              {/* Answer — editable textarea (works whether or not speech recognition is supported) */}
              <div className="bg-card/30 border border-border/30 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                    Your answer
                    {!speechSupported && <span className="ml-1.5 text-amber-400 normal-case tracking-normal">(type your answer — voice not supported in this browser)</span>}
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground/50">
                    {transcript.trim().split(/\s+/).filter(Boolean).length} words
                  </p>
                </div>
                <textarea
                  value={transcript}
                  onChange={e => setTranscript(e.target.value)}
                  placeholder={isRecording ? 'Listening… you can also type or edit here.' : 'Type your answer here, or tap the mic to speak.'}
                  rows={4}
                  className="w-full bg-transparent text-sm text-foreground/90 italic resize-none focus:outline-none placeholder:text-muted-foreground/40 leading-relaxed"
                />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-black text-muted-foreground bg-card/30 px-3 py-2 rounded-xl">
                  <Timer className="h-3.5 w-3.5" />{fmt(timer)}
                </div>
                <div className="flex-1 flex items-end gap-px h-8">
                  {bars.map((h, i) => (
                    <div key={i} className={cn("flex-1 rounded-full transition-all", isRecording ? "bg-violet-500/60" : "bg-border/30")}
                      style={{ height: `${isRecording ? h : 20}%` }} />
                  ))}
                </div>
                <button onClick={() => { if (isRecording) { setIsRecording(false); } else { setTranscript(''); setTimer(0); setIsRecording(true); } }}
                  className={cn("p-4 rounded-2xl transition-all shadow-lg",
                    isRecording ? "bg-red-500 text-white shadow-red-500/30 scale-105" : "bg-violet-500 text-white shadow-violet-500/30")}>
                  {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
                <Button onClick={nextQuestion} disabled={evaluating}
                  className="bg-violet-500 hover:bg-violet-600 font-black italic rounded-2xl shadow-lg shadow-violet-500/20">
                  {evaluating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : currentQ + 1 >= questions.length
                    ? <><CheckCircle2 className="h-4 w-4 mr-2" />Finish</> : <>Next <ChevronRight className="h-4 w-4 ml-1" /></>}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {mode === 'review' && (
        sessionsLoading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-violet-500" /></div>
          : pastSessions.length === 0 ? <p className="text-center py-10 text-muted-foreground italic">No sessions yet. Start practicing!</p>
            : <div className="space-y-3">
                {pastSessions.map(s => (
                  <div key={s.id} className="bg-card/40 border border-border/50 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-black text-sm italic">{s.role ?? 'General Interview'}</p>
                      <p className="text-[10px] text-muted-foreground font-bold">
                        {new Date(s.createdAt).toLocaleDateString()} · {s.questions?.length ?? 0} questions
                      </p>
                    </div>
                    {s.overallScore !== undefined && (
                      <p className={cn("text-xl font-black italic",
                        s.overallScore >= 75 ? "text-green-400" : s.overallScore >= 50 ? "text-amber-400" : "text-red-400")}>
                        {s.overallScore}
                      </p>
                    )}
                  </div>
                ))}
              </div>
      )}
    </div>
  );
}
