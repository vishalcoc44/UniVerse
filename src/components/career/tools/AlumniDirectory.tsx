import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Linkedin, Briefcase, GraduationCap } from "lucide-react";

interface Alumni {
	id: string;
	name: string;
	role: string;
	company: string;
	gradYear: string;
	major: string;
	avatar: string;
	availableForMentorship: boolean;
}

const mockAlumni: Alumni[] = [
	{
		id: "1",
		name: "Sarah Chen",
		role: "Software Engineer",
		company: "Google",
		gradYear: "2022",
		major: "Computer Science",
		avatar: "https://i.pravatar.cc/150?u=sc",
		availableForMentorship: true
	},
	{
		id: "2",
		name: "Marcus Johnson",
		role: "Product Designer",
		company: "Airbnb",
		gradYear: "2021",
		major: "Design",
		avatar: "https://i.pravatar.cc/150?u=mj",
		availableForMentorship: false
	},
	{
		id: "3",
		name: "Emily Davis",
		role: "Data Scientist",
		company: "Netflix",
		gradYear: "2023",
		major: "Statistics",
		avatar: "https://i.pravatar.cc/150?u=ed",
		availableForMentorship: true
	},
	{
		id: "4",
		name: "David Kim",
		role: "Product Manager",
		company: "Microsoft",
		gradYear: "2020",
		major: "Business",
		avatar: "https://i.pravatar.cc/150?u=dk",
		availableForMentorship: true
	}
];

export function AlumniDirectory() {
	return (
		<Card className="border-border/50 bg-card/50 backdrop-blur-sm h-full flex flex-col">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<GraduationCap className="h-5 w-5 text-primary" />
					Alumni Directory
				</CardTitle>
				<CardDescription>Connect with graduates in your field.</CardDescription>
				<div className="relative pt-2">
					<Search className="absolute left-2.5 top-5 h-4 w-4 text-muted-foreground" />
					<Input placeholder="Search by company, role, or major..." className="pl-9 bg-background/50" />
				</div>
			</CardHeader>
			<CardContent className="space-y-4 overflow-y-auto max-h-[500px] pr-1">
				{mockAlumni.map((alum) => (
					<div key={alum.id} className="flex items-start justify-between p-3 rounded-xl border border-border/50 bg-background/40 hover:bg-background/60 transition-colors group">
						<div className="flex items-center gap-3">
							<Avatar className="h-10 w-10 border border-border">
								<AvatarImage src={alum.avatar} />
								<AvatarFallback>{alum.name[0]}</AvatarFallback>
							</Avatar>
							<div className="space-y-1">
								<div className="flex items-center gap-2">
									<h4 className="font-semibold text-sm leading-none">{alum.name}</h4>
									{alum.availableForMentorship && (
										<Badge variant="secondary" className="text-[10px] h-4 px-1 bg-green-500/10 text-green-600">Mentor</Badge>
									)}
								</div>
								<div className="text-xs text-muted-foreground flex flex-col gap-0.5">
									<span className="flex items-center gap-1 font-medium text-foreground/80">
										<Briefcase className="h-3 w-3" /> {alum.role} at {alum.company}
									</span>
									<span>Class of {alum.gradYear} • {alum.major}</span>
								</div>
							</div>
						</div>
						<Button size="icon" variant="ghost" className="h-8 w-8 text-[#0077b5] hover:text-[#0077b5] hover:bg-[#0077b5]/10">
							<Linkedin className="h-4 w-4" />
						</Button>
					</div>
				))}
			</CardContent>
		</Card>
	);
}
