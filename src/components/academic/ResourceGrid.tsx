
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileText, MoreVertical, Star, ThumbsUp, UploadCloud, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Resource {
  id: string;
  title: string;
  type: string;
  upvotes: number;
  uploader: { fullName: string } | null;
  course: { code: string } | null;
  fileUrl: string;
  createdAt: string;
}

import { useUserUniversity } from "@/hooks/useUserUniversity";

export function ResourceGrid() {
  const [resources, setResources] = useState<Resource[]>([]);
  // Use local loading state combined with hook loading if needed, or just rely on hook
  const { universityId, loading: uniLoading } = useUserUniversity();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (uniLoading) return; // Wait for uni ID
    if (!universityId) {
      setLoading(false);
      return;
    }

    const fetchResources = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('Resource')
        .select(`
                *,
                course:Course!inner(code, universityId),
                uploader:Profile(fullName)
            `)
        .eq('course.universityId', universityId)
        .order('createdAt', { ascending: false });

      if (error) {
        console.error('Error fetching resources:', error);
      } else {
        setResources(data as any[]);
      }
      setLoading(false);
    };

    fetchResources();
  }, [universityId, uniLoading]);

  const handleUpload = () => {
    // TODO: Implement upload modal
    alert("Upload functionality coming soon! (Valid Supabase Storage bucket required)");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">Top Resources</h3>
          <p className="text-sm text-muted-foreground">Curated notes and papers from the community.</p>
        </div>
        <Button className="gap-2" onClick={handleUpload}>
          <UploadCloud className="h-4 w-4" />
          Upload
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground bg-card/50 rounded-lg border border-border/50">
          No resources found. Be the first to upload!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map((res) => (
            <Card key={res.id} className="p-4 hover:shadow-md transition-all group bg-card/50 backdrop-blur-sm border-border/50">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                    {res.type.substring(0, 3)}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {res.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{res.uploader?.fullName || "Unknown"}</span>
                      <span>•</span>
                      {/* Mock size since not in schema */}
                      <span>2.4 MB</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 mb-4">
                {res.course && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 h-5 bg-muted/50 font-normal text-muted-foreground">
                    #{res.course.code}
                  </Badge>
                )}
                {/* <Badge className="text-[10px] px-1.5 h-5 bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20 gap-1">
                    <Star className="h-2 w-2 fill-current" /> Verified
                </Badge> */}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/40 text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    {res.upvotes}
                  </div>
                  <div className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors">
                    <Download className="h-3.5 w-3.5" />
                    120
                  </div>
                </div>

                <Button variant="ghost" size="sm" className="h-7 text-xs hover:text-primary -mr-2" asChild>
                  <a href={res.fileUrl} target="_blank" rel="noopener noreferrer">Download</a>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
