'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, FileText, MessageSquare, Settings, X, ChevronRight, Plus, Download, Shield, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getStudyGroupDetails, getStudyGroupMessages, sendStudyGroupMessage } from "@/app/academic/actions";
import { toast } from "sonner";

interface Member {
	id: string;
	role: string;
	user: {
		fullName: string;
		username: string;
		avatarUrl?: string;
	};
}

interface GroupResource {
	id: string;
	title: string;
	type: string;
	fileUrl: string;
	uploader: {
		fullName: string;
		username: string;
	};
	createdAt: string;
}

interface GroupMessage {
	id: string;
	content: string;
	createdAt: string;
	sender: {
		fullName: string;
		username: string;
		avatarUrl?: string;
	};
	senderId: string;
}

interface GroupDetailsProps {
	group: {
		id: string;
		name: string;
		description: string;
	};
	onBack: () => void;
	userId?: string;
}

export function GroupDetails({ group, onBack, userId }: GroupDetailsProps) {
	const [activeTab, setActiveTab] = useState("overview");
	const [members, setMembers] = useState<Member[]>([]);
	const [resources, setResources] = useState<GroupResource[]>([]);
	const [messages, setMessages] = useState<GroupMessage[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [newMessage, setNewMessage] = useState("");
	const [isSending, setIsSending] = useState(false);

	useEffect(() => {
		async function loadData() {
			setIsLoading(true);
			const details = await getStudyGroupDetails(group.id);
			if (details.success) {
				setMembers(details.members || []);
				setResources(details.resources || []);
			} else {
				toast.error("Failed to load group intel");
			}
			setIsLoading(false);
		}
		loadData();
	}, [group.id]);

	useEffect(() => {
		if (activeTab === "chat") {
			const fetchMessages = async () => {
				const res = await getStudyGroupMessages(group.id);
				if (res.success) {
					setMessages(res.messages || []);
				}
			};
			fetchMessages();
			
			// Poll for new messages every 5 seconds for basic real-time feel
			const interval = setInterval(fetchMessages, 5000);
			return () => clearInterval(interval);
		}
	}, [activeTab, group.id]);

	const handleSendMessage = async () => {
		if (!newMessage.trim() || isSending) return;
		setIsSending(true);
		const res = await sendStudyGroupMessage(group.id, newMessage);
		if (res.success) {
			setNewMessage("");
			// Refresh messages immediately
			const mRes = await getStudyGroupMessages(group.id);
			if (mRes.success) setMessages(mRes.messages || []);
		} else {
			toast.error("Signal lost: Failed to send message");
		}
		setIsSending(false);
	};

	return (
		<motion.div 
			initial={{ opacity: 0, x: 20 }} 
			animate={{ opacity: 1, x: 0 }} 
			exit={{ opacity: 0, x: 20 }}
			className="flex flex-col h-full"
		>
			{/* Header */}
			<div className="flex items-center justify-between mb-8 pb-6 border-b border-border/20">
				<div className="flex items-center gap-4">
					<Button 
						variant="outline" 
						size="sm" 
						onClick={onBack}
						className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all active:scale-95 group border-primary/20"
					>
						<X className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
						Close Circle
					</Button>
					<div className="h-10 w-[1px] bg-border/30" />
					<div className="flex flex-col">
						<div className="flex items-center gap-3">
							<h3 className="text-2xl font-black tracking-tight">{group.name}</h3>
							<Badge className="bg-primary/20 text-primary border-primary/20 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 shadow-[0_0_10px_rgba(var(--primary),0.1)]">
								Circle Active
							</Badge>
						</div>
						<p className="text-xs text-muted-foreground font-medium mt-1">{group.description}</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button size="icon" variant="outline" className="rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all border-border/20">
									<Settings className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Circle Settings</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			</div>

			<div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-8">
				{/* Sidebar Tabs */}
				<div className="md:col-span-1 flex flex-col gap-2">
					{[
						{ id: "overview", label: "Overview", icon: ChevronRight },
						{ id: "members", label: "Members", icon: Users, count: members.length },
						{ id: "resources", label: "Resource Hub", icon: FileText, count: resources.length },
						{ id: "chat", label: "Group Synapse", icon: MessageSquare },
					].map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`
								flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group
								${activeTab === tab.id 
									? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.05)]" 
									: "hover:bg-muted/50 text-muted-foreground border border-transparent"}
							`}
						>
							<div className="flex items-center gap-3">
								<tab.icon className={`h-4 w-4 transition-transform duration-500 ${activeTab === tab.id ? "rotate-90 text-primary" : "group-hover:translate-x-1"}`} />
								<span className="text-xs font-black uppercase tracking-[0.1em]">{tab.label}</span>
							</div>
							{tab.count !== undefined && (
								<Badge variant="outline" className={`text-[10px] rounded-lg ${activeTab === tab.id ? "bg-primary text-white border-transparent" : "opacity-50"}`}>
									{tab.count}
								</Badge>
							)}
						</button>
					))}
				</div>

				{/* Content Area */}
				<div className="md:col-span-3 bg-card/20 backdrop-blur-xl border border-border/20 rounded-[2rem] overflow-hidden flex flex-col relative group/content shadow-2xl">
					<div className="absolute inset-0 bg-gradient-to-br from-primary/2 via-transparent to-transparent pointer-events-none" />
					
					<div className="flex-1 p-8 overflow-y-auto relative z-10 custom-scrollbar">
						<AnimatePresence mode="wait">
							{activeTab === "overview" && (
								<motion.div 
									key="overview"
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									className="space-y-8"
								>
									<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
										{[
											{ label: "Stability", value: "98%", sub: "Circle Uptime" },
											{ label: "Active Now", value: "4", sub: "Students Online" },
											{ label: "Last Sync", value: "2m", sub: "Ago" },
										].map((stat, i) => (
											<div key={i} className="p-6 bg-muted/20 border border-border/10 rounded-2xl flex flex-col gap-1 hover:bg-muted/30 transition-colors group/stat">
												<span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover/stat:text-primary transition-colors">{stat.label}</span>
												<span className="text-3xl font-black text-foreground">{stat.value}</span>
												<span className="text-[9px] text-muted-foreground opacity-60 italic">{stat.sub}</span>
											</div>
										))}
									</div>

									<div className="space-y-4">
										<h4 className="text-sm font-black uppercase tracking-[0.2em] text-primary/80">Circle Intel</h4>
										<Card className="p-6 bg-card/40 border-border/10 rounded-2xl leading-relaxed text-sm text-foreground/80 font-medium whitespace-pre-wrap">
											{group.description}
										</Card>
									</div>

									<div className="p-6 border border-dashed border-primary/20 rounded-2xl bg-primary/5 flex items-center justify-between group hover:border-primary/40 transition-all cursor-pointer">
										<div className="flex items-center gap-4">
											<div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
												<Plus className="h-6 w-6" />
											</div>
											<div>
												<p className="text-sm font-black uppercase tracking-wider">Expand Circle</p>
												<p className="text-xs text-muted-foreground">Invite more collaborators to this research session.</p>
											</div>
										</div>
										<ChevronRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
									</div>
								</motion.div>
							)}

							{activeTab === "members" && (
								<motion.div 
									key="members"
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									className="space-y-6"
								>
									<div className="flex items-center justify-between pb-4 border-b border-border/10">
										<h4 className="text-sm font-black uppercase tracking-[0.2em] text-primary/80">Circle Collaborators</h4>
										<Badge variant="outline" className="rounded-xl border-primary/30 text-[9px] font-black">{members.length} Total</Badge>
									</div>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										{members.map((member) => (
											<div key={member.id} className="p-4 bg-muted/30 border border-border/10 rounded-2xl flex items-center justify-between hover:bg-muted/40 transition-colors group">
												<div className="flex items-center gap-3">
													<Avatar className="h-10 w-10 border border-border/20">
														<AvatarImage src={member.user.avatarUrl} />
														<AvatarFallback className="bg-primary/10 text-primary font-black">{member.user.fullName[0]}</AvatarFallback>
													</Avatar>
													<div>
														<p className="text-xs font-black tracking-tight">{member.user.fullName}</p>
														<p className="text-[10px] text-muted-foreground">@{member.user.username}</p>
													</div>
												</div>
												{member.role === "ADMIN" ? (
													<Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 font-sans flex items-center gap-1.5 shadow-sm">
														<Shield className="h-3 w-3" /> Admin
													</Badge>
												) : (
													<Badge variant="outline" className="text-muted-foreground text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-border/20">Analyst</Badge>
												)}
											</div>
										))}
									</div>
								</motion.div>
							)}

							{activeTab === "resources" && (
								<motion.div 
									key="resources"
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									className="space-y-6"
								>
									<div className="flex items-center justify-between pb-4 border-b border-border/10">
										<h4 className="text-sm font-black uppercase tracking-[0.2em] text-primary/80">Resource Manifest</h4>
										<Button size="sm" className="h-8 rounded-xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest px-4 shadow-lg shadow-primary/20">
											<Plus className="h-3.5 w-3.5 mr-2" /> Upload Note
										</Button>
									</div>
									<div className="space-y-3">
										{resources.length === 0 ? (
											<div className="text-center py-20 opacity-30">
												<FileText className="h-12 w-12 mx-auto mb-4" />
												<p className="text-xs font-black uppercase tracking-widest">No resources detected in manifest</p>
											</div>
										) : resources.map((item) => (
											<div key={item.id} className="flex items-center justify-between p-4 bg-muted/20 border border-border/10 rounded-2xl hover:bg-muted/30 transition-colors group">
												<div className="flex items-center gap-4">
													<div className="h-10 w-10 rounded-xl bg-background border border-border/20 flex items-center justify-center text-primary/60 group-hover:text-primary group-hover:scale-105 transition-all">
														<FileText className="h-5 w-5" />
													</div>
													<div>
														<p className="text-xs font-black tracking-tight">{item.title}</p>
														<div className="flex items-center gap-2 mt-1">
															<Badge variant="outline" className="text-[9px] px-1 font-black text-muted-foreground border-border/20">NOTE</Badge>
															<span className="text-[9px] text-muted-foreground/40">•</span>
															<span className="text-[9px] text-muted-foreground/60">@{item.uploader.username}</span>
															<span className="text-[9px] text-muted-foreground/40">•</span>
															<span className="text-[9px] text-muted-foreground/60">{new Date(item.createdAt).toLocaleDateString()}</span>
														</div>
													</div>
												</div>
												<Button 
													variant="outline" 
													size="icon" 
													asChild
													className="h-9 w-9 rounded-xl hover:bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-all border-primary/20"
												>
													<a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
														<Download className="h-4 w-4" />
													</a>
												</Button>
											</div>
										))}
									</div>
								</motion.div>
							)}

							{activeTab === "chat" && (
								<motion.div 
									key="chat"
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									className="flex flex-col h-[400px]"
								>
									<div className="flex-1 space-y-4 mb-4 pr-2 overflow-y-auto custom-scrollbar flex flex-col pt-4">
										<div className="text-center py-6">
											<Badge variant="outline" className="rounded-xl border-border/20 bg-muted/20 text-muted-foreground text-[10px] font-black px-4">Encryption Level: SEC-9</Badge>
										</div>
										{messages.length === 0 ? (
											<div className="flex-1 flex items-center justify-center text-muted-foreground/30 flex-col gap-2">
												<MessageSquare className="h-8 w-8" />
												<p className="text-[10px] font-black uppercase tracking-widest">Awaiting first transmission</p>
											</div>
										) : messages.map((msg) => {
											const isSelf = msg.senderId === userId;
											return (
												<div key={msg.id} className={`flex flex-col ${isSelf ? "items-end" : "items-start"} gap-1.5`}>
													{!isSelf && <span className="text-[10px] font-black uppercase tracking-wider ml-1 text-muted-foreground">{msg.sender.fullName}</span>}
													<div className={`p-3 text-xs font-medium max-w-[80%] rounded-2xl ${isSelf ? "bg-primary text-primary-foreground rounded-tr-none shadow-lg shadow-primary/10" : "bg-muted/50 rounded-tl-none border border-border/10"}`}>
														{msg.content}
													</div>
													<span className="text-[8px] text-muted-foreground/50 font-black uppercase tracking-widest">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
												</div>
											);
										})}
									</div>
									<div className="flex gap-2 p-1 bg-background/50 backdrop-blur-md rounded-2xl border border-border/20 shadow-xl">
										<Input 
											placeholder="Inject message into synapse..." 
											className="border-none bg-transparent focus-visible:ring-0 text-xs font-medium placeholder:text-muted-foreground/30"
											value={newMessage}
											onChange={(e) => setNewMessage(e.target.value)}
											onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
											disabled={isSending}
										/>
										<Button 
											onClick={handleSendMessage}
											disabled={isSending || !newMessage.trim()}
											size="icon" 
											className="h-10 w-10 rounded-xl bg-primary shadow-lg shadow-primary/20 shrink-0 border-none"
										>
											<ChevronRight className={`h-4 w-4 ${isSending ? "animate-pulse" : ""}`} />
										</Button>
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>
			</div>
		</motion.div>
	);
}
