import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EventCard } from "@/components/dashboard/EventCard";
import { EventCreationModal } from "@/components/events/EventCreationModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Filter, LayoutGrid, List } from "lucide-react";
import { useState } from "react";

const EventsPage = () => {
    const [view, setView] = useState<"grid" | "list">("grid");

    const events = [
        {
            title: "Intro to Machine Learning",
            type: "Workshop",
            date: "Jan 15",
            time: "2:00 PM - 4:00 PM",
            location: "Sci-Tech Block, Lab 3",
            attendees: 45,
            variant: "sky",
            status: "upcoming"
        },
        {
            title: "Music Club Jam Session",
            type: "Social",
            date: "Jan 16",
            time: "5:30 PM Onwards",
            location: "Amphitheater",
            attendees: 120,
            variant: "rose",
            status: "live"
        },
        {
            title: "Inter-College Debate",
            type: "Competition",
            date: "Jan 18",
            time: "10:00 AM",
            location: "Main Auditorium",
            attendees: 85,
            variant: "amber",
            status: "upcoming"
        },
        {
            title: "Yoga for Wellness",
            type: "Wellness",
            date: "Jan 19",
            time: "7:00 AM",
            location: "College Ground",
            attendees: 30,
            variant: "mint",
            status: "upcoming"
        },
        {
            title: "Career Fair 2024",
            type: "Career",
            date: "Jan 22",
            time: "9:00 AM - 5:00 PM",
            location: "Convention Hall",
            attendees: 500,
            variant: "lavender",
            status: "upcoming"
        },
        {
            title: "Photography Walk",
            type: "Hobby",
            date: "Jan 25",
            time: "4:00 PM",
            location: "Campus Garden",
            attendees: 15,
            variant: "peach",
            status: "upcoming"
        }
    ] as const;

    return (
        <DashboardLayout
            title="Events"
            subtitle="Discover what's happening around campus."
            breadcrumb={["UniVerse", "Events"]}
        >
            <div className="space-y-6">
                {/* Controls Bar */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/40 p-2 rounded-xl border border-border/50 backdrop-blur-sm">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Input placeholder="Search events..." className="pl-9 bg-background/50 h-9" />
                            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        </div>
                        <Tabs defaultValue="all" className="hidden md:block">
                            <TabsList className="h-9 bg-background/50">
                                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                                <TabsTrigger value="workshops" className="text-xs">Workshops</TabsTrigger>
                                <TabsTrigger value="social" className="text-xs">Social</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <div className="flex bg-muted/50 p-1 rounded-lg">
                            <Button
                                variant={view === "grid" ? "secondary" : "ghost"}
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setView("grid")}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={view === "list" ? "secondary" : "ghost"}
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setView("list")}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button variant="outline" size="sm" className="hidden sm:flex gap-2 h-9">
                            <CalendarIcon className="h-4 w-4" />
                            Calendar View
                        </Button>
                        <EventCreationModal />
                    </div>
                </div>

                {/* Events Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-700">
                    {events.map((event, index) => (
                        <EventCard key={index} {...event} />
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default EventsPage;
