'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ArrowBigUp, ArrowBigDown, ArrowLeft, MessageSquare, Eye,
  Bookmark, BookmarkCheck, Flag, Send, Loader2, VenetianMask,
  ShieldCheck, MoreHorizontal, Trash2, BarChart3, CheckCircle2
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface Thread {
  id: string;
  title: string;
  content: string;
  isAnonymous: boolean;
  authorId: string;
  anonymousSeed: number | null;
  category: string;
  scope: string;
  tags: string[];
  isPinned: boolean;
  viewCount: number;
  attachments: any;
  createdAt: string;
  updatedAt: string;
}

interface Reply {
  id: string;
  content: string;
  isAnonymous: boolean;
  threadId: string;
  authorId: string;
  anonymousSeed: number | null;
  attachments: any;
  createdAt: string;
  totalVotes: number;
}

interface Poll {
  id: string;
  threadId: string;
  question: string;
  expiresAt: string | null;
  options: PollOption[];
}

interface PollOption {
  id: string;
  optionText: string;
  order: number;
  voteCount: number;
}

function getAnonLabel(seed: number | null): string {
  if (seed === null) return "Anonymous";
  return `Anonymous #${Math.abs(seed) % 10000}`;
}

export default function ThreadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = params.threadId as string;

  const [thread, setThread] = useState<Thread | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [threadVote, setThreadVote] = useState(0);
  const [threadTotalVotes, setThreadTotalVotes] = useState(0);
  const [replyVotes, setReplyVotes] = useState<Record<string, number>>({});

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ threadId?: string; replyId?: string }>({});
  const [reportReason, setReportReason] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  const [replyContent, setReplyContent] = useState("");
  const [replyAnon, setReplyAnon] = useState(true);
  const [replySubmitting, setReplySubmitting] = useState(false);

  const [poll, setPoll] = useState<Poll | null>(null);
  const [userPollVote, setUserPollVote] = useState<string | null>(null);
  const [pollVoting, setPollVoting] = useState(false);

  const fetchThread = useCallback(async () => {
    if (!threadId) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    const { data: threadData, error: threadError } = await supabase
      .from('ForumThread')
      .select('*')
      .eq('id', threadId)
      .single();

    if (threadError || !threadData) {
      toast.error("Thread not found");
      router.push('/forums');
      return;
    }

    setThread(threadData);

    // Increment view count (fire and forget)
    supabase.from('ForumThread')
      .update({ viewCount: (threadData.viewCount || 0) + 1 })
      .eq('id', threadId)
      .then();

    // Fetch thread votes
    const { data: tVotes } = await supabase
      .from('ForumVote')
      .select('value, userId')
      .eq('threadId', threadId)
      .is('replyId', null);

    const total = tVotes?.reduce((acc, v) => acc + v.value, 0) || 0;
    setThreadTotalVotes(total);
    const myVote = tVotes?.find(v => v.userId === user?.id)?.value || 0;
    setThreadVote(myVote);

    // Fetch bookmark
    if (user) {
      const { data: bm } = await supabase
        .from('ForumBookmark')
        .select('id')
        .eq('threadId', threadId)
        .eq('userId', user.id)
        .maybeSingle();
      setIsBookmarked(!!bm);
    }

    // Fetch replies
    const { data: repliesData } = await supabase
      .from('ForumReply')
      .select('*')
      .eq('threadId', threadId)
      .order('createdAt', { ascending: true });

    const replyIds = repliesData?.map(r => r.id) || [];
    let allReplyVotes: any[] = [];
    if (replyIds.length > 0) {
      const { data: rv } = await supabase
        .from('ForumVote')
        .select('replyId, value, userId')
        .in('replyId', replyIds);
      allReplyVotes = rv || [];
    }

    const processedReplies = repliesData?.map(reply => {
      const rVotes = allReplyVotes.filter(v => v.replyId === reply.id);
      const totalV = rVotes.reduce((acc: number, v: any) => acc + v.value, 0);
      const myV = rVotes.find((v: any) => v.userId === user?.id)?.value || 0;
      if (myV) setReplyVotes(prev => ({ ...prev, [reply.id]: myV }));
      return { ...reply, totalVotes: totalV };
    }) || [];

    setReplies(processedReplies);

    // Fetch poll
    const { data: pollData } = await supabase
      .from('ForumPoll')
      .select('*')
      .eq('threadId', threadId)
      .maybeSingle();

    if (pollData) {
      const { data: options } = await supabase
        .from('ForumPollOption')
        .select('*')
        .eq('pollId', pollData.id)
        .order('order', { ascending: true });

      const optionIds = options?.map(o => o.id) || [];
      let pollVotesData: any[] = [];
      if (optionIds.length > 0) {
        const { data: pvd } = await supabase
          .from('ForumPollVote')
          .select('optionId, userId')
          .eq('pollId', pollData.id);
        pollVotesData = pvd || [];
      }

      const myPollVote = pollVotesData.find(v => v.userId === user?.id);
      if (myPollVote) setUserPollVote(myPollVote.optionId);

      const enrichedOptions = options?.map(o => ({
        ...o,
        voteCount: pollVotesData.filter(v => v.optionId === o.id).length
      })) || [];

      setPoll({ ...pollData, options: enrichedOptions });
    }

    setLoading(false);
  }, [threadId, router]);

  useEffect(() => { fetchThread(); }, [fetchThread]);

  const handleThreadVote = async (value: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newValue = threadVote === value ? 0 : value;
    if (newValue === 0) {
      await supabase.from('ForumVote').delete()
        .eq('threadId', threadId).is('replyId', null).eq('userId', user.id);
    } else {
      await supabase.from('ForumVote').upsert({
        threadId, userId: user.id, value: newValue, replyId: null
      });
    }
    setThreadTotalVotes(prev => prev - threadVote + newValue);
    setThreadVote(newValue);
  };

  const handleReplyVote = async (replyId: string, value: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const current = replyVotes[replyId] || 0;
    const newValue = current === value ? 0 : value;

    if (newValue === 0) {
      await supabase.from('ForumVote').delete()
        .eq('replyId', replyId).eq('userId', user.id);
    } else {
      await supabase.from('ForumVote').upsert({
        replyId, threadId, userId: user.id, value: newValue
      });
    }
    setReplyVotes(prev => ({ ...prev, [replyId]: newValue }));
    setReplies(prev => prev.map(r =>
      r.id === replyId ? { ...r, totalVotes: r.totalVotes - current + newValue } : r
    ));
  };

  const handleBookmark = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setBookmarkLoading(true);

    if (isBookmarked) {
      await supabase.from('ForumBookmark').delete()
        .eq('threadId', threadId).eq('userId', user.id);
      setIsBookmarked(false);
      toast.success("Bookmark removed");
    } else {
      await supabase.from('ForumBookmark').insert({
        id: crypto.randomUUID(), threadId, userId: user.id
      });
      setIsBookmarked(true);
      toast.success("Thread bookmarked");
    }
    setBookmarkLoading(false);
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    setReportLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('ForumReport').insert({
      id: crypto.randomUUID(),
      threadId: reportTarget.threadId || null,
      replyId: reportTarget.replyId || null,
      reporterId: user.id,
      reason: reportReason,
      status: 'PENDING'
    });

    setReportOpen(false);
    setReportReason("");
    setReportLoading(false);
    toast.success("Report submitted — our team will review it.");
  };

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) return;
    setReplySubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Log in to reply"); setReplySubmitting(false); return; }

    const { error } = await supabase.from('ForumReply').insert({
      id: crypto.randomUUID(),
      content: replyContent,
      isAnonymous: replyAnon,
      threadId,
      authorId: user.id,
    });

    if (error) {
      toast.error("Failed to post reply");
    } else {
      setReplyContent("");
      toast.success("Reply posted");
      fetchThread();
    }
    setReplySubmitting(false);
  };

  const handleDeleteReply = async (replyId: string) => {
    const { error } = await supabase.from('ForumReply').delete().eq('id', replyId);
    if (error) { toast.error("Failed to delete"); return; }
    setReplies(prev => prev.filter(r => r.id !== replyId));
    toast.success("Reply deleted");
  };

  const handlePollVote = async (optionId: string) => {
    if (userPollVote || !poll) return;
    setPollVoting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setPollVoting(false); return; }

    await supabase.from('ForumPollVote').insert({
      id: crypto.randomUUID(),
      optionId, pollId: poll.id, userId: user.id
    });

    setUserPollVote(optionId);
    setPoll(prev => prev ? {
      ...prev,
      options: prev.options.map(o =>
        o.id === optionId ? { ...o, voteCount: o.voteCount + 1 } : o
      )
    } : null);
    setPollVoting(false);
    toast.success("Vote recorded");
  };

  if (loading) {
    return (
      <DashboardLayout title="Thread" breadcrumb={["UniVerse", "Forums", "Thread"]}>
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
          <p className="text-xs font-black italic tracking-widest text-muted-foreground uppercase">
            Decrypting Thread...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (!thread) return null;

  const totalPollVotes = poll?.options.reduce((s, o) => s + o.voteCount, 0) || 0;
  const pollExpired = poll?.expiresAt ? new Date(poll.expiresAt) < new Date() : false;

  return (
    <DashboardLayout
      title="Thread"
      breadcrumb={["UniVerse", "Forums", "Thread"]}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/forums')}
          className="rounded-full font-black italic tracking-tight text-muted-foreground hover:text-foreground gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Forums
        </Button>

        {/* Thread Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className={cn(
            "relative overflow-hidden bg-card/40 backdrop-blur-xl border-border/50 rounded-[2rem] shadow-xl",
            thread.isPinned && "border-primary/40 bg-primary/5 shadow-primary/10"
          )}>
            <div className="flex">
              {/* Voting Column */}
              <div className="w-16 flex flex-col items-center p-4 gap-2 border-r border-border/20 bg-muted/5">
                <Button
                  variant="ghost" size="icon"
                  className={cn(
                    "h-10 w-10 rounded-xl transition-all",
                    threadVote === 1
                      ? "bg-orange-500/20 text-orange-500"
                      : "text-muted-foreground hover:bg-orange-500/10 hover:text-orange-500"
                  )}
                  onClick={() => handleThreadVote(1)}
                >
                  <ArrowBigUp className="h-7 w-7" />
                </Button>
                <span className="text-lg font-black italic tracking-tighter">{threadTotalVotes}</span>
                <Button
                  variant="ghost" size="icon"
                  className={cn(
                    "h-10 w-10 rounded-xl transition-all",
                    threadVote === -1
                      ? "bg-blue-500/20 text-blue-500"
                      : "text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500"
                  )}
                  onClick={() => handleThreadVote(-1)}
                >
                  <ArrowBigDown className="h-7 w-7" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    {thread.isPinned && (
                      <Badge className="bg-primary text-primary-foreground font-black italic tracking-widest text-[9px] uppercase px-2 py-0.5 rounded-md">
                        Pinned
                      </Badge>
                    )}
                    <div className="flex items-center gap-2 px-3 py-1 bg-muted/20 rounded-full border border-border/30">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">
                        {thread.category || "General"}
                      </span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
                      {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost" size="icon"
                      onClick={handleBookmark}
                      disabled={bookmarkLoading}
                      className={cn(
                        "h-8 w-8 rounded-xl transition-all",
                        isBookmarked ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground hover:text-amber-500"
                      )}
                    >
                      {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={() => { setReportTarget({ threadId: thread.id }); setReportOpen(true); }}
                          className="cursor-pointer"
                        >
                          <Flag className="h-4 w-4 mr-2" />
                          Report Thread
                        </DropdownMenuItem>
                        {currentUserId === thread.authorId && (
                          <DropdownMenuItem
                            onClick={async () => {
                              await supabase.from('ForumThread').delete().eq('id', thread.id);
                              toast.success("Thread deleted");
                              router.push('/forums');
                            }}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <h1 className="text-3xl font-black italic tracking-tighter leading-tight mb-4">
                  {thread.title}
                </h1>
                <p className="text-base font-medium text-muted-foreground/80 italic tracking-tight leading-relaxed whitespace-pre-wrap">
                  {thread.content}
                </p>

                {thread.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-6">
                    {thread.tags.map((tag: string) => (
                      <Badge key={tag} className="bg-muted/20 text-muted-foreground hover:bg-muted/30 border-none px-3 py-1 rounded-full font-black italic tracking-widest text-[9px] uppercase">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-6 mt-8 pt-6 border-t border-border/10">
                  <div className="flex items-center gap-2 text-muted-foreground/60">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-xs font-black italic tracking-widest uppercase">
                      {replies.length} Responses
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground/60">
                    <Eye className="h-4 w-4" />
                    <span className="text-xs font-black italic tracking-widest uppercase">
                      {(thread.viewCount || 0) + 1} Reads
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground/60">
                    {thread.isAnonymous
                      ? <VenetianMask className="h-4 w-4" />
                      : <ShieldCheck className="h-4 w-4" />
                    }
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">
                      {thread.isAnonymous
                        ? getAnonLabel(thread.anonymousSeed)
                        : "Verified Identity"
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Poll Section */}
        <AnimatePresence>
          {poll && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="bg-card/40 backdrop-blur-xl border-border/50 rounded-[2rem] shadow-xl p-8 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black italic tracking-tighter">{poll.question}</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">
                      {totalPollVotes} votes{pollExpired ? " — Poll Closed" : ""}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {poll.options.map((option) => {
                    const pct = totalPollVotes > 0 ? Math.round((option.voteCount / totalPollVotes) * 100) : 0;
                    const voted = userPollVote === option.id;
                    const showResults = !!userPollVote || pollExpired;

                    return (
                      <button
                        key={option.id}
                        onClick={() => handlePollVote(option.id)}
                        disabled={!!userPollVote || pollExpired || pollVoting}
                        className={cn(
                          "relative w-full text-left p-4 rounded-2xl border transition-all overflow-hidden",
                          voted
                            ? "border-primary/50 bg-primary/10"
                            : "border-border/30 bg-muted/10 hover:border-primary/30 hover:bg-muted/20",
                          (!!userPollVote || pollExpired) && "cursor-default"
                        )}
                      >
                        {showResults && (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className={cn(
                              "absolute inset-y-0 left-0 rounded-2xl",
                              voted ? "bg-primary/15" : "bg-muted/20"
                            )}
                          />
                        )}
                        <div className="relative z-10 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {voted && <CheckCircle2 className="h-4 w-4 text-primary" />}
                            <span className="text-sm font-black italic tracking-tight">{option.optionText}</span>
                          </div>
                          {showResults && (
                            <span className="text-xs font-black italic tracking-widest text-muted-foreground">
                              {pct}%
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Replies */}
        <div className="space-y-4">
          <h2 className="text-xl font-black italic tracking-tighter flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-primary" />
            {replies.length} {replies.length === 1 ? 'Response' : 'Responses'}
          </h2>

          {replies.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground bg-card/20 rounded-[2rem] border-2 border-dashed border-border/30 flex flex-col items-center gap-4">
              <MessageSquare className="h-8 w-8 opacity-20" />
              <p className="text-lg font-black italic tracking-tighter text-foreground">No responses yet.</p>
              <p className="text-sm font-medium italic text-muted-foreground">Be the first to break the silence.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {replies.map((reply, idx) => (
                <motion.div
                  key={reply.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Card className="group relative flex overflow-hidden bg-card/40 backdrop-blur-xl border-border/50 rounded-[1.5rem] shadow-lg hover:border-primary/30 transition-all">
                    {/* Reply Voting */}
                    <div className="w-14 flex flex-col items-center p-3 gap-1 border-r border-border/20 bg-muted/5">
                      <Button
                        variant="ghost" size="icon"
                        className={cn(
                          "h-8 w-8 rounded-lg transition-all",
                          replyVotes[reply.id] === 1
                            ? "bg-orange-500/20 text-orange-500"
                            : "text-muted-foreground hover:bg-orange-500/10 hover:text-orange-500"
                        )}
                        onClick={() => handleReplyVote(reply.id, 1)}
                      >
                        <ArrowBigUp className="h-5 w-5" />
                      </Button>
                      <span className="text-sm font-black italic tracking-tighter">{reply.totalVotes}</span>
                      <Button
                        variant="ghost" size="icon"
                        className={cn(
                          "h-8 w-8 rounded-lg transition-all",
                          replyVotes[reply.id] === -1
                            ? "bg-blue-500/20 text-blue-500"
                            : "text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500"
                        )}
                        onClick={() => handleReplyVote(reply.id, -1)}
                      >
                        <ArrowBigDown className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Reply Content */}
                    <div className="flex-1 p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            {reply.isAnonymous
                              ? <VenetianMask className="h-3.5 w-3.5 text-emerald-500" />
                              : <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                            }
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">
                              {reply.isAnonymous
                                ? getAnonLabel(reply.anonymousSeed)
                                : "Verified Identity"
                              }
                            </span>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
                            {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-red-500"
                            onClick={() => { setReportTarget({ replyId: reply.id, threadId }); setReportOpen(true); }}
                          >
                            <Flag className="h-3.5 w-3.5" />
                          </Button>
                          {currentUserId === reply.authorId && (
                            <Button
                              variant="ghost" size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-red-500"
                              onClick={() => handleDeleteReply(reply.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <p className="text-sm font-medium text-muted-foreground/90 italic tracking-tight leading-relaxed whitespace-pre-wrap">
                        {reply.content}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Reply Composer */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className={cn(
            "rounded-[2rem] border transition-all overflow-hidden shadow-xl",
            replyAnon
              ? "bg-zinc-950/80 border-zinc-800/50 shadow-emerald-500/5"
              : "bg-card/40 backdrop-blur-xl border-border/50 shadow-primary/5"
          )}>
            {replyAnon && (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.05),transparent)] pointer-events-none" />
            )}
            <div className="p-6 space-y-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                  replyAnon ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"
                )}>
                  {replyAnon ? <VenetianMask className="h-5 w-5" /> : <Send className="h-5 w-5" />}
                </div>
                <h3 className={cn(
                  "font-black text-lg italic tracking-tighter uppercase",
                  replyAnon ? "text-zinc-100" : "text-foreground"
                )}>
                  Compose Reply
                </h3>
              </div>

              <Textarea
                placeholder="Write your response..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className={cn(
                  "resize-none min-h-[100px] border-none focus-visible:ring-0 bg-transparent text-base font-medium leading-relaxed italic tracking-tight placeholder:text-muted-foreground/40",
                  replyAnon ? "text-zinc-300" : "text-muted-foreground"
                )}
              />

              <div className="flex items-center justify-between pt-4 border-t border-border/10">
                <div className="flex items-center gap-3 bg-muted/10 p-2 rounded-2xl border border-border/20">
                  <Switch
                    id="reply-anon"
                    checked={replyAnon}
                    onCheckedChange={setReplyAnon}
                    className="data-[state=checked]:bg-emerald-500 h-6 w-11"
                  />
                  <Label
                    htmlFor="reply-anon"
                    className={cn(
                      "text-xs font-black italic tracking-widest uppercase cursor-pointer",
                      replyAnon ? "text-emerald-500" : "text-muted-foreground"
                    )}
                  >
                    {replyAnon ? "Identity Masked" : "Identity Visible"}
                  </Label>
                </div>

                <Button
                  onClick={handleReplySubmit}
                  disabled={replySubmitting || !replyContent.trim()}
                  className={cn(
                    "h-12 px-8 rounded-2xl font-black italic tracking-tighter transition-all shadow-xl",
                    replyAnon
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20"
                  )}
                >
                  {replySubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Send Reply
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black italic tracking-tighter text-xl">
              Report Content
            </DialogTitle>
            <DialogDescription className="text-sm font-medium italic text-muted-foreground">
              Help us keep the community safe. Describe why you&apos;re reporting this.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Describe the issue..."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="min-h-[100px] rounded-xl"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReportOpen(false)} className="rounded-xl font-black italic tracking-tight">
              Cancel
            </Button>
            <Button
              onClick={handleReport}
              disabled={reportLoading || !reportReason.trim()}
              className="rounded-xl font-black italic tracking-tight bg-red-500 hover:bg-red-600 text-white"
            >
              {reportLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
