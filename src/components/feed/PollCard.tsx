'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';


interface PollOption {
	id: string;
	text: string;
	displayOrder: number;
}

interface PollCardProps {
	pollId: string;
	question: string;
	options?: PollOption[];
	votes?: { optionId: string }[];
	currentUserId?: string;
	postId: string;
	onVoted?: () => void;
}

export function PollCard({ pollId, question, options = [], votes = [], currentUserId, postId, onVoted }: PollCardProps) {
	const [isVoting, setIsVoting] = useState(false);

	const totalVotes = votes.length;
	const myVote = votes.find((v) => {
		// We don't have userId on vote here, check via separate state
		return false;
	});

	// Better approach: check if current user voted
	const userVotedOption = votes.find(v => (v as any).userId === currentUserId)?.optionId;
	const hasVoted = !!userVotedOption;

	const getCount = (optionId: string) => votes.filter(v => v.optionId === optionId).length;
	const getPercent = (optionId: string) => totalVotes > 0 ? Math.round((getCount(optionId) / totalVotes) * 100) : 0;

	const handleVote = async (optionId: string) => {
		if (!currentUserId || hasVoted) return;
		setIsVoting(true);
		try {
			const { error } = await supabase.from('PostPollVote').insert({
				id: crypto.randomUUID(),
				pollId,
				optionId,
				userId: currentUserId,
			});
			if (error) throw error;
			void import("@/lib/analytics").then(({ track }) => track("vote_post_poll"));
			toast.success('Vote recorded!');
			onVoted?.();
		} catch (err: any) {
			toast.error(err.message || 'Failed to vote');
		} finally {
			setIsVoting(false);
		}
	};

	const sortedOptions = [...options].sort((a, b) => a.displayOrder - b.displayOrder);

	return (
		<div className="mt-3 border border-border/30 rounded-2xl overflow-hidden bg-muted/10">
			<div className="px-4 pt-3 pb-2">
				<p className="text-sm font-bold text-foreground mb-3">📊 {question}</p>
				<div className="space-y-2">
					{sortedOptions.map((option) => {
						const pct = getPercent(option.id);
						const isSelected = userVotedOption === option.id;
						return (
							<button
								key={option.id}
								disabled={hasVoted || isVoting || !currentUserId}
								onClick={() => handleVote(option.id)}
								className={cn(
									'relative w-full text-left rounded-xl overflow-hidden transition-all border',
									hasVoted
										? isSelected
											? 'border-primary/50 bg-primary/5'
											: 'border-border/20 bg-muted/20'
										: 'border-border/40 hover:border-primary/50 hover:bg-primary/5 cursor-pointer'
								)}
							>
								<div
									className={cn('absolute inset-0 rounded-xl transition-all duration-700', isSelected ? 'bg-primary/15' : 'bg-muted/30')}
									style={{ width: hasVoted ? `${pct}%` : '0%' }}
								/>
								<div className="relative flex items-center justify-between px-3 py-2.5">
									<span className={cn('text-[12px] font-semibold', isSelected ? 'text-primary' : 'text-foreground/80')}>
										{isSelected && <CheckCircle2 className="inline h-3 w-3 mr-1.5 mb-0.5" />}{option.text}
									</span>
									{hasVoted && <span className="text-[11px] font-black text-muted-foreground">{pct}%</span>}
								</div>
							</button>
						);
					})}
				</div>
			</div>
			<div className="px-4 pb-3 pt-1 flex items-center gap-2">
				<span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
				{isVoting && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
			</div>
		</div>
	);
}
