'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowRight, Plus, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getStudyGroups, createStudyGroup, joinStudyGroup } from "@/app/academic/actions";
import { useUserUniversity } from "@/hooks/useUserUniversity";

interface StudyGroup {
	id: string;
	name: string;
	description: string;
	memberCount: number;
}

export function StudyCircles() {
	const [groups, setGroups] = useState<StudyGroup[]>([]);
	const [loading, setLoading] = useState(true);
	const { universityId, loading: uniLoading } = useUserUniversity();

	// Create Modal State
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [newGroup, setNewGroup] = useState({ name: "", description: "" });

	// Join State
	const [joiningId, setJoiningId] = useState<string | null>(null);

	const fetchGroups = async () => {
		if (!universityId) return;
		setLoading(true);
		const { success, groups: data, error } = await getStudyGroups(universityId);
		if (success && data) {
			setGroups(data);
		} else {
			console.error(error);
		}
		setLoading(false);
	};

	useEffect(() => {
		if (!uniLoading) fetchGroups();
	}, [universityId, uniLoading]);

	const handleCreate = async () => {
		if (!universityId) return;
		setIsCreating(true);
		const { success, error } = await createStudyGroup({ ...newGroup, universityId });

		if (success) {
			toast.success("Study circle created!");
			setIsCreateOpen(false);
			setNewGroup({ name: "", description: "" });
			fetchGroups();
		} else {
			toast.error(error || "Failed to create group");
		}
		setIsCreating(false);
	};

	const handleJoin = async (id: string, name: string) => {
		setJoiningId(id);
		const { success, error } = await joinStudyGroup(id);
		if (success) {
			toast.success(`Joined ${name}!`);
			fetchGroups();
		} else if (error === "Already a member") {
			toast.info(`You are already in ${name}`);
		} else {
			toast.error(error || "Failed to join");
		}
		setJoiningId(null);
	};

	return (
		<Card className="p-4 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-500/20 shrink-0">
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-3">
					<div className="p-2 bg-indigo-500/20 text-indigo-600 rounded-lg">
						<Users className="h-5 w-5" />
					</div>
					<div>
						<h3 className="font-semibold text-foreground">Study Circles</h3>
						<p className="text-xs text-muted-foreground">{groups.length} active circles</p>
					</div>
				</div>
				<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
					<DialogTrigger asChild>
						<Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600 hover:bg-indigo-500/10">
							<Plus className="h-5 w-5" />
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create Study Circle</DialogTitle>
							<DialogDescription>Start a new group for collaborative learning.</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label>Group Name</Label>
								<Input placeholder="e.g. CS101 Finals Prep" value={newGroup.name} onChange={e => setNewGroup({ ...newGroup, name: e.target.value })} />
							</div>
							<div className="space-y-2">
								<Label>Description</Label>
								<Textarea placeholder="What are you studying?" value={newGroup.description} onChange={e => setNewGroup({ ...newGroup, description: e.target.value })} />
							</div>
						</div>
						<DialogFooter>
							<Button onClick={handleCreate} disabled={isCreating || !newGroup.name}>
								{isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Circle"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<div className="space-y-2 mb-3 max-h-[160px] overflow-y-auto pr-1">
				{loading ? (
					<div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
				) : groups.length === 0 ? (
					<p className="text-xs text-center text-muted-foreground py-2">No active circles. Create one!</p>
				) : (
					groups.map(group => (
						<div key={group.id} className="flex items-center justify-between p-2 bg-background/60 rounded-lg text-sm hover:bg-background/80 transition-colors">
							<div className="overflow-hidden">
								<div className="font-medium truncate max-w-[140px]" title={group.name}>{group.name}</div>
								<div className="text-[10px] text-muted-foreground truncate max-w-[140px]">{group.description || "No description"}</div>
							</div>
							<Button
								variant="secondary"
								size="sm"
								className="h-6 text-[10px] bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20"
								onClick={() => handleJoin(group.id, group.name)}
								disabled={joiningId === group.id}
							>
								{joiningId === group.id ? <Loader2 className="h-3 w-3 animate-spin" /> : `${group.memberCount} joined`}
							</Button>
						</div>
					))
				)}
			</div>

			<Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20" size="sm" variant="outline">
				Browse All <ArrowRight className="h-4 w-4 ml-2" />
			</Button>
		</Card>
	);
}
