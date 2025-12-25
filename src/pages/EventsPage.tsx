
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EventCard } from "@/components/dashboard/EventCard";
import { EventCreationModal } from "@/components/events/EventCreationModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Filter, LayoutGrid, List, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

import { useUserUniversity } from "@/hooks/useUserUniversity";

const EventsPage = () => {
    const [view, setView] = useState<"grid" | "list">("grid");
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { universityId, loading: uniLoading } = useUserUniversity();

    // We can move scope to state, default 'campus'
    const [activeScope, setActiveScope] = useState<'campus' | 'universe'>('campus');

    // Fetch on scope change or uni load
    const fetchEvents = async () => {
        // Wait for uniId if campus scope, but we can just let it run and handle null
        setLoading(true);
        let query = supabase
            .from('Event')
            .select('*')
            .order('date', { ascending: true });

        if (activeScope === 'campus') {
            if (universityId) {
                query = query.eq('scope', 'CAMPUS').eq('universityId', universityId);
            } else {
                query = query.eq('scope', 'CAMPUS'); // Empty if no uni
            }
        } else {
            query = query.eq('scope', 'UNIVERSE');
        }

        const { data, error } = await query;

        if (error) {
            console.error("Error fetching events:", error);
        } else {
            // Map Supabase events to EventCard props
            // ... (same mapping logic)
            const mappedEvents = data?.map(event => {
                const eventDate = new Date(event.date);
                return {
                    id: event.id,
                    title: event.title,
                    type: "General", // or extract from description hack
                    date: format(eventDate, "MMM d"),
                    time: format(eventDate, "h:mm a"),
                    location: event.location || "TBD",
                    attendees: 0, // Need to join rsvps
                    variant: "sky" as const,
                    status: eventDate < new Date() ? "ended" : "upcoming" as const
                };
            }) || [];
            setEvents(mappedEvents);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (!uniLoading) {
            fetchEvents();
        }
    }, [uniLoading, universityId, activeScope]);

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
                        {/* Scope Tabs */}
                        <Tabs value={activeScope} onValueChange={(v) => setActiveScope(v as any)} className="w-auto">
                            <TabsList className="h-9 bg-background/50">
                                <TabsTrigger value="campus" className="text-xs">Campus</TabsTrigger>
                                <TabsTrigger value="universe" className="text-xs">Universe</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="relative w-full sm:w-64 ml-2">
                            <Input placeholder="Search events..." className="pl-9 bg-background/50 h-9" />
                            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <div className="hidden md:block">
                            {/* Inner type tabs filters if needed, keep simplified for now */}
                        </div>
                        <div className="flex bg-muted/50 p-1 rounded-lg">
                            <Button variant={view === "grid" ? "secondary" : "ghost"} size="icon" className="h-7 w-7" onClick={() => setView("grid")}><LayoutGrid className="h-4 w-4" /></Button>
                            <Button variant={view === "list" ? "secondary" : "ghost"} size="icon" className="h-7 w-7" onClick={() => setView("list")}><List className="h-4 w-4" /></Button>
                        </div>
                        <EventCreationModal onEventCreated={fetchEvents} />
                    </div>
                </div>

                {/* Events Grid */}
                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center p-12 text-muted-foreground bg-card/30 rounded-xl">
                        No upcoming events found in {activeScope} scope. Create one!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-700">
                        {events.map((event) => (
                            <EventCard key={event.id} {...event} />
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default EventsPage;
