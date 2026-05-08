import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, SlidersHorizontal, Sparkles } from "lucide-react";
import { ClubCard } from "./ClubCard";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserUniversity } from "@/hooks/useUserUniversity";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const categoryOptions = ["All", "Tech", "Arts", "Sports", "Social", "Academic"];

type ClubRow = {
	id: string;
	name: string;
	description: string | null;
	logoUrl: string | null;
	scope: "CAMPUS" | "UNIVERSE";
	universityId: string | null;
};

export function ClubGrid({ scope = 'campus' }: { scope?: 'campus' | 'universe' }) {
	const [searchTerm, setSearchTerm] = useState("");
	const [activeFilter, setActiveFilter] = useState("All");
	const [clubs, setClubs] = useState<ClubRow[]>([]);
	const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
	const [joinedClubIds, setJoinedClubIds] = useState<Set<string>>(new Set());
	const [pendingClubIds, setPendingClubIds] = useState<Set<string>>(new Set());
	const [ownedClubIds, setOwnedClubIds] = useState<Set<string>>(new Set());
	const [joinLoadingClubId, setJoinLoadingClubId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [errorText, setErrorText] = useState<string | null>(null);
	const { universityId, loading: uniLoading } = useUserUniversity();

	const getErrorMessage = (error: any) => error?.message || error?.details || error?.hint || "Unknown error";

	useEffect(() => {
		if (uniLoading) return;

		const fetchClubs = async () => {
			setLoading(true);
			setErrorText(null);
			let query = supabase
				.from('Club')
				.select('id,name,description,logoUrl,scope,universityId')
				.order('createdAt', { ascending: false });

			if (scope === 'campus') {
				if (universityId) {
					query = query.eq('scope', 'CAMPUS').eq('universityId', universityId);
				} else {
					setClubs([]);
					setMemberCounts({});
					setJoinedClubIds(new Set());
					setOwnedClubIds(new Set());
					setLoading(false);
					return;
				}
			} else {
				query = query.eq('scope', 'UNIVERSE');
			}

			const { data, error } = await query;
			if (error) {
				const message = getErrorMessage(error);
				console.error("Error fetching clubs:", message, error);
				setErrorText(message);
				toast.error(`Failed to load clubs: ${message}`);
				setClubs([]);
				setMemberCounts({});
				setJoinedClubIds(new Set());
			} else {
				const rows = (data || []) as ClubRow[];

				if (rows.length > 0) {
					const clubIds = rows.map((club) => club.id);
					const { data: memberships, error: membershipError } = await supabase
						.from('ClubMember')
						.select('clubId,userId,role,status')
						.in('clubId', clubIds);

					const counts: Record<string, number> = {};
					const joined = new Set<string>();
					const pending = new Set<string>();
					const owned = new Set<string>();

					if (!membershipError && memberships) {
						const { data: authData } = await supabase.auth.getUser();
						const userId = authData.user?.id;

						for (const row of memberships as Array<{ clubId: string; userId: string; role: string; status: string | null }>) {
							// status may be null if migration hasn't run yet — treat null/APPROVED/OWNER as approved
							const isApproved = row.status === 'APPROVED' || row.status === null || row.role === 'OWNER';
							const isPending = row.status === 'PENDING';

							if (isApproved) {
								counts[row.clubId] = (counts[row.clubId] || 0) + 1;
							}

							if (userId && row.userId === userId) {
								joined.add(row.clubId);
								if (isPending) pending.add(row.clubId);
								if (row.role === 'OWNER') owned.add(row.clubId);
							}
						}
					}

					// Set clubs and membership-derived state together so the cards
					// never render with a stale joined-set (which would show "INITIATE
					// CONTACT" on a club the user already owns and trigger a unique
					// constraint violation on click).
					setMemberCounts(counts);
					setJoinedClubIds(joined);
					setPendingClubIds(pending);
					setOwnedClubIds(owned);
					setClubs(rows);
				} else {
					setMemberCounts({});
					setJoinedClubIds(new Set());
					setPendingClubIds(new Set());
					setOwnedClubIds(new Set());
					setClubs(rows);
				}
			}
			setLoading(false);
		};

		fetchClubs();
	}, [scope, universityId, uniLoading]);

	const inferCategory = (name: string, description: string): string => {
		const text = `${name} ${description}`.toLowerCase();
		if (text.match(/code|tech|ai|dev|robot|hack|engineer|computer|software/)) return "Tech";
		if (text.match(/art|music|dance|drama|photo|film|theatr|paint|sculpt|design/)) return "Arts";
		if (text.match(/sport|football|cricket|basketball|athlet|tennis|swim|gym/)) return "Sports";
		if (text.match(/study|debate|academic|research|quiz|learn|science|history/)) return "Academic";
		return "Social";
	};

	const filteredClubs = useMemo(() => {
		if (!clubs) return [];
		return clubs.filter((club) => {
			const matchesSearch =
				club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				(club.description || "").toLowerCase().includes(searchTerm.toLowerCase());
			const inferredCategory = inferCategory(club.name, club.description || "");
			const matchesFilter = activeFilter === "All" || inferredCategory === activeFilter;
			return matchesSearch && matchesFilter;
		});
	}, [clubs, searchTerm, activeFilter]);

	const handleToggleJoin = async (clubId: string, isCurrentlyJoined: boolean) => {
		setJoinLoadingClubId(clubId);
		try {
			const { data: authData } = await supabase.auth.getUser();
			const userId = authData.user?.id;
			if (!userId) {
				toast.error("Please log in to join clubs.");
				return;
			}

			if (isCurrentlyJoined) {
				const { error } = await supabase
					.from('ClubMember')
					.delete()
					.eq('clubId', clubId)
					.eq('userId', userId);

				if (error) throw error;
				setJoinedClubIds((prev) => {
					const next = new Set(prev);
					next.delete(clubId);
					return next;
				});
				setPendingClubIds((prev) => {
					const next = new Set(prev);
					next.delete(clubId);
					return next;
				});
				// Count only decreases if they were approved
				setMemberCounts((prev) => ({ ...prev, [clubId]: Math.max(0, (prev[clubId] || 1) - 1) }));
				void import("@/lib/analytics").then(({ track }) => track("leave_club"));
				toast.success("Withdrew application or left club.");
			} else {
				const newMemberId = crypto.randomUUID();
				const { error } = await supabase
					.from('ClubMember')
					.insert({
						id: newMemberId,
						clubId,
						userId,
						role: 'MEMBER'
					});

				if (error) {
					// 23505 = unique_violation: the user already has a ClubMember row
					// for this club (most often because they're the OWNER who just
					// created it and the UI rendered before memberships loaded).
					// Recover by reading the existing row and syncing local state.
					if (error.code === '23505') {
						const { data: existing } = await supabase
							.from('ClubMember')
							.select('role,status')
							.eq('clubId', clubId)
							.eq('userId', userId)
							.maybeSingle();
						setJoinedClubIds((prev) => new Set(prev).add(clubId));
						if (existing?.status === 'PENDING') {
							setPendingClubIds((prev) => new Set(prev).add(clubId));
						}
						if (existing?.role === 'OWNER') {
							setOwnedClubIds((prev) => new Set(prev).add(clubId));
							toast.info("You own this club — you're already a member.");
						} else {
							toast.info("You're already a member of this club.");
						}
						return;
					}
					throw error;
				}
				// Silently try to set PENDING status — only works after migration is applied
				await supabase.from('ClubMember').update({ status: 'PENDING' }).eq('id', newMemberId);
				setJoinedClubIds((prev) => new Set(prev).add(clubId));
				setPendingClubIds((prev) => new Set(prev).add(clubId));
				void import("@/lib/analytics").then(({ track }) => track("apply_to_club"));
				toast.success("Application sent! Awaiting club approval.");
			}
		} catch (error: any) {
			toast.error(`Operation failed: ${getErrorMessage(error)}`);
		} finally {
			setJoinLoadingClubId(null);
		}
	};

	const handleDeleteClub = async (clubId: string) => {
		try {
			const { error } = await supabase
				.from('Club')
				.delete()
				.eq('id', clubId);

			if (error) throw error;

			setClubs((prev) => prev.filter(c => c.id !== clubId));
			toast.success("Club disbanded successfully.");
		} catch (error: any) {
			toast.error(`Failed to delete club: ${getErrorMessage(error)}`);
		}
	};

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center py-40 gap-4">
				<div className="relative">
					<div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
					<motion.div
						animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
						transition={{ duration: 2, repeat: Infinity }}
						className="absolute inset-0 flex items-center justify-center"
					>
						<Sparkles className="h-6 w-6 text-primary" />
					</motion.div>
				</div>
				<p className="text-sm font-black italic tracking-widest text-muted-foreground uppercase animate-pulse">Synchronizing Communities...</p>
			</div>
		);
	}

	return (
		<div className="space-y-12">
			{/* Filters & Search Header */}
			<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card/40 backdrop-blur-xl border border-border/50 p-6 md:p-8 rounded-[3rem] shadow-xl">
				<div className="relative flex-1 group">
					<Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
					<Input
						placeholder="Search by name, interest or vibe..."
						className="w-full pl-14 pr-10 h-16 bg-card/60 rounded-2xl border-border/30 focus:border-primary/50 text-lg font-black italic tracking-tight placeholder:text-muted-foreground/40 transition-all outline-none focus:ring-0"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<div
						className="flex items-center gap-1.5 p-1.5 bg-card/60 backdrop-blur-md rounded-2xl border border-border/30"
						role="tablist"
						aria-label="Category filter"
					>
						{categoryOptions.map((cat) => (
							<button
								key={cat}
								role="tab"
								aria-selected={activeFilter === cat}
								onClick={() => setActiveFilter(cat)}
								className={cn(
									"px-5 py-2 rounded-xl text-xs font-black italic uppercase tracking-widest transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary",
									activeFilter === cat
										? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
										: "text-muted-foreground hover:text-foreground hover:bg-muted"
								)}
							>
								{cat}
							</button>
						))}
					</div>
					<Button variant="outline" className="h-12 w-12 rounded-2xl border-border/30 bg-card/60 hover:bg-muted">
						<SlidersHorizontal className="h-5 w-5" />
					</Button>
				</div>
			</div>

			<AnimatePresence mode="popLayout">
				<motion.div
					layout
					className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
				>
					{filteredClubs.map((club) => (
						<motion.div
							layout
							key={club.id}
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.9 }}
							transition={{ duration: 0.3 }}
						>
							<ClubCard
								id={club.id}
								name={club.name}
								description={club.description || "No description provided."}
								category={inferCategory(club.name, club.description || "")}
								members={memberCounts[club.id] || 0}
								logoUrl={club.logoUrl}
								scope={club.scope}
								isJoined={joinedClubIds.has(club.id)}
								isPending={pendingClubIds.has(club.id)}
								isOwner={ownedClubIds.has(club.id)}
								onToggleJoin={handleToggleJoin}
								onDelete={handleDeleteClub}
								joinLoading={joinLoadingClubId === club.id}
							/>
						</motion.div>
					))}
				</motion.div>
			</AnimatePresence>

			{filteredClubs.length === 0 && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="flex flex-col items-center justify-center py-40 text-center gap-6 bg-card/20 backdrop-blur-sm border border-dashed border-border/50 rounded-[3rem]"
				>
					<div className="h-24 w-24 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground/30">
						<Search className="h-12 w-12" />
					</div>
					<div className="space-y-2">
						<h3 className="text-2xl font-black italic tracking-tighter">UNABLE TO LOCATE TRIBE</h3>
						<p className="text-muted-foreground font-medium italic">Adjust your signals and try searching for another community.</p>
					</div>
					<Button
						variant="outline"
						className="rounded-xl font-black italic text-[10px] uppercase tracking-widest px-8"
						onClick={() => { setSearchTerm(""); setActiveFilter("All"); }}
					>
						Reset Frequencies
					</Button>
				</motion.div>
			)}
		</div>
	);
}
