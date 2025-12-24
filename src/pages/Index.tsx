
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { EventCard } from "@/components/dashboard/EventCard";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { UpcomingItem } from "@/components/dashboard/UpcomingItem";
import { MiniCalendar } from "@/components/dashboard/MiniCalendar";
import {
  BookOpen,
  Calendar,
  Users,
  Briefcase,
  Brain,
  Heart,
  MessageCircle,
  Car,
  Plus,
  TrendingUp,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const stats = [
    {
      title: "Active Events",
      value: 12,
      subtitle: "5 this week",
      icon: Calendar,
      variant: "sky" as const,
      trend: { value: 8, positive: true },
    },
    {
      title: "Study Groups",
      value: 4,
      subtitle: "2 meetings today",
      icon: Users,
      variant: "mint" as const,
      trend: { value: 12, positive: true },
    },
    {
      title: "Career Score",
      value: "78%",
      subtitle: "Resume strength",
      icon: Briefcase,
      variant: "amber" as const,
      trend: { value: 5, positive: true },
    },
    {
      title: "Wellness Streak",
      value: "7 days",
      subtitle: "Keep it up!",
      icon: Heart,
      variant: "rose" as const,
    },
  ];

  const quickActions = [
    {
      title: "Academic AI Assistant",
      description: "Get instant help with doubts, access notes, and study resources",
      icon: Brain,
      variant: "lavender" as const,
    },
    {
      title: "Resume Analyzer",
      description: "Get your resume scored and receive AI-powered improvements",
      icon: GraduationCap,
      variant: "amber" as const,
    },
    {
      title: "Anonymous Forums",
      description: "Discuss freely without revealing your identity",
      icon: MessageCircle,
      variant: "mint" as const,
    },
    {
      title: "Cab Pooling",
      description: "Find travel buddies and split costs for your next trip",
      icon: Car,
      variant: "sky" as const,
    },
  ];

  const upcomingItems = [
    {
      code: "CS301",
      title: "Data Structures Quiz",
      date: "Jan 15",
      time: "10:00 AM",
      daysLeft: 3,
      variant: "mint" as const,
    },
    {
      code: "MT205",
      title: "Linear Algebra Exam",
      date: "Jan 18",
      time: "2:00 PM",
      daysLeft: 6,
      variant: "amber" as const,
    },
    {
      code: "PHY102",
      title: "Physics Lab Submission",
      date: "Jan 20",
      time: "11:30 AM",
      daysLeft: 8,
      variant: "lavender" as const,
    },
  ];

  const events = [
    {
      title: "Python Workshop",
      type: "Workshop",
      date: "Jan 15, 2025",
      time: "3:00 PM - 5:00 PM",
      location: "Tech Hub, Room 301",
      attendees: 45,
      variant: "sky" as const,
      status: "upcoming" as const,
    },
    {
      title: "Startup Pitch Competition",
      type: "Competition",
      date: "Jan 16, 2025",
      time: "10:00 AM - 4:00 PM",
      location: "Auditorium",
      attendees: 120,
      variant: "amber" as const,
      status: "upcoming" as const,
    },
  ];

  return (
    <DashboardLayout
      title="Welcome back, Alex!"
      subtitle="Here's what's happening across your campus ecosystem today."
      breadcrumb={["UniVerse", "Overview"]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>

          {/* Quick Actions */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Quick Actions
              </h2>
              <Button variant="ghost" size="sm" className="text-primary">
                View all
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <QuickActionCard key={index} {...action} />
              ))}
            </div>
          </section>

          {/* Upcoming Events */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-foreground">
                  Upcoming Events
                </h2>
                <Badge variant="secondary" className="text-xs">
                  {events.length} this week
                </Badge>
              </div>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                Add Event
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {events.map((event, index) => (
                <EventCard key={index} {...event} />
              ))}
            </div>
          </section>
        </div>

        {/* Right Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Mini Calendar */}
          <MiniCalendar />

          {/* Upcoming Deadlines */}
          <section className="bg-card rounded-xl border border-border p-4 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">
                Upcoming Deadlines
              </h2>
              <Button variant="ghost" size="sm" className="text-xs text-primary h-7">
                View all
              </Button>
            </div>
            <div className="space-y-3">
              {upcomingItems.map((item, index) => (
                <UpcomingItem key={index} {...item} />
              ))}
            </div>
          </section>

          {/* Campus Feed Preview */}
          <section className="bg-card rounded-xl border border-border p-4 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Campus Feed</h2>
              <Badge className="bg-status-success/20 text-status-success text-xs">
                ● Live
              </Badge>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-pastel-lavender flex items-center justify-center text-xs font-medium text-pastel-lavender-dark">
                  SK
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">Sarah K.</span>{" "}
                    <span className="text-muted-foreground">
                      posted in CS Study Group
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    "Anyone up for a DSA revision session tomorrow?"
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    5 min ago
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-pastel-mint flex items-center justify-center text-xs font-medium text-pastel-mint-dark">
                  TM
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">Tech Club</span>{" "}
                    <span className="text-muted-foreground">
                      announced an event
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    "Hackathon registrations are now open! 🚀"
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    1 hour ago
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full mt-4 text-sm"
              size="sm"
            >
              Open Campus Feed
            </Button>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
