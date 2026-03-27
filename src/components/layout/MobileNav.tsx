'use client';

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Users,
  Building2,
  MessageSquare,
  Briefcase,
  Heart,
  Car,
  FlaskConical,
  MessageCircle,
  Newspaper,
  Sparkles,
  ShoppingBag,
  Map,
  Settings,
  Sun,
  Moon,
  ShieldCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { supabase } from "@/lib/supabase";
import { useTheme } from "next-themes";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
}

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeItem?: string;
  onNavigate?: (href: string) => void;
}

export function MobileNav({ open, onOpenChange, activeItem, onNavigate }: MobileNavProps) {
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<{ fullName: string; username: string; universityAbbr: string; avatarUrl: string; role: string; universityId: string | null } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  useEffect(() => { setMounted(true); }, []);

  const mainMenuItems: NavItem[] = [
    { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
    { icon: BookOpen, label: "Academic AI", href: "/academic" },
    { icon: Calendar, label: "Events", href: "/events" },
    { icon: Users, label: "Campus Feed", href: "/feed" },
    { icon: MessageSquare, label: "Messages", href: "/messages", badge: unreadCount > 0 ? unreadCount : undefined },
    { icon: Briefcase, label: "Career Hub", href: "/career" },
    { icon: Heart, label: "Wellness", href: "/wellness" },
    { icon: Map, label: "Utilities", href: "/utilities" },
  ];

  const collaborationItems: NavItem[] = [
    { icon: Building2, label: "Departments", href: "/departments" },
    { icon: Car, label: "Cab Pooling", href: "/travel" },
    { icon: FlaskConical, label: "Research Hub", href: "/research" },
    { icon: MessageCircle, label: "Anonymous Forums", href: "/forums" },
    { icon: Users, label: "Clubs & Societies", href: "/clubs" },
  ];

  const settingsItems: NavItem[] = [
    { icon: Newspaper, label: "Campus News", href: "/news" },
    { icon: ShoppingBag, label: "Marketplace", href: "/marketplace" },
    { icon: Sparkles, label: "What's New", href: "/updates" },
    ...(profile?.role === "ADMIN" && !profile?.universityId
      ? [
          { icon: ShieldCheck, label: "Admin Panel", href: "/admin" },
          { icon: ShieldCheck, label: "Platform Admins", href: "/admin/platform-admins" },
        ]
      : []),
    ...(profile?.role === "ADMIN" && !!profile?.universityId
      ? [{ icon: ShieldCheck, label: "University Admins", href: "/settings/university-admins" }]
      : []),
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: participants } = await supabase
        .from('ConversationParticipant')
        .select('conversationId')
        .eq('userId', user.id);

      if (!participants || participants.length === 0) {
        setUnreadCount(0);
        return;
      }

      const conversationIds = participants.map(p => p.conversationId);
      const { data: messages } = await supabase
        .from('Message')
        .select('id, readBy, senderId, isDeleted, deletedFor')
        .in('conversationId', conversationIds);

      if (messages) {
        const count = messages.filter(m =>
          m.senderId !== user.id &&
          (!m.readBy || !m.readBy.includes(user.id)) &&
          !m.isDeleted &&
          !((m.deletedFor || []).includes(user.id))
        ).length;
        setUnreadCount(count);
      }
    };

    fetchUnreadCount();

    const channel = supabase
      .channel('mobile-nav-unread-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Message' }, () => {
        fetchUnreadCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('Profile').select('fullName, username, avatarUrl, role, universityId, University(abbreviation)').eq('id', user.id).single();
        if (data) {
          const uni: any = data.University;
          const uniAbbr = Array.isArray(uni) ? uni[0]?.abbreviation : uni?.abbreviation;
          setProfile({
            fullName: data.fullName || "Student",
            username: data.username || "",
            universityAbbr: uniAbbr || "Uni",
            avatarUrl: data.avatarUrl || "",
            role: data.role || "STUDENT",
            universityId: data.universityId || null,
          });
        }
      }
    };
    fetchProfile();
  }, []);

  const currentPath = activeItem || pathname;

  const handleNavigate = (href: string) => {
    onOpenChange(false);
    if (onNavigate) {
      onNavigate(href);
    } else {
      router.push(href);
    }
  };

  const NavItem = ({ item }: { item: NavItem }) => {
    const isActive = item.href === currentPath;
    const Icon = item.icon;

    return (
      <button
        onClick={() => handleNavigate(item.href)}
        className={cn(
          "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        {item.badge && (
          <Badge className="h-5 min-w-5 flex items-center justify-center rounded-full text-[10px] px-1.5">
            {item.badge}
          </Badge>
        )}
      </button>
    );
  };

  const NavSection = ({ title, items }: { title: string; items: NavItem[] }) => (
    <div>
      <h3 className="px-3 mb-1.5 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
        {title}
      </h3>
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] p-0 bg-sidebar flex flex-col">
        <VisuallyHidden.Root>
          <SheetTitle>Navigation</SheetTitle>
        </VisuallyHidden.Root>

        {/* Logo */}
        <div className="flex items-center gap-3 h-16 px-5 border-b border-border/50">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 overflow-hidden">
            <img src="/universe_logo.png" alt="UniVerse Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-gray-500 via-gray-950 to-gray-500 dark:from-gray-200 dark:via-gray-500 dark:to-gray-200 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
            UniVerse
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          <NavSection title="Main Menu" items={mainMenuItems} />
          <NavSection title="Collaboration" items={collaborationItems} />
          <NavSection title="Settings & News" items={settingsItems} />
        </nav>

        {/* User Profile + Theme */}
        <div className="border-t border-border/50 p-3">
          <div
            onClick={() => handleNavigate('/settings')}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
          >
            <Avatar className="h-9 w-9 border-2 border-border/50">
              <AvatarImage src={profile?.avatarUrl} />
              <AvatarFallback className="bg-primary/20 text-primary text-sm font-medium">
                {profile?.fullName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {profile?.fullName || "Loading..."}
              </p>
              {profile?.username && (
                <p className="text-[10px] text-primary/60 font-medium italic -mt-0.5 truncate uppercase tracking-tighter">
                  @{profile.username}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground truncate">
                Student &bull; {profile?.universityAbbr || "Univ"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="relative mt-1.5 w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-foreground"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {mounted && (
              <>
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute left-[22px] h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </>
            )}
            <span className="text-xs font-medium ml-1">Dark mode</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
