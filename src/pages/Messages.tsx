import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ConversationList } from "@/components/messages/ConversationList";
import { ChatWindow } from "@/components/messages/ChatWindow";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { MessageSquareDashed } from "lucide-react";

const Messages = () => {
	const [activeChatId, setActiveChatId] = useState<string | null>("1");

	const conversations = [
		{
			id: "1",
			name: "Sarah Miller",
			avatar: "https://i.pravatar.cc/150?u=sarah",
			lastMessage: "Thanks for the help with React!",
			time: "10:33 AM",
			unreadCount: 0,
			online: true
		},
		{
			id: "2",
			name: "David Chen",
			avatar: "https://i.pravatar.cc/150?u=david",
			lastMessage: "When is the next club meeting?",
			time: "Yesterday",
			unreadCount: 2,
			online: false
		},
		{
			id: "3",
			name: "Prof. Anderson",
			avatar: "https://i.pravatar.cc/150?u=anderson",
			lastMessage: "Please review the attached PDF.",
			time: "Mon",
			online: true
		},
		{
			id: "4",
			name: "Tech Club Group",
			avatar: "https://i.pravatar.cc/150?u=tech",
			lastMessage: "Alex: Who's bringing the projector?",
			time: "Mon",
			unreadCount: 5,
		}
	];

	const activeChat = conversations.find(c => c.id === activeChatId);

	return (
		<DashboardLayout
			title="Messages"
			subtitle="Connect with peers and faculty."
			breadcrumb={["UniVerse", "Messages"]}
		>
			<Card className="flex h-[calc(100vh-12rem)] min-h-[500px] overflow-hidden border-border/50 shadow-lg bg-card/40 backdrop-blur-xl">
				{/* Left: Conversation List */}
				<div className={`${activeChatId ? 'hidden md:block' : 'w-full'} md:w-80 lg:w-96 flex-shrink-0 h-full`}>
					<ConversationList
						conversations={conversations}
						activeId={activeChatId || ""}
						onSelect={setActiveChatId}
					/>
				</div>

				{/* Right: Chat Window */}
				<div className={`flex-1 h-full flex flex-col ${!activeChatId ? 'hidden md:flex' : 'w-full'}`}>
					{activeChatId && activeChat ? (
						<>
							{/* Mobile Back Button could go here if implementing full mobile responsiveness */}
							<ChatWindow chat={activeChat} />
						</>
					) : (
						<div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
							<div className="h-16 w-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
								<MessageSquareDashed className="h-8 w-8 opacity-50" />
							</div>
							<h3 className="text-lg font-medium text-foreground">No Chat Selected</h3>
							<p className="text-sm">Choose a conversation from the sidebar to start messaging.</p>
						</div>
					)}
				</div>
			</Card>
		</DashboardLayout>
	);
};

export default Messages;
