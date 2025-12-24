import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface PagePlaceholderProps {
	title: string;
	subtitle: string;
	icon?: LucideIcon;
	features?: string[];
}

export function PagePlaceholder({ title, subtitle, features = [] }: PagePlaceholderProps) {
	return (
		<DashboardLayout
			title={title}
			subtitle={subtitle}
			breadcrumb={["UniVerse", title]}
		>
			<div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-fade-in">
				<div className="space-y-4 max-w-2xl text-center">
					<h2 className="text-2xl font-semibold tracking-tight">Coming Soon</h2>
					<p className="text-muted-foreground">
						We are actively building the <span className="font-semibold text-primary">{title}</span> module.
						This feature will include:
					</p>
				</div>

				{features.length > 0 && (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl text-left">
						{features.map((feature, i) => (
							<div key={i} className="p-4 rounded-xl border bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
								<div className="flex items-center gap-3">
									<div className="h-2 w-2 rounded-full bg-primary" />
									<span className="font-medium">{feature}</span>
								</div>
							</div>
						))}
					</div>
				)}

				<div className="pt-8">
					<Button variant="outline" onClick={() => window.history.back()}>
						Go Back
					</Button>
				</div>
			</div>
		</DashboardLayout>
	);
}
