import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Users,
  MessageSquare,
  Brain,
  Briefcase,
  Heart,
  Car,
  FlaskConical,
  MessageCircle,
  Bell,
  Settings,
  Newspaper,
  Sparkles,
  ShoppingBag,
  Map,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
  isActive?: boolean;
}

const mainMenuItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Overview", href: "/", isActive: true },
  { icon: BookOpen, label: "Academic AI", href: "/academic" },
  { icon: Calendar, label: "Events", href: "/events" },
  { icon: Users, label: "Campus Feed", href: "/feed" },
  { icon: MessageSquare, label: "Messages", href: "/messages", badge: 3 },
  { icon: Briefcase, label: "Career Hub", href: "/career" },
  { icon: Heart, label: "Wellness", href: "/wellness" },
  { icon: Map, label: "Utilities", href: "/utilities" },
];

const collaborationItems: NavItem[] = [
  { icon: Car, label: "Cab Pooling", href: "/travel" },
  { icon: FlaskConical, label: "Research Hub", href: "/research" },
  { icon: MessageCircle, label: "Anonymous Forums", href: "/forums" },
  { icon: Users, label: "Clubs & Societies", href: "/clubs" },
];

const settingsItems: NavItem[] = [
  { icon: Newspaper, label: "Campus News", href: "/news" },
  { icon: ShoppingBag, label: "Marketplace", href: "/marketplace" },
  { icon: Sparkles, label: "What's New", href: "/updates" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

interface SidebarProps {
  activeItem?: string; // Optional: we can now use location.pathname
  onNavigate?: (href: string) => void;
}

export function Sidebar({ activeItem, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Use passed activeItem or derive from URL
  const currentPath = activeItem || location.pathname;

  const handleNavigate = (href: string) => {
    if (onNavigate) {
      onNavigate(href);
    } else {
      navigate(href);
    }
  };


  useEffect(() => {
    const timer = setTimeout(() => {
      setCollapsed(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // The sidebar is visually collapsed only if it's pinned closed AND not hovered
  const isDisplayCollapsed = collapsed && !isHovered;

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = item.href === currentPath;
    const Icon = item.icon;

    return (
      <button
        onClick={() => handleNavigate(item.href)}
        className={cn(
          "sidebar-item w-full group",
          isDisplayCollapsed ? "justify-start px-4" : "",
          isActive && "sidebar-item-active"
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {!isDisplayCollapsed && (
          <>
            <span className="flex-1 text-left text-sm">{item.label}</span>
            {item.badge && (
              <Badge
                className="h-5 w-5 flex items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-[10px] p-0 shadow-sm"
              >
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </button>
    );
  };

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "flex flex-col h-screen bg-sidebar transition-all duration-300 relative z-20",
        isDisplayCollapsed ? "w-[80px]" : "w-[280px]"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 h-20 mb-2 transition-all",
        isDisplayCollapsed ? "justify-center px-2" : "px-6"
      )}>
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
          <Brain className="h-6 w-6" />
        </div>
        {!isDisplayCollapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-sidebar-primary-foreground text-xl tracking-tight">
              UniVerse
            </span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div>
          {!isDisplayCollapsed && (
            <h3 className="px-3 mb-2 text-xs font-medium text-sidebar-muted uppercase tracking-wider">
              Main Menu
            </h3>
          )}
          <div className="space-y-1">
            {mainMenuItems.map((item) => (
              <NavItemComponent key={item.href} item={item} />
            ))}
          </div>
        </div>

        <div>
          {!isDisplayCollapsed && (
            <h3 className="px-3 mb-2 text-xs font-medium text-sidebar-muted uppercase tracking-wider">
              Collaboration
            </h3>
          )}
          <div className="space-y-1">
            {collaborationItems.map((item) => (
              <NavItemComponent key={item.href} item={item} />
            ))}
          </div>
        </div>

        <div>
          {!isDisplayCollapsed && (
            <h3 className="px-3 mb-2 text-xs font-medium text-sidebar-muted uppercase tracking-wider">
              Settings & News
            </h3>
          )}
          <div className="space-y-1">
            {settingsItems.map((item) => (
              <NavItemComponent key={item.href} item={item} />
            ))}
          </div>
        </div>
      </nav>



      {/* User Profile */}
      <div className="border-t border-sidebar-border p-3">
        <div
          className={cn(
            "flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer",
            isDisplayCollapsed && "justify-center"
          )}
        >
          <Avatar className="h-9 w-9 border-2 border-sidebar-border">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/20 text-primary text-sm font-medium">
              AS
            </AvatarFallback>
          </Avatar>
          {!isDisplayCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-primary truncate">
                Alex Student
              </p>
              <p className="text-xs text-sidebar-muted truncate">
                CS '26 • DSU
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
