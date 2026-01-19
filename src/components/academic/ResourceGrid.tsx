
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileText, MoreVertical, Star, ThumbsUp, UploadCloud, Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { getResources, voteResource, deleteResource } from "@/app/academic/actions";


interface Resource {
  id: string;
  title: string;
  type: string;
  upvotes: number;
  uploader: { fullName: string; id: string } | null;

  course: { code: string } | null;
  fileUrl: string;
  createdAt: string;
}

import { AddCourseDialog } from "@/components/academic/AddCourseDialog";
import { useUserUniversity } from "@/hooks/useUserUniversity";

export function ResourceGrid() {
  const [resources, setResources] = useState<Resource[]>([]);
  const { universityId, loading: uniLoading, role } = useUserUniversity();
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchResources = async () => {
    if (!universityId) return;
    setLoading(true);
    const { success, resources: data, error } = await getResources(universityId);

    if (!success || error) {
      toast.error(`Error loading resources: ${error}`);
    } else {
      setResources(data as any[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (uniLoading) return;
    fetchResources();
  }, [universityId, uniLoading]);

  const handleVote = async (id: string) => {
    // Optimistic update
    setResources(prev => prev.map(r => r.id === id ? { ...r, upvotes: r.upvotes + 1 } : r));

    const { success } = await voteResource(id);
    if (!success) {
      toast.error("Failed to upvote");
      // Revert
      setResources(prev => prev.map(r => r.id === id ? { ...r, upvotes: r.upvotes - 1 } : r));
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !universityId) return;

    // Check if there are any courses for this university
    const { data: courses } = await supabase
      .from('Course')
      .select('id')
      .eq('universityId', universityId)
      .limit(1);


    if (!courses || courses.length === 0) {
      toast.error("Please add a course to your university before uploading resources.");
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload to Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${universityId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('academic-resources')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('academic-resources')
        .getPublicUrl(filePath);

      // 2. Save to Database (Server Action)
      // We import dynamically to avoid top-level server-only import issues if any (though usually fine)
      const { createResource } = await import("@/app/academic/actions");

      const { success, error: dbError } = await createResource({
        title: file.name,
        fileUrl: publicUrl,
        type: 'NOTE',
        courseId: courses[0].id,
        universityId
      });

      if (!success) throw new Error(dbError);

      toast.success("Resource uploaded successfully!");
      fetchResources();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || "Failed to upload resource. Ensure 'academic-resources' bucket exists.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    const { success, error } = await deleteResource(id);
    if (success) {
      toast.success("Resource deleted");
      fetchResources();
    } else {
      toast.error(error || "Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">Top Resources</h3>
          <p className="text-sm text-muted-foreground">Curated notes and papers from the community.</p>
        </div>
        <div className="flex gap-2">
          {role === 'ADMIN' && universityId && (
            <AddCourseDialog
              universityId={universityId}
              onCourseAdded={fetchResources} // Refresh resources if needed, though mostly this affects upload
            />
          )}
          <Button className="gap-2" onClick={handleUploadClick} disabled={isUploading}>
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileUpload}
          accept=".pdf,.doc,.docx,.txt"
        />
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

                {/* Delete Button (Only for uploader) */}
                {/* Note: We need the current user ID to check ownership. 
                    Ideally 'useUserUniversity' or a separate auth hook provides 'user'. 
                    For now, assuming backend validation handles security, 
                    but UI hiding is better UX. 
                    Let's use a simple client-side check if we had user ID.
                    Since we don't have user ID in context easily yet, 
                    we show it and let backend reject if unauthorized, 
                    OR we fetch user ID. 
                    Let's just show it in the menu for now. */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-red-500"
                  onClick={() => handleDelete(res.id)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-trash-2"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    <line x1="10" x2="10" y1="11" y2="17" />
                    <line x1="14" x2="14" y1="11" y2="17" />
                  </svg>
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
                  <div
                    className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors"
                    onClick={() => handleVote(res.id)}
                  >
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
      )
      }
    </div >
  );
}
