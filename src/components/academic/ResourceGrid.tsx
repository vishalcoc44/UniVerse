
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
  uploader: { fullName: string; id: string; username?: string } | null;

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Reference Library</p>
          <h3 className="text-xl font-bold tracking-tight">
            Study <span className="text-primary">Materials</span>
          </h3>
        </div>
        <div className="flex gap-2">
          {role === 'ADMIN' && universityId && (
            <AddCourseDialog
              universityId={universityId}
              onCourseAdded={fetchResources}
            />
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
          />

          <Button
            onClick={handleUploadClick}
            disabled={isUploading || !universityId}
            className="h-10 px-6 rounded-xl bg-primary text-primary-foreground font-bold tracking-wide uppercase text-[10px] shadow-lg shadow-primary/10 gap-2 transition-all active:scale-95 group"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <UploadCloud className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
                Upload File
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase animate-pulse">Loading resources...</p>
          </div>
        ) : resources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-card/20 backdrop-blur-sm border border-dashed border-border/50 rounded-2xl opacity-40">
            <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center">
              <FileText className="h-7 w-7 text-muted-foreground/30" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold tracking-tight">No Resources found</h3>
              <p className="text-xs text-muted-foreground">Be the first to share study materials!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pr-1">
            {resources.map((resource) => (
              <div
                key={resource.id}
                className="group relative bg-card/40 backdrop-blur-xl border border-border/30 rounded-2xl p-4 hover:border-primary/30 transition-all duration-300 shadow hover:shadow-primary/5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors leading-tight">
                        {resource.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 overflow-hidden">
                        <Badge variant="outline" className="rounded-md bg-card/60 font-bold text-[8px] uppercase tracking-wider border-border/30 px-1.5 py-0 shrink-0">
                          {resource.course?.code || "GEN-01"}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-medium truncate">
                          Uploaded by {resource.uploader?.fullName || "User"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg bg-card border-border/30 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all"
                      onClick={() => window.open(resource.fileUrl, '_blank')}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 rounded-lg bg-primary/10 text-primary border border-primary/20 font-bold uppercase text-[9px] hover:bg-primary hover:text-primary-foreground gap-1.5 transition-all active:scale-95"
                      onClick={() => handleVote(resource.id)}
                    >
                      <ThumbsUp className="h-3 w-3" />
                      {resource.upvotes}
                    </Button>
                    {role === 'ADMIN' && (
                       <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg"
                        onClick={() => handleDelete(resource.id)}
                      >
                         <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
