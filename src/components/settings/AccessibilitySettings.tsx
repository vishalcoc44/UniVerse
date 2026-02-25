import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RefreshCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserSettings } from "@/hooks/useUserSettings";
import { toast } from "sonner";

export function AccessibilitySettings() {
	const { settings, loading, updateSettings, resetAccessibility } = useUserSettings();

	const onToggle = async (key: keyof typeof settings, value: boolean) => {
		const { error } = await updateSettings({ [key]: value });
		if (error) toast.error(String(error));
	};

	const onFontScaleChange = async (value: number[]) => {
		const [fontScale] = value;
		const { error } = await updateSettings({ fontScale });
		if (error) toast.error(String(error));
	};

	const onReset = async () => {
		const { error } = await resetAccessibility();
		if (error) {
			toast.error(String(error));
		} else {
			toast.success("Accessibility preferences reset.");
		}
	};

	if (loading) {
		return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
	}

	return (
		<Card className="border-border/50 bg-card/50 backdrop-blur-sm">
			<CardHeader>
				<CardTitle>Accessibility</CardTitle>
				<CardDescription>Customize the interface to suit your needs.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-8">

				{/* Visuals */}
				<div className="space-y-4">
					<h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Visual Adjustments</h4>

					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<Label htmlFor="font-size">Font Size Scaling</Label>
							<span className="text-xs text-muted-foreground">{settings.fontScale}%</span>
						</div>
						<Slider value={[settings.fontScale]} onValueChange={onFontScaleChange} max={150} min={75} step={25} className="w-[60%]" />
					</div>

					<div className="flex items-center justify-between space-x-2 pt-2">
						<div className="space-y-0.5">
							<Label htmlFor="contrast">High Contrast Mode</Label>
							<p className="text-xs text-muted-foreground">Increase contrast for better legibility</p>
						</div>
						<Switch id="contrast" checked={settings.highContrast} onCheckedChange={(v) => onToggle("highContrast", v)} />
					</div>

					<div className="flex items-center justify-between space-x-2">
						<div className="space-y-0.5">
							<Label htmlFor="motion">Reduce Motion</Label>
							<p className="text-xs text-muted-foreground">Minimize animations and transitions</p>
						</div>
						<Switch id="motion" checked={settings.reduceMotion} onCheckedChange={(v) => onToggle("reduceMotion", v)} />
					</div>
				</div>

				{/* Cognitive & Screen Readers */}
				<div className="space-y-4">
					<h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Assistive Technology</h4>

					<div className="flex items-center justify-between space-x-2">
						<div className="space-y-0.5">
							<Label htmlFor="screen-reader">Screen Reader Optimization</Label>
							<p className="text-xs text-muted-foreground">Add extra ARIA labels and simplified structure</p>
						</div>
						<Switch id="screen-reader" checked={settings.screenReader} onCheckedChange={(v) => onToggle("screenReader", v)} />
					</div>

					<div className="flex items-center justify-between space-x-2">
						<div className="space-y-0.5">
							<Label htmlFor="dyslexic">OpenDyslexic Font</Label>
							<p className="text-xs text-muted-foreground">Use a font designed for easier reading</p>
						</div>
						<Switch id="dyslexic" checked={settings.dyslexicFont} onCheckedChange={(v) => onToggle("dyslexicFont", v)} />
					</div>
				</div>

				<div className="bg-primary/5 p-4 rounded-lg flex items-center justify-between">
					<span className="text-sm text-muted-foreground">Need to reset all accessibility settings?</span>
					<Button variant="ghost" size="sm" className="gap-2" onClick={onReset}>
						<RefreshCcw className="h-3 w-3" /> Reset
					</Button>
				</div>

			</CardContent>
		</Card>
	);
}
