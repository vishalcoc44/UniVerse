
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, Smile, Video, Globe, MapPin, Send, Tag } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SharePostBox({ onPostCreated }: { onPostCreated?: () => void }) {
  const [content, setContent] = useState("");
  const [feedType, setFeedType] = useState("campus");
  const [category, setCategory] = useState("General");
  const [isPosting, setIsPosting] = useState(false);

  const categories = [
    "Academic",
    "Events",
    "Social",
    "Marketplace",
    "Career",
    "General"
  ];

  const handlePost = async () => {
    if (!content.trim()) return;

    setIsPosting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.error("User not logged in");
        return;
      }

      const { data: profile } = await supabase
        .from('Profile')
        .select('universityId')
        .eq('id', user.id)
        .single();

      const { error } = await supabase.from('Post').insert({
        content,
        scope: feedType === 'campus' ? 'CAMPUS' : 'UNIVERSE',
        universityId: feedType === 'campus' ? profile?.universityId : null,
        authorId: user.id,
        type: 'TEXT',
        category: category
      });

      if (error) throw error;

      setContent("");
      setCategory("General");
      if (onPostCreated) onPostCreated();

    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Card className="p-4 mb-6 shadow-card border-none bg-card/50 backdrop-blur-sm">
      <div className="flex gap-4">
        <Avatar className="h-10 w-10 border-2 border-background">
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-4">
          <div className="relative">
            <textarea
              placeholder="What's happening on campus?"
              className="w-full bg-transparent border-none resize-none focus:ring-0 text-base placeholder:text-muted-foreground/60 min-h-[60px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <div className="flex gap-1 items-center">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-pastel-sky-dark hover:bg-pastel-sky/20">
                <Image className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-pastel-rose-dark hover:bg-pastel-rose/20">
                <Video className="h-4 w-4" />
              </Button>

              <div className="h-4 w-[1px] bg-border/50 mx-1" />

              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-8 w-[130px] bg-transparent border-none focus:ring-0 text-xs text-muted-foreground hover:bg-muted/50 transition-colors">
                  <Tag className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-muted/50 rounded-full p-1 h-8 items-center">
                <button
                  onClick={() => setFeedType("campus")}
                  className={`text-xs font-medium px-3 py-1 rounded-full transition-all ${feedType === 'campus' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Campus
                </button>
                <button
                  onClick={() => setFeedType("universe")}
                  className={`text-xs font-medium px-3 py-1 rounded-full transition-all ${feedType === 'universe' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Universe
                </button>
              </div>

              <Button
                size="sm"
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-4"
                disabled={!content.trim() || isPosting}
                onClick={handlePost}
              >
                {isPosting ? 'Posting...' : 'Post'} <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
