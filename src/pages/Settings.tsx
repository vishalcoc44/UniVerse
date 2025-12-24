import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { PrivacySettings } from "@/components/settings/PrivacySettings";
import { IntegrationsSettings } from "@/components/settings/IntegrationsSettings";
import { AccessibilitySettings } from "@/components/settings/AccessibilitySettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Lock, Palette, User, Link, Accessibility } from "lucide-react";

const Settings = () => {
	return (
		<DashboardLayout
			title="Settings"
			subtitle="Manage your account, privacy, and preferences."
			breadcrumb={["UniVerse", "Settings"]}
		>
			<div className="max-w-5xl mx-auto pb-10">
				<Tabs defaultValue="profile" className="space-y-8">
					<div className="overflow-x-auto pb-2 -mx-4 px-4 md:px-0 md:pb-0">
						<TabsList className="h-auto w-full justify-start gap-2 bg-transparent p-0 md:justify-center flex-wrap">
							<TabsTrigger
								value="profile"
								className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 rounded-full px-4 py-2"
							>
								<User className="h-4 w-4 mr-2" />
								Profile
							</TabsTrigger>
							<TabsTrigger
								value="appearance"
								className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 rounded-full px-4 py-2"
							>
								<Palette className="h-4 w-4 mr-2" />
								Appearance
							</TabsTrigger>
							<TabsTrigger
								value="privacy"
								className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 rounded-full px-4 py-2"
							>
								<Lock className="h-4 w-4 mr-2" />
								Privacy
							</TabsTrigger>
							<TabsTrigger
								value="notifications"
								className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 rounded-full px-4 py-2"
							>
								<Bell className="h-4 w-4 mr-2" />
								Notifications
							</TabsTrigger>
							<TabsTrigger
								value="integrations"
								className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 rounded-full px-4 py-2"
							>
								<Link className="h-4 w-4 mr-2" />
								Integrations
							</TabsTrigger>
							<TabsTrigger
								value="accessibility"
								className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 rounded-full px-4 py-2"
							>
								<Accessibility className="h-4 w-4 mr-2" />
								Accessibility
							</TabsTrigger>
						</TabsList>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
						<TabsContent value="profile" className="animate-in fade-in-50 duration-500 m-0">
							<ProfileSettings />
						</TabsContent>

						<TabsContent value="appearance" className="animate-in fade-in-50 duration-500 m-0">
							<AppearanceSettings />
						</TabsContent>

						<TabsContent value="privacy" className="animate-in fade-in-50 duration-500 m-0">
							<PrivacySettings />
						</TabsContent>

						<TabsContent value="notifications" className="animate-in fade-in-50 duration-500 m-0">
							<NotificationSettings />
						</TabsContent>

						<TabsContent value="integrations" className="animate-in fade-in-50 duration-500 m-0">
							<IntegrationsSettings />
						</TabsContent>

						<TabsContent value="accessibility" className="animate-in fade-in-50 duration-500 m-0">
							<AccessibilitySettings />
						</TabsContent>
					</div>
				</Tabs>
			</div>
		</DashboardLayout>
	);
};

export default Settings;
