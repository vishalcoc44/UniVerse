'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	User,
	AtSign,
	Camera,
	FileText,
	GraduationCap,
	Phone,
	Linkedin,
	Github,
	CheckCircle2,
	Circle,
	ArrowRight,
	Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ProfileField {
	key: string;
	label: string;
	icon: React.ElementType;
	filled: boolean;
}

export function ProfileCompleteness() {
	const [fields, setFields] = useState<ProfileField[]>([]);
	const [percentage, setPercentage] = useState(0);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		const fetchProfileData = async () => {
			try {
				const { data: { user } } = await supabase.auth.getUser();
				if (!user) return;

				// Fetch profile data
				const { data: profile } = await supabase
					.from('Profile')
					.select('fullName, username, avatarUrl, bio, department')
					.eq('id', user.id)
					.single();

				// Fetch settings data
				const { data: settings } = await supabase
					.from('UserSettings')
					.select('phone, linkedin, github')
					.eq('userId', user.id)
					.maybeSingle();

				const profileFields: ProfileField[] = [
					{
						key: "fullName",
						label: "Full Name",
						icon: User,
						filled: !!profile?.fullName?.trim(),
					},
					{
						key: "username",
						label: "Username",
						icon: AtSign,
						filled: !!profile?.username?.trim(),
					},
					{
						key: "avatarUrl",
						label: "Profile Photo",
						icon: Camera,
						filled: !!profile?.avatarUrl?.trim(),
					},
					{
						key: "bio",
						label: "Bio",
						icon: FileText,
						filled: !!profile?.bio?.trim(),
					},
					{
						key: "department",
						label: "Major / Department",
						icon: GraduationCap,
						filled: !!profile?.department?.trim(),
					},
					{
						key: "phone",
						label: "Phone Number",
						icon: Phone,
						filled: !!settings?.phone?.trim(),
					},
					{
						key: "linkedin",
						label: "LinkedIn",
						icon: Linkedin,
						filled: !!settings?.linkedin?.trim(),
					},
					{
						key: "github",
						label: "GitHub / Portfolio",
						icon: Github,
						filled: !!settings?.github?.trim(),
					},
				];

				setFields(profileFields);
				const filledCount = profileFields.filter((f) => f.filled).length;
				setPercentage(Math.round((filledCount / profileFields.length) * 100));
			} catch (error) {
				console.error("Error fetching profile completeness:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchProfileData();
	}, []);

	if (loading) {
		return (
			<section className="bg-card rounded-xl border border-border p-4 shadow-card animate-pulse">
				<div className="h-4 w-32 bg-muted rounded mb-4" />
				<div className="flex justify-center mb-4">
					<div className="h-24 w-24 rounded-full bg-muted" />
				</div>
				<div className="space-y-2">
					<div className="h-3 bg-muted rounded w-full" />
					<div className="h-3 bg-muted rounded w-3/4" />
				</div>
			</section>
		);
	}

	const isComplete = percentage === 100;
	const missingFields = fields.filter((f) => !f.filled);

	// Calculate SVG arc values
	const radius = 42;
	const circumference = 2 * Math.PI * radius;
	const strokeDashoffset = circumference - (percentage / 100) * circumference;

	// Dynamic colors based on completion
	const getProgressColor = () => {
		if (percentage >= 100) return { stroke: "#10b981", text: "text-emerald-500", bg: "from-emerald-500/10 to-emerald-500/5", border: "border-emerald-200/50 dark:border-emerald-900/50" };
		if (percentage >= 60) return { stroke: "#3b82f6", text: "text-blue-500", bg: "from-blue-500/10 to-blue-500/5", border: "border-blue-200/50 dark:border-blue-900/50" };
		if (percentage >= 30) return { stroke: "#f59e0b", text: "text-amber-500", bg: "from-amber-500/10 to-amber-500/5", border: "border-amber-200/50 dark:border-amber-900/50" };
		return { stroke: "#ef4444", text: "text-red-500", bg: "from-red-500/10 to-red-500/5", border: "border-red-200/50 dark:border-red-900/50" };
	};

	const colors = getProgressColor();

	return (
		<section className={cn(
			"relative overflow-hidden rounded-xl border p-4 shadow-card bg-gradient-to-br",
			colors.bg,
			colors.border
		)}>
			{/* Decorative sparkle for 100% */}
			{isComplete && (
				<div className="absolute top-3 right-3">
					<Sparkles className="h-5 w-5 text-emerald-500 animate-pulse" />
				</div>
			)}

			<div className="flex items-center justify-between mb-3">
				<h2 className="font-semibold text-foreground text-sm">Profile Strength</h2>
				<span className={cn("text-xs font-bold", colors.text)}>
					{percentage}%
				</span>
			</div>

			{/* Progress Ring */}
			<div className="flex justify-center mb-4">
				<div className="relative">
					<svg width="100" height="100" className="-rotate-90">
						{/* Background circle */}
						<circle
							cx="50"
							cy="50"
							r={radius}
							fill="none"
							stroke="currentColor"
							strokeWidth="6"
							className="text-muted/30"
						/>
						{/* Progress circle */}
						<circle
							cx="50"
							cy="50"
							r={radius}
							fill="none"
							stroke={colors.stroke}
							strokeWidth="6"
							strokeLinecap="round"
							strokeDasharray={circumference}
							strokeDashoffset={strokeDashoffset}
							className="transition-all duration-1000 ease-out"
						/>
					</svg>
					{/* Center text */}
					<div className="absolute inset-0 flex flex-col items-center justify-center">
						{isComplete ? (
							<CheckCircle2 className="h-6 w-6 text-emerald-500" />
						) : (
							<>
								<span className={cn("text-2xl font-bold leading-none", colors.text)}>
									{fields.filter(f => f.filled).length}
								</span>
								<span className="text-[10px] text-muted-foreground font-medium">
									of {fields.length}
								</span>
							</>
						)}
					</div>
				</div>
			</div>

			{/* Status message */}
			<p className="text-xs text-center text-muted-foreground mb-3">
				{isComplete
					? "Your profile is complete! 🎉"
					: `Complete ${missingFields.length} more field${missingFields.length > 1 ? 's' : ''} to stand out`
				}
			</p>

			{/* Missing fields list */}
			{!isComplete && (
				<div className="space-y-1.5 mb-3">
					{missingFields.slice(0, 3).map((field) => {
						const Icon = field.icon;
						return (
							<div
								key={field.key}
								className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
								onClick={() => router.push('/settings')}
							>
								<Circle className="h-3 w-3 opacity-40 group-hover:opacity-70 transition-opacity" />
								<Icon className="h-3 w-3 opacity-60" />
								<span className="flex-1">{field.label}</span>
								<ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
							</div>
						);
					})}
					{missingFields.length > 3 && (
						<p className="text-[10px] text-muted-foreground/60 pl-5">
							+{missingFields.length - 3} more
						</p>
					)}
				</div>
			)}

			{/* CTA Button */}
			{!isComplete && (
				<Button
					variant="outline"
					size="sm"
					className="w-full text-xs h-8"
					onClick={() => router.push('/settings')}
				>
					Complete Profile
				</Button>
			)}
		</section>
	);
}
