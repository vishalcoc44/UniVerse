'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, BookOpen, Star, Check, ChevronDown, ChevronUp, Search, Filter, Plus, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Question {
  id: string;
  category: string;
  difficulty: string;
  question: string;
  sampleAnswer: string | null;
  tags: string[];
  isPracticed: boolean;
  isStarred: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  BEHAVIORAL: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  SYSTEM_DESIGN: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  TECHNICAL: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  HR: 'bg-green-500/20 text-green-300 border-green-500/40',
  CASE_STUDY: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: 'text-green-400',
  MEDIUM: 'text-amber-400',
  HARD: 'text-red-400',
};

export function InterviewQuestionBank() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [filterDiff, setFilterDiff] = useState<string | null>(null);
  const [showStarred, setShowStarred] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ question: '', category: 'BEHAVIORAL', difficulty: 'MEDIUM', tags: '', sampleAnswer: '', tip: '', companyTags: '' });
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const reloadQuestions = async (practiced: Set<string>, starred: Set<string>) => {
    const { data: qData } = await supabase
      .from('InterviewQuestion')
      .select('id, category, difficulty, question, sampleAnswer, tags')
      .order('category')
      .order('difficulty');
    if (qData) {
      setQuestions(qData.map((q: Record<string, unknown>) => ({
        id: q.id as string,
        category: q.category as string,
        difficulty: q.difficulty as string,
        question: q.question as string,
        sampleAnswer: q.sampleAnswer as string | null,
        tags: (q.tags as string[]) ?? [],
        isPracticed: practiced.has(q.id as string),
        isStarred: starred.has(q.id as string),
      })));
    }
    return qData;
  };

  const addQuestion = async () => {
    if (!addForm.question) return;
    setAddingQuestion(true);

    if (editingQuestionId) {
      const { error, data: updated } = await supabase.from('InterviewQuestion').update({
        question: addForm.question,
        category: addForm.category,
        difficulty: addForm.difficulty,
        tags: addForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        sampleAnswer: addForm.sampleAnswer || null,
        tip: addForm.tip || null,
        companyTags: addForm.companyTags.split(',').map(t => t.trim()).filter(Boolean),
      }).eq('id', editingQuestionId).select('id, category, difficulty, question, sampleAnswer, tags').single();

      if (error) {
        alert(error.message);
        setAddingQuestion(false);
        return;
      }

      if (updated) {
        const practiced = new Set(questions.filter(q => q.isPracticed).map(q => q.id));
        const starred = new Set(questions.filter(q => q.isStarred).map(q => q.id));
        await reloadQuestions(practiced, starred);
      }

      setEditingQuestionId(null);
      setAddForm({ question: '', category: 'BEHAVIORAL', difficulty: 'MEDIUM', tags: '', sampleAnswer: '', tip: '', companyTags: '' });
      setShowAddForm(false);
      setAddingQuestion(false);
      return;
    }

    await supabase.from('InterviewQuestion').insert({
      question: addForm.question,
      category: addForm.category,
      difficulty: addForm.difficulty,
      tags: addForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      sampleAnswer: addForm.sampleAnswer || null,
      tip: addForm.tip || null,
      companyTags: addForm.companyTags.split(',').map(t => t.trim()).filter(Boolean),
    });
    setAddForm({ question: '', category: 'BEHAVIORAL', difficulty: 'MEDIUM', tags: '', sampleAnswer: '', tip: '', companyTags: '' });
    setShowAddForm(false);
    const practiced = new Set(questions.filter(q => q.isPracticed).map(q => q.id));
    const starred = new Set(questions.filter(q => q.isStarred).map(q => q.id));
    await reloadQuestions(practiced, starred);
    setAddingQuestion(false);
  };

  const startEditQuestion = (qId: string) => {
    const q = questions.find(x => x.id === qId);
    if (!q) return;
    setEditingQuestionId(qId);
    setAddForm({
      question: q.question,
      category: q.category,
      difficulty: q.difficulty,
      tags: (q.tags || []).join(', '),
      sampleAnswer: q.sampleAnswer || '',
      tip: '',
      companyTags: '',
    });
    setShowAddForm(true);
  };

  const deleteQuestion = async (qId: string) => {
    await supabase.from('InterviewQuestion').delete().eq('id', qId);
    setQuestions(prev => prev.filter(q => q.id !== qId));
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // FC-1 fix: InterviewQuestion admin RLS is is_platform_admin().
        const { data: profile } = await supabase.from('Profile').select('role, universityId').eq('id', user.id).single();
        setIsAdmin(profile?.role === 'ADMIN' && !profile?.universityId);
      }

      const { data: qData } = await supabase
        .from('InterviewQuestion')
        .select('id, category, difficulty, question, sampleAnswer, tags')
        .order('category')
        .order('difficulty');

      let practiced = new Set<string>();
      let starred = new Set<string>();

      if (user && qData) {
        const { data: attempts } = await supabase
          .from('UserQuestionAttempt')
          .select('questionId, isStarred')
          .eq('userId', user.id);
        if (attempts) {
          attempts.forEach(a => {
            practiced.add(a.questionId);
            if (a.isStarred) starred.add(a.questionId);
          });
        }
      }

      setQuestions((qData ?? []).map((q: Record<string, unknown>) => ({
        id: q.id as string,
        category: q.category as string,
        difficulty: q.difficulty as string,
        question: q.question as string,
        sampleAnswer: q.sampleAnswer as string | null,
        tags: (q.tags as string[]) ?? [],
        isPracticed: practiced.has(q.id as string),
        isStarred: starred.has(q.id as string),
      })));
      setLoading(false);
    })();
  }, []);

  const toggleStar = async (qId: string, currentStarred: boolean) => {
    setActionId(qId);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setActionId(null); return; }

    const { data: existing } = await supabase
      .from('UserQuestionAttempt')
      .select('id')
      .eq('questionId', qId)
      .eq('userId', user.id)
      .single();

    if (existing) {
      await supabase.from('UserQuestionAttempt').update({ isStarred: !currentStarred }).eq('id', existing.id);
    } else {
      await supabase.from('UserQuestionAttempt').insert({ questionId: qId, userId: user.id, isStarred: true });
    }

    setQuestions(prev => prev.map(q =>
      q.id === qId ? { ...q, isStarred: !currentStarred, isPracticed: true } : q
    ));
    setActionId(null);
  };

  const markPracticed = async (qId: string) => {
    setActionId(qId + '-practice');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setActionId(null); return; }

    const { data: existing } = await supabase
      .from('UserQuestionAttempt')
      .select('id')
      .eq('questionId', qId)
      .eq('userId', user.id)
      .single();

    if (!existing) {
      await supabase.from('UserQuestionAttempt').insert({ questionId: qId, userId: user.id, isStarred: false });
    }
    setQuestions(prev => prev.map(q => q.id === qId ? { ...q, isPracticed: true } : q));
    setActionId(null);
  };

  const filtered = questions.filter(q => {
    const matchSearch = !search || q.question.toLowerCase().includes(search.toLowerCase()) || q.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchCat = !filterCat || q.category === filterCat;
    const matchDiff = !filterDiff || q.difficulty === filterDiff;
    const matchStarred = !showStarred || q.isStarred;
    return matchSearch && matchCat && matchDiff && matchStarred;
  });

  const categories = [...new Set(questions.map(q => q.category))];
  const practicedCount = questions.filter(q => q.isPracticed).length;

  if (loading) return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading question bank...
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Admin: Add Question */}
      {isAdmin && (
        <div className="flex justify-end">
          <Button size="sm" className="h-8 text-[11px] font-black rounded-xl gap-1" onClick={() => setShowAddForm(s => !s)}>
            {showAddForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showAddForm ? 'Cancel' : (editingQuestionId ? 'Edit Question' : 'Add Question')}
          </Button>
        </div>
      )}
      <AnimatePresence>
        {showAddForm && isAdmin && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card/30 border border-primary/30 rounded-2xl p-4 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">{editingQuestionId ? 'Edit Question' : 'New Question'}</p>
              <textarea
                placeholder="Question text *"
                value={addForm.question}
                onChange={e => setAddForm(p => ({ ...p, question: e.target.value }))}
                rows={2}
                className="w-full bg-card/40 border border-border/40 rounded-xl px-3 py-2 text-xs font-medium resize-none text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
              />
              <div className="grid grid-cols-2 gap-2">
                <select value={addForm.category} onChange={e => setAddForm(p => ({ ...p, category: e.target.value }))}
                  className="h-9 bg-card/40 border border-border/40 rounded-xl text-xs px-2 text-foreground">
                  {['BEHAVIORAL','SYSTEM_DESIGN','TECHNICAL','HR','CASE_STUDY'].map(c => <option key={c} value={c}>{c.replace('_',' ')}</option>)}
                </select>
                <select value={addForm.difficulty} onChange={e => setAddForm(p => ({ ...p, difficulty: e.target.value }))}
                  className="h-9 bg-card/40 border border-border/40 rounded-xl text-xs px-2 text-foreground">
                  {['EASY','MEDIUM','HARD'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <Input placeholder="Tags (comma-separated)" value={addForm.tags} onChange={e => setAddForm(p => ({ ...p, tags: e.target.value }))}
                  className="h-9 bg-card/40 border-border/40 rounded-xl text-xs" />
                <Input placeholder="Company tags (e.g. Google, Meta)" value={addForm.companyTags} onChange={e => setAddForm(p => ({ ...p, companyTags: e.target.value }))}
                  className="h-9 bg-card/40 border-border/40 rounded-xl text-xs" />
              </div>
              <textarea
                placeholder="Sample answer (optional)"
                value={addForm.sampleAnswer}
                onChange={e => setAddForm(p => ({ ...p, sampleAnswer: e.target.value }))}
                rows={2}
                className="w-full bg-card/40 border border-border/40 rounded-xl px-3 py-2 text-xs font-medium resize-none text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
              />
              <Input placeholder="Tip (optional)" value={addForm.tip} onChange={e => setAddForm(p => ({ ...p, tip: e.target.value }))}
                className="h-9 bg-card/40 border-border/40 rounded-xl text-xs" />
              <Button size="sm" className="h-8 text-[11px] font-black rounded-xl w-full" onClick={addQuestion}
                disabled={addingQuestion || !addForm.question}>
                {addingQuestion ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (editingQuestionId ? 'Update Question' : 'Save Question')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Strip */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total', value: questions.length },
          { label: 'Practiced', value: practicedCount },
          { label: 'Starred', value: questions.filter(q => q.isStarred).length },
        ].map(s => (
          <div key={s.label} className="bg-card/40 border border-border/30 rounded-2xl p-3 text-center">
            <p className="text-lg font-black italic">{s.value}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search questions or tags..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-9 bg-card/40 border-border/40 rounded-xl text-sm"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowStarred(s => !s)}
          className={cn("flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full border transition-all",
            showStarred ? "bg-amber-500/20 border-amber-500/40 text-amber-300" : "border-border/40 text-muted-foreground")}
        >
          <Star className="h-2.5 w-2.5" /> Starred
        </button>
        {['EASY', 'MEDIUM', 'HARD'].map(d => (
          <button
            key={d}
            onClick={() => setFilterDiff(filterDiff === d ? null : d)}
            className={cn("text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full border transition-all",
              filterDiff === d
                ? d === 'EASY' ? 'bg-green-500/20 border-green-500/40 text-green-300'
                  : d === 'MEDIUM' ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-red-500/20 border-red-500/40 text-red-300'
                : 'border-border/40 text-muted-foreground')}
          >
            {d}
          </button>
        ))}
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(filterCat === cat ? null : cat)}
            className={cn("text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full border transition-all",
              filterCat === cat
                ? CATEGORY_COLORS[cat] ?? 'bg-primary/20 border-primary/40 text-primary'
                : 'border-border/40 text-muted-foreground')}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Question Cards */}
      <AnimatePresence mode="popLayout">
        {filtered.map((q, i) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: i * 0.03 }}
            className={cn(
              "bg-card/40 border rounded-2xl p-4 transition-all",
              q.isPracticed ? "border-primary/30" : "border-border/40 hover:border-border"
            )}
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className={cn("text-[8px] font-black uppercase tracking-wider border px-2 py-0.5 rounded-full",
                    CATEGORY_COLORS[q.category] ?? 'border-primary/30 text-primary')}>
                    {q.category.replace('_', ' ')}
                  </span>
                  <span className={cn("text-[8px] font-black", DIFFICULTY_COLORS[q.difficulty])}>
                    {q.difficulty}
                  </span>
                  {q.isPracticed && (
                    <span className="text-[8px] font-black text-primary flex items-center gap-0.5">
                      <Check className="h-2.5 w-2.5" /> Practiced
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold leading-relaxed">{q.question}</p>
                {q.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {q.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-[8px] font-bold px-1.5 py-0">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => toggleStar(q.id, q.isStarred)}
                disabled={actionId === q.id}
                className="p-1 rounded-lg hover:bg-amber-500/10 transition-colors"
              >
                <Star className={cn("h-4 w-4", q.isStarred ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
              </button>
              {isAdmin && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEditQuestion(q.id)}
                    className="p-1 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground"
                    title="Edit question"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="p-1 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-3">
              {!q.isPracticed && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] font-black rounded-xl"
                  onClick={() => markPracticed(q.id)}
                  disabled={actionId === q.id + '-practice'}
                >
                  {actionId === q.id + '-practice' ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3 mr-1" />Practiced</>}
                </Button>
              )}
              {q.sampleAnswer && (
                <button
                  onClick={() => setExpanded(expanded === q.id ? null : q.id)}
                  className="flex items-center gap-1 text-[10px] font-black text-primary hover:text-primary/80"
                >
                  {expanded === q.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  Sample Answer
                </button>
              )}
            </div>

            <AnimatePresence>
              {expanded === q.id && q.sampleAnswer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 overflow-hidden"
                >
                  <div className="bg-card/30 border border-border/30 rounded-xl p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Sample Answer</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{q.sampleAnswer}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>

      {filtered.length === 0 && (
        <div className="text-center py-10">
          <BookOpen className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-sm font-bold text-muted-foreground">No questions match your filters.</p>
        </div>
      )}
    </div>
  );
}
