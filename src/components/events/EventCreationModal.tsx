
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, MapPin, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function EventCreationModal({ onEventCreated }: { onEventCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    category: "",
    description: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSelectChange = (value: string) => {
    setFormData({ ...formData, category: value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please login to create an event");

      // Combine date and time
      const dateTimeString = `${formData.date}T${formData.time}`;
      const eventDate = new Date(dateTimeString);

      if (isNaN(eventDate.getTime())) {
        throw new Error("Invalid Date");
      }

      // Fetch user's universityId
      const { data: profile } = await supabase
        .from('Profile')
        .select('universityId')
        .eq('id', user.id)
        .single();

      const { error } = await supabase.from('Event').insert({
        title: formData.title,
        description: formData.description + (formData.category ? ` [Category: ${formData.category}]` : ""), // Hacky category storage
        date: eventDate.toISOString(),
        location: formData.location,
        scope: 'CAMPUS',
        universityId: profile?.universityId,
        organizerId: user.id
      });

      if (error) throw error;

      setOpen(false);
      if (onEventCreated) onEventCreated();
      setFormData({ title: "", date: "", time: "", location: "", category: "", description: "" });
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event. Make sure you are logged in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          Create Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle>Host an Event</DialogTitle>
          <DialogDescription>
            Organize a workshop, club meeting, or social gathering.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">

          <div className="grid gap-2">
            <Label htmlFor="title">Event Title</Label>
            <Input id="title" value={formData.title} onChange={handleChange} placeholder="e.g. AI & Ethics Workshop" className="bg-background/50" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Date</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="date" value={formData.date} onChange={handleChange} className="pl-9 bg-background/50" type="date" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Time</Label>
              <Input id="time" value={formData.time} onChange={handleChange} className="bg-background/50" type="time" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input id="location" value={formData.location} onChange={handleChange} placeholder="e.g. Student Center, Room 302" className="pl-9 bg-background/50" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select onValueChange={handleSelectChange} value={formData.category}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="club">Club Meeting</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description} onChange={handleChange} placeholder="What's this event about?" className="bg-background/50 resize-none" rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Publish Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
