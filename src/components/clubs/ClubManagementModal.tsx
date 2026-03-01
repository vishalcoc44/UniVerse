'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Users,
    UserPlus,
    UserMinus,
    Check,
    X,
    Shield,
    MoreVertical,
    Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ClubManagementModalProps {
    clubId: string;
    clubName: string;
    trigger?: React.ReactNode;
}

interface Member {
    id: string;
    userId: string;
    role: string;
    status: string;
    joinedAt: string;
    profile: {
        fullName: string;
        avatarUrl: string | null;
        id: string;
    };
}

export function ClubManagementModal({ clubId, clubName, trigger }: ClubManagementModalProps) {
    const [open, setOpen] = useState(false);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            // Fetch club members with their profiles
            const { data, error } = await supabase
                .from('ClubMember')
                .select(`
                    id, 
                    userId, 
                    role, 
                    status, 
                    joinedAt,
                    profile:Profile!userId ( id, fullName, avatarUrl )
                `)
                .eq('clubId', clubId)
                .order('joinedAt', { ascending: false });

            if (error) throw error;
            setMembers((data || []) as any);
        } catch (error: any) {
            console.error("Error fetching members:", error);
            toast.error("Failed to load club members.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchMembers();
        }
    }, [open, clubId]);

    const handleUpdateStatus = async (memberId: string, newStatus: string) => {
        setProcessingId(memberId);
        try {
            const { error } = await supabase
                .from('ClubMember')
                .update({ status: newStatus })
                .eq('id', memberId);

            if (error) throw error;
            
            setMembers(prev => prev.map(m => m.id === memberId ? { ...m, status: newStatus } : m));
            toast.success(`Member ${newStatus === 'APPROVED' ? 'approved' : 'rejected'}.`);
        } catch (error: any) {
            toast.error("Failed to update status.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm("Are you sure you want to remove this member?")) return;
        
        setProcessingId(memberId);
        try {
            const { error } = await supabase
                .from('ClubMember')
                .delete()
                .eq('id', memberId);

            if (error) throw error;
            
            setMembers(prev => prev.filter(m => m.id !== memberId));
            toast.success("Member removed from club.");
        } catch (error: any) {
            toast.error("Failed to remove member.");
        } finally {
            setProcessingId(null);
        }
    };

    const pendingMembers = members.filter(m => m.status === 'PENDING' && m.role !== 'OWNER');
    const activeMembers = members.filter(m => m.status === 'APPROVED' || m.role === 'OWNER');

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <Users className="h-4 w-4" />
                        Manage
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-hidden flex flex-col bg-card/95 backdrop-blur-2xl border-border/50 rounded-3xl p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-black italic tracking-tighter flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Shield className="h-5 w-5" />
                        </div>
                        {clubName} <span className="text-primary italic">Dashboard</span>
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground font-medium italic">
                        Review join requests and manage your club members.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8">
                    {/* Pending Requests */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground italic flex items-center gap-2">
                                <UserPlus className="h-3 w-3 text-primary" />
                                Join Requests
                                {pendingMembers.length > 0 && (
                                    <Badge className="bg-primary text-primary-foreground h-5 min-w-[20px] px-1 justify-center rounded-full text-[10px]">
                                        {pendingMembers.length}
                                    </Badge>
                                )}
                            </h3>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : pendingMembers.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic bg-muted/20 p-4 rounded-2xl border border-dashed border-border/50 text-center">
                                No pending requests at the moment.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {pendingMembers.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between p-3 rounded-2xl bg-card border border-border/40 hover:border-primary/30 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 rounded-xl border border-border/50">
                                                <AvatarImage src={member.profile?.avatarUrl || ""} />
                                                <AvatarFallback className="bg-primary/5 text-primary font-black italic">
                                                    {member.profile?.fullName?.charAt(0) || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-black italic tracking-tight">{member.profile?.fullName}</p>
                                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Candidate</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button 
                                                size="icon" 
                                                variant="outline" 
                                                className="h-8 w-8 rounded-lg bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500 hover:text-white"
                                                onClick={() => handleUpdateStatus(member.id, 'APPROVED')}
                                                disabled={processingId === member.id}
                                            >
                                                {processingId === member.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                            </Button>
                                            <Button 
                                                size="icon" 
                                                variant="outline" 
                                                className="h-8 w-8 rounded-lg bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white"
                                                onClick={() => handleUpdateStatus(member.id, 'REJECTED')}
                                                disabled={processingId === member.id}
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Active Members */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground italic flex items-center gap-2">
                                <Users className="h-3 w-3 text-secondary" />
                                Active Members
                                <Badge variant="outline" className="h-5 rounded-full text-[10px] border-border/50">
                                    {activeMembers.length}
                                </Badge>
                            </h3>
                        </div>

                        {!loading && (
                            <div className="space-y-2">
                                {activeMembers.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between p-3 rounded-2xl bg-muted/10 hover:bg-muted/30 transition-colors border border-transparent hover:border-border/30">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 rounded-xl">
                                                <AvatarImage src={member.profile?.avatarUrl || ""} />
                                                <AvatarFallback className="bg-muted text-muted-foreground font-black italic text-xs">
                                                    {member.profile?.fullName?.charAt(0) || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-black italic tracking-tight flex items-center gap-2">
                                                    {member.profile?.fullName}
                                                    {member.role === 'OWNER' && (
                                                        <Shield className="h-3 w-3 text-primary" fill="currentColor" />
                                                    )}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                                    {member.role === 'OWNER' ? 'Creator' : 'Member'}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {member.role !== 'OWNER' && (
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                                onClick={() => handleRemoveMember(member.id)}
                                                disabled={processingId === member.id}
                                            >
                                                <UserMinus className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                <div className="p-6 pt-2 border-t border-border/30 bg-muted/5">
                    <Button variant="ghost" className="w-full h-12 rounded-2xl font-black italic tracking-tighter" onClick={() => setOpen(false)}>
                        CLOSE DASHBOARD
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
