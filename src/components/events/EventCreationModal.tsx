
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
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function EventCreationModal({
  onEventCreated,
  eventToEdit,
  isOpen,
  onOpenChange
}: {
  onEventCreated?: () => void;
  eventToEdit?: any;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);

  // Use external control if provided, otherwise internal state
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    category: "",
    description: ""
  });

  // Pre-fill data when eventToEdit changes
  useEffect(() => {
    if (eventToEdit) {
      // Parse date and time from ISO string or similar
      const d = new Date(eventToEdit.date);
      const dateStr = d.toISOString().split('T')[0];
      const timeStr = d.toTimeString().slice(0, 5); // HH:MM


      // Extract category from description if type is missing (raw data case)
      let category = eventToEdit.type;
      if (!category && eventToEdit.description) {
        const match = eventToEdit.description.match(/\[Category: (.*?)\]/);
        category = match ? match[1] : "General";
      }

      setFormData({
        title: eventToEdit.title,
        date: dateStr,
        time: timeStr,
        location: eventToEdit.location || "",
        category: (!category || category === "General") ? "" : category.toLowerCase(),
        description: eventToEdit.description ? eventToEdit.description.replace(/ \[Category: .*?\]/, "") : "" // Clean description for editing
      });
    } else {
      // Reset form if opening in create mode
      // Only reset if completely closed or explicit new
    }
  }, [eventToEdit, open]);

  // Reset form when closed
  useEffect(() => {
    if (!open && !eventToEdit) {
      setFormData({ title: "", date: "", time: "", location: "", category: "", description: "" });
      setImageFile(null);
    }
  }, [open, eventToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
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

      // Upload Image if exists
      let imageUrl = eventToEdit?.imageUrl || null; // Keep existing image if not replacing
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        // Use timestamp to ensure unique URL and prevent browser caching stale images
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `event-covers/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('post-images') // Reusing existing bucket for now
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('post-images')
          .getPublicUrl(filePath);

        imageUrl = publicUrlData.publicUrl;
      }

      // Fetch user's universityId
      const { data: profile } = await supabase
        .from('Profile')
        .select('universityId')
        .eq('id', user.id)
        .single();

      const payload = {
        title: formData.title,
        description: formData.description + (formData.category ? ` [Category: ${formData.category}]` : ""),
        date: eventDate.toISOString(),
        location: formData.location,
        imageUrl: imageUrl,
        scope: 'CAMPUS',
        universityId: profile?.universityId,
        organizerId: user.id
      };

      if (eventToEdit) {
        // Update existing
        const { data, error } = await supabase.from('Event').update(payload).eq('id', eventToEdit.id).select();

        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error("Update failed: No rows modified. Check RLS policies for UPDATE.");
        }
      } else {
        // Create new
        const { error } = await supabase.from('Event').insert({
          id: crypto.randomUUID(),
          ...payload
        });
        if (error) throw error;
      }

      setOpen(false);
      if (onEventCreated) onEventCreated();

      // Clear image file selection to ensure next edit doesn't reuse it
      setImageFile(null);
      if (!eventToEdit) {
        setFormData({ title: "", date: "", time: "", location: "", category: "", description: "" });
      }
    } catch (error: any) {
      console.error("Error saving event:", error);
      alert(`Failed to save event: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isOpen && (
        <DialogTrigger asChild>
          <Button className="bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            Create Event
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle>{eventToEdit ? "Edit Event" : "Host an Event"}</DialogTitle>
          <DialogDescription>
            {eventToEdit ? "Update the details of your event." : "Organize a workshop, club meeting, or social gathering."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 overflow-y-auto pr-2 flex-1">

          <div className="grid gap-2">
            <Label htmlFor="image">Event Cover Image</Label>
            <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="bg-background/50" />
            {eventToEdit?.imageUrl && !imageFile && (
              <p className="text-xs text-muted-foreground">Current image will be kept unless you upload a new one.</p>
            )}
          </div>

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
        <DialogFooter className="mt-auto pt-2 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {eventToEdit ? "Update Event" : "Publish Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
