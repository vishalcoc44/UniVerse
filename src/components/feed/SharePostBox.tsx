import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, Smile, Video, Globe, MapPin, Send } from "lucide-react";
import { useState } from "react";

export function SharePostBox() {
  const [content, setContent] = useState("");
  const [feedType, setFeedType] = useState("campus");

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
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-pastel-sky-dark hover:bg-pastel-sky/20">
                <Image className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-pastel-rose-dark hover:bg-pastel-rose/20">
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-pastel-amber-dark hover:bg-pastel-amber/20">
                <Smile className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-pastel-mint-dark hover:bg-pastel-mint/20">
                <MapPin className="h-4 w-4" />
              </Button>
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
                disabled={!content.trim()}
              >
                Post <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
