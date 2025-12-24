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
import { CalendarIcon, MapPin, Upload } from "lucide-react";

export function EventCreationModal() {
  return (
    <Dialog>
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
            <Input id="title" placeholder="e.g. AI & Ethics Workshop" className="bg-background/50" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Date</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9 bg-background/50" type="date" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Time</Label>
              <Input className="bg-background/50" type="time" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input id="location" placeholder="e.g. Student Center, Room 302" className="pl-9 bg-background/50" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select>
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
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" placeholder="What's this event about?" className="bg-background/50 resize-none" rows={3} />
          </div>

          <div className="border-2 border-dashed border-border/50 rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:bg-muted/10 transition-colors cursor-pointer">
            <div className="h-10 w-10 text-muted-foreground bg-muted/20 rounded-full flex items-center justify-center">
              <Upload className="h-5 w-5" />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              <span className="font-medium text-foreground">Click to upload</span> banner image
            </p>
          </div>

        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button type="submit">Publish Event</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
