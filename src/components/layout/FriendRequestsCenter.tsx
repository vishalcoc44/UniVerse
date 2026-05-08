'use client';

import { useState, useEffect } from "react";
import { UserPlus, Check, X, Loader2, Inbox, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { getCachedUser } from "@/lib/currentUser";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface FriendRequest {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: string;
  createdAt: string;
  // Joined profile (the *other* party — for received: requester; for sent: addressee)
  Other: {
    id: string;
    fullName: string;
    username: string | null;
    avatarUrl: string | null;
    department: string | null;
  } | null;
}

type Tab = 'received' | 'sent';

export function FriendRequestsCenter() {
  const router = useRouter();
  const [received, setReceived] = useState<FriendRequest[]>([]);
  const [sent, setSent] = useState<FriendRequest[]>([]);
  const [tab, setTab] = useState<Tab>('received');
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    const loadRequests = async (uid: string) => {
      const [receivedRes, sentRes] = await Promise.all([
        supabase
          .from('Friendship')
          .select('id, requesterId, addresseeId, status, createdAt, Other:Profile!Friendship_requesterId_fkey(id, fullName, username, avatarUrl, department)')
          .eq('addresseeId', uid)
          .eq('status', 'PENDING')
          .order('createdAt', { ascending: false }),
        supabase
          .from('Friendship')
          .select('id, requesterId, addresseeId, status, createdAt, Other:Profile!Friendship_addresseeId_fkey(id, fullName, username, avatarUrl, department)')
          .eq('requesterId', uid)
          .eq('status', 'PENDING')
          .order('createdAt', { ascending: false }),
      ]);

      if (cancelled) return;
      if (receivedRes.data) setReceived(receivedRes.data as unknown as FriendRequest[]);
      if (sentRes.data) setSent(sentRes.data as unknown as FriendRequest[]);
      setLoading(false);
    };

    (async () => {
      // Reuse the shared cached user (one getUser per page load, deduplicated
      // across Header / MobileNav / Sidebar / NotificationCenter / etc.).
      const user = await getCachedUser();
      if (cancelled) return;
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      await loadRequests(user.id);

      channel = supabase
        .channel('friend-requests-center')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'Friendship',
          filter: `addresseeId=eq.${user.id}`,
        }, () => loadRequests(user.id))
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'Friendship',
          filter: `requesterId=eq.${user.id}`,
        }, () => loadRequests(user.id))
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const accept = async (req: FriendRequest) => {
    setActingId(req.id);
    const { error } = await supabase
      .from('Friendship')
      .update({ status: 'ACCEPTED' })
      .eq('id', req.id);

    if (error) {
      toast.error("Failed to accept request");
    } else {
      setReceived(prev => prev.filter(r => r.id !== req.id));
      toast.success(`You and ${req.Other?.fullName ?? 'this user'} are now friends!`);
      void import("@/lib/analytics").then(({ track }) => track("accept_friend_request"));

      // Notify the requester that we accepted
      if (req.Other && userId) {
        await supabase.from('Notification').insert({
          userId: req.Other.id,
          type: 'FRIEND_REQUEST',
          title: 'Friend request accepted',
          body: `Your friend request was accepted.`,
          link: `/profile/${userId}`,
          isRead: false,
        });
      }
    }
    setActingId(null);
  };

  const decline = async (req: FriendRequest) => {
    setActingId(req.id);
    const { error } = await supabase.from('Friendship').delete().eq('id', req.id);
    if (error) {
      toast.error("Failed to decline request");
    } else {
      setReceived(prev => prev.filter(r => r.id !== req.id));
      void import("@/lib/analytics").then(({ track }) => track("decline_friend_request"));
    }
    setActingId(null);
  };

  const cancelSent = async (req: FriendRequest) => {
    setActingId(req.id);
    const { error } = await supabase.from('Friendship').delete().eq('id', req.id);
    if (error) {
      toast.error("Failed to cancel request");
    } else {
      setSent(prev => prev.filter(r => r.id !== req.id));
      toast.success("Request cancelled");
    }
    setActingId(null);
  };

  const goToProfile = (profileId: string) => {
    setOpen(false);
    router.push(`/profile/${profileId}`);
  };

  const list = tab === 'received' ? received : sent;
  const receivedCount = received.length;

  const initials = (name: string) =>
    name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8" title="Friend Requests">
          <UserPlus className="h-4 w-4" />
          <AnimatePresence>
            {receivedCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center px-1"
              >
                {receivedCount > 9 ? '9+' : receivedCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl" align="end" sideOffset={8}>
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <h3 className="font-bold text-sm">Friend Requests</h3>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/30 px-2 pt-2 gap-1">
          <button
            onClick={() => setTab('received')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors",
              tab === 'received' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Inbox className="h-3.5 w-3.5" />
            Received
            {receivedCount > 0 && (
              <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">{receivedCount}</Badge>
            )}
          </button>
          <button
            onClick={() => setTab('sent')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors",
              tab === 'sent' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Send className="h-3.5 w-3.5" />
            Sent
            {sent.length > 0 && (
              <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">{sent.length}</Badge>
            )}
          </button>
        </div>

        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <UserPlus className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">
                {tab === 'received' ? 'No pending requests' : 'No requests sent'}
              </p>
            </div>
          ) : (
            <div className="p-1.5 space-y-1">
              {list.map((req) => {
                const other = req.Other;
                if (!other) return null;
                const isActing = actingId === req.id;
                return (
                  <div
                    key={req.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors"
                  >
                    <button onClick={() => goToProfile(other.id)} className="shrink-0">
                      <Avatar className="h-10 w-10 cursor-pointer">
                        <AvatarImage src={other.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs bg-primary/15 text-primary font-bold">
                          {initials(other.fullName)}
                        </AvatarFallback>
                      </Avatar>
                    </button>

                    <button
                      onClick={() => goToProfile(other.id)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="text-sm font-semibold truncate hover:text-primary transition-colors">
                        {other.fullName}
                      </p>
                      {other.username && (
                        <p className="text-[11px] text-muted-foreground truncate">@{other.username}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                        {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                      </p>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      {tab === 'received' ? (
                        <>
                          <Button
                            size="icon"
                            onClick={() => accept(req)}
                            disabled={isActing}
                            className="h-8 w-8 rounded-lg bg-primary hover:bg-primary/90"
                            title="Accept"
                          >
                            {isActing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => decline(req)}
                            disabled={isActing}
                            className="h-8 w-8 rounded-lg"
                            title="Decline"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelSent(req)}
                          disabled={isActing}
                          className="h-8 px-3 rounded-lg text-[11px]"
                        >
                          {isActing ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Cancel'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
