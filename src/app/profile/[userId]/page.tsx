'use client';

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FriendshipButton } from "@/components/feed/FriendshipButton";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  MessageSquare,
  GraduationCap,
  Building2,
  Users,
  FlaskConical,
  Star,
  Calendar,
  Loader2,
  Heart,
  BookOpen,
} from "lucide-react";

interface ProfileData {
  id: string;
  fullName: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  department: string | null;
  yearOfStudy: number | null;
  reputationPoints: number;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  University: { name: string; abbreviation: string } | null;
}

const LinkedInIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/>
  </svg>
);

interface PostData {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  likes: { count: number }[];
  comments: { count: number }[];
}

interface ClubData {
  id: string;
  role: string;
  Club: { id: string; name: string; logoUrl: string | null; description: string | null };
}

interface ResearchData {
  id: string;
  role: string;
  ResearchProject: { id: string; title: string; abstract: string | null; status: string };
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

export default function PublicProfile() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [clubs, setClubs] = useState<ClubData[]>([]);
  const [research, setResearch] = useState<ResearchData[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const [profileRes, postsRes, clubsRes, researchRes] = await Promise.all([
        supabase
          .from('Profile')
          .select('id, fullName, username, bio, avatarUrl, department, yearOfStudy, reputationPoints, linkedinUrl, portfolioUrl, University(name, abbreviation)')
          .eq('id', userId)
          .single(),
        supabase
          .from('Post')
          .select('id, content, imageUrl, createdAt, likes:Like(count), comments:Comment(count)')
          .eq('authorId', userId)
          .order('createdAt', { ascending: false })
          .limit(5),
        supabase
          .from('ClubMember')
          .select('id, role, Club(id, name, logoUrl, description)')
          .eq('userId', userId),
        supabase
          .from('ProjectCollaborator')
          .select('id, role, ResearchProject(id, title, abstract, status)')
          .eq('userId', userId),
      ]);

      if (profileRes.data) setProfile(profileRes.data as unknown as ProfileData);
      if (postsRes.data) setPosts(postsRes.data as unknown as PostData[]);
      if (clubsRes.data) setClubs(clubsRes.data as unknown as ClubData[]);
      if (researchRes.data) setResearch(researchRes.data as unknown as ResearchData[]);

      setLoading(false);
    };

    load();
  }, [userId]);

  if (loading) {
    return (
      <DashboardLayout title="Profile">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout title="Profile">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <p className="text-muted-foreground">User not found.</p>
          <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
        </div>
      </DashboardLayout>
    );
  }

  const uni = Array.isArray(profile.University) ? profile.University[0] : profile.University;
  const initials = profile.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || '?';
  const isOwnProfile = currentUserId === profile.id;

  return (
    <DashboardLayout
      icon={GraduationCap}
      title={`${profile.fullName}'s Profile`}
      subtitle={uni?.name || undefined}
      breadcrumb={["UniVerse", "Profile"]}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Hero Card */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="h-28 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
            <CardContent className="relative pb-6 px-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-14">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                  <AvatarImage src={profile.avatarUrl || undefined} />
                  <AvatarFallback className="text-2xl font-bold bg-primary/20 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 pt-2">
                  <h1 className="text-2xl font-bold tracking-tight">{profile.fullName}</h1>
                  {profile.username && (
                    <p className="text-sm text-muted-foreground">@{profile.username}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {uni && (
                      <Badge variant="secondary" className="gap-1">
                        <Building2 className="h-3 w-3" />
                        {uni.abbreviation || uni.name}
                      </Badge>
                    )}
                    {profile.department && (
                      <Badge variant="outline" className="gap-1">
                        <BookOpen className="h-3 w-3" />
                        {profile.department}
                      </Badge>
                    )}
                    {profile.yearOfStudy && (
                      <Badge variant="outline" className="gap-1">
                        <Calendar className="h-3 w-3" />
                        Year {profile.yearOfStudy}
                      </Badge>
                    )}
                    <Badge className="gap-1 bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20">
                      <Star className="h-3 w-3" />
                      {profile.reputationPoints} pts
                    </Badge>
                  </div>
                </div>

                {!isOwnProfile && currentUserId && (
                  <div className="flex items-center gap-2 shrink-0">
                    <FriendshipButton
                      targetUserId={profile.id}
                      currentUserId={currentUserId}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push('/messages')}
                      className="gap-1.5"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Message
                    </Button>
                  </div>
                )}
              </div>

              {profile.bio && (
                <>
                  <Separator className="my-4" />
                  <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
                </>
              )}

              {(profile.linkedinUrl || profile.portfolioUrl) && (
                <>
                  {!profile.bio && <Separator className="my-4" />}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {profile.linkedinUrl && (
                      <a
                        href={profile.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/15 text-xs font-semibold transition-colors"
                      >
                        <LinkedInIcon className="h-3.5 w-3.5" />
                        LinkedIn
                      </a>
                    )}
                    {profile.portfolioUrl && (
                      <a
                        href={profile.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted hover:bg-muted/70 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        Portfolio
                      </a>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Posts */}
          <motion.div
            className="lg:col-span-2"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Heart className="h-4 w-4 text-rose-500" />
                  Recent Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {posts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No posts yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        className="p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <p className="text-sm line-clamp-3">{post.content}</p>
                        {post.imageUrl && (
                          <img
                            src={post.imageUrl}
                            alt=""
                            className="mt-2 rounded-lg max-h-40 object-cover w-full"
                          />
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                          </span>
                          <span>{post.likes?.[0]?.count || 0} likes</span>
                          <span>{post.comments?.[0]?.count || 0} comments</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar: Clubs + Research */}
          <div className="space-y-6">
            {/* Clubs */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}>
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4 text-blue-500" />
                    Clubs & Societies
                    {clubs.length > 0 && (
                      <Badge variant="secondary" className="ml-auto text-[10px]">
                        {clubs.length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {clubs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Not in any clubs yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {clubs.map((cm) => {
                        const club = Array.isArray(cm.Club) ? cm.Club[0] : cm.Club;
                        if (!club) return null;
                        return (
                          <div
                            key={cm.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer"
                            onClick={() => router.push('/clubs')}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={club.logoUrl || undefined} />
                              <AvatarFallback className="text-xs bg-blue-500/10 text-blue-600">
                                {club.name?.[0] || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{club.name}</p>
                              <p className="text-[10px] text-muted-foreground capitalize">
                                {cm.role?.toLowerCase()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Research */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}>
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FlaskConical className="h-4 w-4 text-emerald-500" />
                    Research Projects
                    {research.length > 0 && (
                      <Badge variant="secondary" className="ml-auto text-[10px]">
                        {research.length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {research.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No research projects.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {research.map((rc) => {
                        const project = Array.isArray(rc.ResearchProject)
                          ? rc.ResearchProject[0]
                          : rc.ResearchProject;
                        if (!project) return null;
                        return (
                          <div
                            key={rc.id}
                            className="p-2.5 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer"
                            onClick={() => router.push('/research')}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium truncate">{project.title}</p>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] shrink-0",
                                  project.status === 'ACTIVE' && "border-emerald-500/50 text-emerald-600",
                                  project.status === 'COMPLETED' && "border-blue-500/50 text-blue-600"
                                )}
                              >
                                {project.status?.toLowerCase()}
                              </Badge>
                            </div>
                            {project.abstract && (
                              <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                                {project.abstract}
                              </p>
                            )}
                            <p className="text-[10px] text-muted-foreground capitalize mt-1">
                              Role: {rc.role?.toLowerCase()}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
