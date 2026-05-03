'use client';

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search, GraduationCap, Briefcase, Linkedin, Users,
  Loader2, Check, SlidersHorizontal, X, Send, ChevronRight, Plus, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface MentorProfile {
  id: string;
  userId: string;
  headline?: string;
  company?: string;
  role?: string;
  gradYear?: number;
  department?: string;
  availableSlots: number;
  isAccepting: boolean;
  linkedinUrl?: string;
  bio?: string;
  skills: string[];
  profile?: {
    fullName: string;
    avatarUrl?: string;
    department?: string;
    universityName?: string;
  };
}

interface RequestModalProps {
  mentor: MentorProfile;
  menteeId: string;
  onClose: () => void;
  onSent: () => void;
}

function MentorshipRequestModal({ mentor, menteeId, onClose, onSent }: RequestModalProps) {
  const [message, setMessage] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const GOAL_OPTIONS = ['Career guidance', 'Technical skills', 'Job search', 'Interview prep', 'Resume review', 'Networking'];

  const toggle = (g: string) =>
    setGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const send = async () => {
    if (!message.trim()) return;
    setSending(true);
    await supabase.from('MentorshipRequest').insert({
      id: crypto.randomUUID(),
      menteeId,
      mentorId: mentor.userId,
      message,
      goalAreas: goals,
    });
    setSending(false);
    onSent();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border/50 rounded-3xl p-6 w-full max-w-md space-y-4"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-black text-xl italic tracking-tight">Request Mentorship</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Reaching out to <span className="font-bold text-amber-400">{mentor.profile?.fullName ?? mentor.role}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted/50 text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">What do you want help with?</p>
          <div className="flex flex-wrap gap-2">
            {GOAL_OPTIONS.map(g => (
              <button
                key={g}
                onClick={() => toggle(g)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-black border transition-all",
                  goals.includes(g)
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    : "bg-muted/30 text-muted-foreground border-border/30"
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">Message *</p>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Introduce yourself and explain what you're hoping to learn..."
            rows={4}
            className="w-full bg-background/40 border border-border/40 rounded-2xl px-4 py-3 text-sm font-bold resize-none focus:outline-none focus:border-amber-500/50 text-foreground placeholder:text-muted-foreground/50"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 rounded-2xl" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1 rounded-2xl bg-amber-500 hover:bg-amber-600 font-black italic shadow-lg shadow-amber-500/20"
            disabled={!message.trim() || sending}
            onClick={send}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <><Send className="h-3.5 w-3.5 mr-1.5" /> Send Request</>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export function AlumniDirectory() {
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [requestTarget, setRequestTarget] = useState<MentorProfile | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddMentor, setShowAddMentor] = useState(false);
  const [addingMentor, setAddingMentor] = useState(false);
  const [mentorForm, setMentorForm] = useState({
    userEmail: '', headline: '', company: '', role: '', gradYear: '',
    department: '', availableSlots: '3', bio: '', linkedinUrl: '', skills: '',
  });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        // FC-1 fix: MentorProfile admin RLS is is_platform_admin().
        const { data: profile } = await supabase.from('Profile').select('role, universityId').eq('id', uid).single();
        setIsAdmin(profile?.role === 'ADMIN' && !profile?.universityId);
      }
    });
  }, []);

  const addMentorProfile = async () => {
    if (!mentorForm.userEmail) return;
    setAddingMentor(true);
    const email = mentorForm.userEmail.trim();
    const { data: byEmail } = await supabase
      .from('Profile')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    const { data: byUniversityEmail } = byEmail
      ? { data: null }
      : await supabase
          .from('Profile')
          .select('id')
          .eq('universityEmail', email)
          .maybeSingle();

    const profile = byEmail ?? byUniversityEmail;

    if (!profile) {
      alert('No user found with that email.');
      setAddingMentor(false);
      return;
    }

    const { error } = await supabase.from('MentorProfile').upsert({
      userId: profile.id,
      headline: mentorForm.headline || null,
      company: mentorForm.company || null,
      role: mentorForm.role || null,
      gradYear: mentorForm.gradYear ? parseInt(mentorForm.gradYear) : null,
      department: mentorForm.department || null,
      availableSlots: mentorForm.availableSlots ? parseInt(mentorForm.availableSlots) : 3,
      bio: mentorForm.bio || null,
      linkedinUrl: mentorForm.linkedinUrl || null,
      skills: mentorForm.skills.split(',').map(s => s.trim()).filter(Boolean),
      isAccepting: true,
    }, { onConflict: 'userId' });

    if (error) {
      alert(error.message);
      setAddingMentor(false);
      return;
    }

    setMentorForm({ userEmail: '', headline: '', company: '', role: '', gradYear: '', department: '', availableSlots: '3', bio: '', linkedinUrl: '', skills: '' });
    setShowAddMentor(false);
    await fetchMentors();
    setAddingMentor(false);
  };

  const deleteMentor = async (mentorId: string) => {
    await supabase.from('MentorProfile').delete().eq('id', mentorId);
    setMentors(prev => prev.filter(m => m.id !== mentorId));
  };

  const fetchMentors = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('MentorProfile')
      .select('*, profile:Profile(fullName, avatarUrl, department, universityName)')
      .eq('isAccepting', true)
      .order('createdAt', { ascending: false })
      .limit(50);
    setMentors((data ?? []) as MentorProfile[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchMentors(); }, [fetchMentors]);

  // Fetch already-sent requests
  useEffect(() => {
    if (!userId) return;
    supabase
      .from('MentorshipRequest')
      .select('mentorId')
      .eq('menteeId', userId)
      .then(({ data }) => {
        if (data) setSentIds(new Set(data.map(r => r.mentorId)));
      });
  }, [userId]);

  const filtered = mentors.filter(m => {
    const name = m.profile?.fullName?.toLowerCase() ?? '';
    const q = query.toLowerCase();
    const matchQ = !q || name.includes(q) || m.company?.toLowerCase().includes(q) || m.role?.toLowerCase().includes(q) || m.department?.toLowerCase().includes(q);
    const matchDept = !filterDept || (m.department ?? '').toLowerCase().includes(filterDept.toLowerCase());
    return matchQ && matchDept;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter">Alumni Network</h2>
          <p className="text-xs text-muted-foreground font-bold mt-0.5">
            {filtered.length} mentors available
          </p>
        </div>
        {isAdmin && (
          <Button size="sm" className="h-8 text-[11px] font-black rounded-xl gap-1" onClick={() => setShowAddMentor(s => !s)}>
            {showAddMentor ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showAddMentor ? 'Cancel' : 'Add Mentor'}
          </Button>
        )}
      </div>

      <AnimatePresence>
        {showAddMentor && isAdmin && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card/30 border border-amber-500/30 rounded-2xl p-4 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Register Mentor Profile</p>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="User email * (to look up)" value={mentorForm.userEmail} onChange={e => setMentorForm(p => ({ ...p, userEmail: e.target.value }))}
                  className="col-span-2 h-9 bg-card/40 border-border/40 rounded-xl text-xs" />
                <Input placeholder="Role / Title" value={mentorForm.role} onChange={e => setMentorForm(p => ({ ...p, role: e.target.value }))}
                  className="h-9 bg-card/40 border-border/40 rounded-xl text-xs" />
                <Input placeholder="Company" value={mentorForm.company} onChange={e => setMentorForm(p => ({ ...p, company: e.target.value }))}
                  className="h-9 bg-card/40 border-border/40 rounded-xl text-xs" />
                <Input placeholder="Department" value={mentorForm.department} onChange={e => setMentorForm(p => ({ ...p, department: e.target.value }))}
                  className="h-9 bg-card/40 border-border/40 rounded-xl text-xs" />
                <Input placeholder="Grad year (e.g. 2022)" type="number" value={mentorForm.gradYear} onChange={e => setMentorForm(p => ({ ...p, gradYear: e.target.value }))}
                  className="h-9 bg-card/40 border-border/40 rounded-xl text-xs" />
                <Input placeholder="Headline" value={mentorForm.headline} onChange={e => setMentorForm(p => ({ ...p, headline: e.target.value }))}
                  className="h-9 bg-card/40 border-border/40 rounded-xl text-xs" />
                <Input placeholder="Available slots" type="number" value={mentorForm.availableSlots} onChange={e => setMentorForm(p => ({ ...p, availableSlots: e.target.value }))}
                  className="h-9 bg-card/40 border-border/40 rounded-xl text-xs" />
                <Input placeholder="LinkedIn URL" value={mentorForm.linkedinUrl} onChange={e => setMentorForm(p => ({ ...p, linkedinUrl: e.target.value }))}
                  className="h-9 bg-card/40 border-border/40 rounded-xl text-xs" />
                <Input placeholder="Skills (comma-separated)" value={mentorForm.skills} onChange={e => setMentorForm(p => ({ ...p, skills: e.target.value }))}
                  className="col-span-2 h-9 bg-card/40 border-border/40 rounded-xl text-xs" />
                <textarea placeholder="Bio (optional)" value={mentorForm.bio} onChange={e => setMentorForm(p => ({ ...p, bio: e.target.value }))}
                  rows={2} className="col-span-2 bg-card/40 border border-border/40 rounded-xl px-3 py-2 text-xs resize-none text-foreground placeholder:text-muted-foreground outline-none focus:border-amber-500/50" />
              </div>
              <Button size="sm" className="h-8 text-[11px] font-black rounded-xl w-full bg-amber-500 hover:bg-amber-600" onClick={addMentorProfile}
                disabled={addingMentor || !mentorForm.userEmail}>
                {addingMentor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Register Mentor'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, company, role..."
            className="pl-11 h-11 rounded-2xl bg-card/40 border-border/40 font-bold text-sm"
          />
        </div>
        <Input
          value={filterDept}
          onChange={e => setFilterDept(e.target.value)}
          placeholder="Filter by department..."
          className="w-48 h-11 rounded-2xl bg-card/40 border-border/40 font-bold text-sm"
        />
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 bg-card/30 rounded-3xl border border-border/30">
          <Users className="h-8 w-8 text-muted-foreground" />
          <p className="font-black italic text-muted-foreground">No mentors found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence>
            {filtered.map((mentor, i) => (
              <motion.div
                key={mentor.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-5 hover:border-amber-500/20 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 border-2 border-border/50">
                    <AvatarImage src={mentor.profile?.avatarUrl} />
                    <AvatarFallback className="bg-amber-500/10 text-amber-400 font-black text-sm">
                      {(mentor.profile?.fullName ?? 'M')[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-black text-sm italic tracking-tight group-hover:text-amber-400 transition-colors">
                          {mentor.profile?.fullName ?? 'Alumni'}
                        </p>
                        <p className="text-xs text-muted-foreground font-bold">
                          {mentor.role}{mentor.company ? ` @ ${mentor.company}` : ''}
                        </p>
                      </div>
                      {mentor.gradYear && (
                        <Badge variant="outline" className="text-[9px] font-black border-amber-500/20 text-amber-400 shrink-0">
                          '{String(mentor.gradYear).slice(-2)}
                        </Badge>
                      )}
                    </div>

                    {mentor.department && (
                      <p className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold mt-1">
                        <GraduationCap className="h-3 w-3" />
                        {mentor.department}
                      </p>
                    )}

                    {mentor.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {mentor.skills.slice(0, 3).map(s => (
                          <span key={s} className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {mentor.bio && (
                  <p className="text-[11px] text-muted-foreground mt-3 line-clamp-2 italic leading-relaxed">
                    {mentor.bio}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/20">
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                    mentor.isAccepting
                      ? "bg-green-500/10 text-green-400"
                      : "bg-muted/30 text-muted-foreground"
                  )}>
                    {mentor.isAccepting ? `${mentor.availableSlots} slot${mentor.availableSlots !== 1 ? 's' : ''}` : 'Full'}
                  </span>

                  {mentor.linkedinUrl && (
                    <a
                      href={mentor.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-xl hover:bg-blue-500/10 text-muted-foreground hover:text-blue-400 transition-colors"
                    >
                      <Linkedin className="h-3.5 w-3.5" />
                    </a>
                  )}

                  <Button
                    size="sm"
                    className={cn(
                      "ml-auto h-8 px-4 rounded-xl text-xs font-black",
                      sentIds.has(mentor.userId)
                        ? "bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20"
                        : "bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20"
                    )}
                    disabled={sentIds.has(mentor.userId) || !mentor.isAccepting}
                    onClick={() => userId && setRequestTarget(mentor)}
                  >
                    {sentIds.has(mentor.userId) ? (
                      <><Check className="h-3 w-3 mr-1" /> Requested</>
                    ) : (
                      <><ChevronRight className="h-3 w-3 mr-1" /> Connect</>
                    )}
                  </Button>
                  {isAdmin && (
                    <button
                      onClick={() => deleteMentor(mentor.id)}
                      className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Request modal */}
      {requestTarget && userId && (
        <MentorshipRequestModal
          mentor={requestTarget}
          menteeId={userId}
          onClose={() => setRequestTarget(null)}
          onSent={() => setSentIds(prev => new Set([...prev, requestTarget.userId]))}
        />
      )}
    </div>
  );
}
