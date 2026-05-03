'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Clock, UserX, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface FriendshipButtonProps {
  targetUserId: string;
  currentUserId: string;
  size?: "sm" | "default" | "icon";
  className?: string;
}

export function FriendshipButton({ targetUserId, currentUserId, size = "sm", className }: FriendshipButtonProps) {
  const [status, setStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'blocked'>('none');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
      setLoading(false);
      return;
    }
    checkFriendship();
  }, [currentUserId, targetUserId]);

  const checkFriendship = async () => {
    const { data } = await supabase
      .from('Friendship')
      .select('id, requesterId, addresseeId, status')
      .or(`and(requesterId.eq.${currentUserId},addresseeId.eq.${targetUserId}),and(requesterId.eq.${targetUserId},addresseeId.eq.${currentUserId})`)
      .maybeSingle();

    if (data) {
      if (data.status === 'ACCEPTED') setStatus('accepted');
      else if (data.status === 'BLOCKED') setStatus('blocked');
      else if (data.status === 'PENDING') {
        setStatus(data.requesterId === currentUserId ? 'pending_sent' : 'pending_received');
      }
    } else {
      setStatus('none');
    }
    setLoading(false);
  };

  const sendRequest = async () => {
    setActing(true);
    const { error } = await supabase.from('Friendship').insert({
      id: crypto.randomUUID(),
      requesterId: currentUserId,
      addresseeId: targetUserId,
      status: 'PENDING',
      updatedAt: new Date().toISOString(),
    });
    if (error) {
      toast.error("Failed to send friend request");
    } else {
      setStatus('pending_sent');
      void import("@/lib/analytics").then(({ track }) => track("send_friend_request"));
      toast.success("Friend request sent!");
    }
    setActing(false);
  };

  const acceptRequest = async () => {
    setActing(true);
    const { error } = await supabase
      .from('Friendship')
      .update({ status: 'ACCEPTED' })
      .eq('requesterId', targetUserId)
      .eq('addresseeId', currentUserId);
    if (error) {
      toast.error("Failed to accept request");
    } else {
      setStatus('accepted');
      void import("@/lib/analytics").then(({ track }) => track("accept_friend_request"));
      toast.success("Friend request accepted!");
    }
    setActing(false);
  };

  const removeFriendship = async () => {
    setActing(true);
    await supabase
      .from('Friendship')
      .delete()
      .or(`and(requesterId.eq.${currentUserId},addresseeId.eq.${targetUserId}),and(requesterId.eq.${targetUserId},addresseeId.eq.${currentUserId})`);
    setStatus('none');
    void import("@/lib/analytics").then(({ track }) => track("remove_friendship"));
    toast.success("Removed");
    setActing(false);
  };

  if (loading) return <Button size={size} variant="ghost" disabled className={className}><Loader2 className="h-3 w-3 animate-spin" /></Button>;
  if (currentUserId === targetUserId) return null;

  if (status === 'accepted') {
    return (
      <Button size={size} variant="outline" onClick={removeFriendship} disabled={acting} className={className}>
        <UserCheck className="h-3.5 w-3.5 mr-1.5" /> Friends
      </Button>
    );
  }

  if (status === 'pending_sent') {
    return (
      <Button size={size} variant="outline" onClick={removeFriendship} disabled={acting} className={className}>
        <Clock className="h-3.5 w-3.5 mr-1.5" /> Pending
      </Button>
    );
  }

  if (status === 'pending_received') {
    return (
      <Button size={size} onClick={acceptRequest} disabled={acting} className={className}>
        <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Accept
      </Button>
    );
  }

  return (
    <Button size={size} variant="outline" onClick={sendRequest} disabled={acting} className={className}>
      <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Add Friend
    </Button>
  );
}
