import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun, Monitor, Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useUserSettings } from "@/hooks/useUserSettings";
import { toast } from "sonner";

export function AppearanceSettings() {
	const { settings, loading, updateSettings } = useUserSettings();

	const onThemeChange = async (theme: string) => {
		const { error } = await updateSettings({ theme });
		if (error) toast.error(String(error));
	};

	const onGlassChange = async (checked: boolean) => {
		const { error } = await updateSettings({ glassmorphism: checked });
		if (error) toast.error(String(error));
	};

	if (loading) {
		return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
	}

	return (
		<Card className="border-border/50 bg-card/50 backdrop-blur-sm">
			<CardHeader>
				<CardTitle>Appearance</CardTitle>
				<CardDescription>Customize how UniVerse looks on your device.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">

				<div className="space-y-3">
					<Label>Theme</Label>
					<RadioGroup value={settings.theme} onValueChange={onThemeChange} className="grid grid-cols-3 gap-4">
						<div>
							<RadioGroupItem value="light" id="light" className="peer sr-only" />
							<Label htmlFor="light" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
								<Sun className="mb-3 h-6 w-6" />
								<span className="text-xs font-medium">Light</span>
							</Label>
						</div>
						<div>
							<RadioGroupItem value="dark" id="dark" className="peer sr-only" />
							<Label htmlFor="dark" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
								<Moon className="mb-3 h-6 w-6" />
								<span className="text-xs font-medium">Dark</span>
							</Label>
						</div>
						<div>
							<RadioGroupItem value="system" id="system" className="peer sr-only" />
							<Label htmlFor="system" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
								<Monitor className="mb-3 h-6 w-6" />
								<span className="text-xs font-medium">System</span>
							</Label>
						</div>
					</RadioGroup>
				</div>

				<div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
					<div className="space-y-0.5">
						<Label className="text-base">Glassmorphism</Label>
						<div className="text-xs text-muted-foreground">
							Enable background blur effects.
						</div>
					</div>
					<Switch checked={settings.glassmorphism} onCheckedChange={onGlassChange} />
				</div>
			</CardContent>
		</Card>
	);
}
