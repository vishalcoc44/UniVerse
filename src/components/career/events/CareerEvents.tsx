'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Calendar, MapPin, Video, Users, CheckCircle2, Clock, Search, Plus, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface CareerEvent {
  id: string;
  title: string;
  description: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  imageUrl: string | null;
  careerEventType: string | null;
  virtualBoothUrl: string | null;
  isOnline?: boolean;
  rsvpCount: number;
  hasRsvp: boolean;
}

const EVENT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  CAREER_FAIR: { label: 'Career Fair', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  NETWORKING: { label: 'Networking', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  WORKSHOP: { label: 'Workshop', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  INFO_SESSION: { label: 'Info Session', color: 'bg-green-500/20 text-green-300 border-green-500/40' },
  WEBINAR: { label: 'Webinar', color: 'bg-red-500/20 text-red-300 border-red-500/40' },
  CAMPUS_DRIVE: { label: 'Campus Drive', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40' },
};

export function CareerEvents() {
  const [events, setEvents] = useState<CareerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', date: '', location: '',
    careerEventType: 'CAREER_FAIR', virtualBoothUrl: '', participantLimit: '',
  });
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const loadEvents = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: eventsData } = await supabase
      .from('Event')
      .select('*, EventRSVP(userId)')
      .eq('isCareerEvent', true)
      .gte('date', new Date(Date.now() - 86400000).toISOString())
      .order('date', { ascending: true });

    if (eventsData) {
      const mapped: CareerEvent[] = eventsData.map((e: Record<string, unknown>) => ({
        id: e.id as string,
        title: e.title as string,
        description: e.description as string,
        location: e.location as string | null,
        startDate: e.date as string,
        endDate: null,
        imageUrl: e.imageUrl as string | null,
        careerEventType: e.careerEventType as string | null,
        virtualBoothUrl: e.virtualBoothUrl as string | null,
        rsvpCount: ((e.EventRSVP as unknown[]) ?? []).length,
        hasRsvp: user ? ((e.EventRSVP as Array<{userId: string}>) ?? []).some(r => r.userId === user.id) : false,
      }));
      setEvents(mapped);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // FC-1 fix: Event admin RLS allows platform admin OR university admin
        // in matching uni (audit/fixes/05). Both gain admin UI affordances here.
        const { data: profile } = await supabase
          .from('Profile')
          .select('role, universityId')
          .eq('id', user.id)
          .single();
        setIsAdmin(profile?.role === 'ADMIN');
      }
      await loadEvents();
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitEvent = async () => {
    if (!form.title || !form.date) return;
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }
    if (editingEventId) {
      const { error, data: updated } = await supabase.from('Event').update({
        title: form.title,
        description: form.description || null,
        date: new Date(form.date).toISOString(),
        location: form.location || null,
        careerEventType: form.careerEventType || null,
        virtualBoothUrl: form.virtualBoothUrl || null,
        participantLimit: form.participantLimit ? parseInt(form.participantLimit) : null,
      }).eq('id', editingEventId).select('*').single();

      if (error) {
        alert(error.message);
        setSubmitting(false);
        return;
      }

      if (updated) {
        setEvents(prev => prev.map(e => e.id === editingEventId ? ({
          id: updated.id as string,
          title: updated.title as string,
          description: updated.description as string,
          location: updated.location as string | null,
          startDate: updated.date as string,
          endDate: null,
          imageUrl: updated.imageUrl as string | null,
          careerEventType: updated.careerEventType as string | null,
          virtualBoothUrl: updated.virtualBoothUrl as string | null,
          rsvpCount: e.rsvpCount,
          hasRsvp: e.hasRsvp,
        }) : e));
      }

      setEditingEventId(null);
      setForm({ title: '', description: '', date: '', location: '', careerEventType: 'CAREER_FAIR', virtualBoothUrl: '', participantLimit: '' });
      setShowCreate(false);
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from('Event').insert({
      id: crypto.randomUUID(),
      title: form.title,
      description: form.description || null,
      date: new Date(form.date).toISOString(),
      location: form.location || null,
      careerEventType: form.careerEventType || null,
      virtualBoothUrl: form.virtualBoothUrl || null,
      participantLimit: form.participantLimit ? parseInt(form.participantLimit) : null,
      organizerId: user.id,
      isCareerEvent: true,
    });

    if (error) {
      alert(error.message);
      setSubmitting(false);
      return;
    }

    setForm({ title: '', description: '', date: '', location: '', careerEventType: 'CAREER_FAIR', virtualBoothUrl: '', participantLimit: '' });
    setShowCreate(false);
    await loadEvents();
    setSubmitting(false);
  };

  const startEditEvent = async (eventId: string) => {
    setSubmitting(true);
    const { data, error } = await supabase.from('Event').select('title, description, date, location, careerEventType, virtualBoothUrl, participantLimit').eq('id', eventId).single();
    setSubmitting(false);
    if (error || !data) {
      alert(error?.message ?? 'Failed to load event');
      return;
    }

    setEditingEventId(eventId);
    setForm({
      title: data.title ?? '',
      description: data.description ?? '',
      date: data.date ? new Date(data.date as string).toISOString().slice(0,16) : '',
      location: data.location ?? '',
      careerEventType: data.careerEventType ?? 'CAREER_FAIR',
      virtualBoothUrl: data.virtualBoothUrl ?? '',
      participantLimit: data.participantLimit ? String(data.participantLimit) : '',
    });
    setShowCreate(true);
  };

  const toggleRsvp = async (eventId: string, currentRsvp: boolean) => {
    setActionId(eventId);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setActionId(null); return; }

    if (currentRsvp) {
      await supabase.from('EventRSVP').delete().eq('eventId', eventId).eq('userId', user.id);
    } else {
      await supabase.from('EventRSVP').insert({ eventId, userId: user.id });
    }

    setEvents(prev => prev.map(e =>
      e.id === eventId ? {
        ...e,
        hasRsvp: !currentRsvp,
        rsvpCount: e.rsvpCount + (currentRsvp ? -1 : 1),
      } : e
    ));
    setActionId(null);
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Delete this career event?')) return;
    setActionId(`delete-${eventId}`);
    const { error } = await supabase.from('Event').delete().eq('id', eventId);
    if (error) {
      alert(error.message);
      setActionId(null);
      return;
    }
    setEvents(prev => prev.filter(e => e.id !== eventId));
    setActionId(null);
  };

  const filtered = events.filter(e => {
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.description?.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || e.careerEventType === filterType;
    return matchSearch && matchType;
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const isUpcoming = (dateStr: string) => new Date(dateStr) > new Date();

  if (loading) return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading events...
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black text-lg italic">Career Events</h3>
          <p className="text-xs text-muted-foreground font-bold">{filtered.length} upcoming events</p>
        </div>
        {isAdmin && (
          <Button
            size="sm"
            className="h-8 text-[11px] font-black rounded-xl gap-1"
            onClick={() => setShowCreate(s => !s)}
          >
            {showCreate ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showCreate ? 'Cancel' : 'Create Event'}
          </Button>
        )}
      </div>

      {/* Admin: Create Event Form */}
      <AnimatePresence>
        {showCreate && isAdmin && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card/30 border border-primary/30 rounded-2xl p-4 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">New Career Event</p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Event title *"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="col-span-2 h-9 bg-card/40 border-border/40 rounded-xl text-xs"
                />
                <Input
                  placeholder="Description"
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="col-span-2 h-9 bg-card/40 border-border/40 rounded-xl text-xs"
                />
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground pl-1">Date & Time *</label>
                  <Input
                    type="datetime-local"
                    value={form.date}
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    className="h-9 bg-card/40 border-border/40 rounded-xl text-xs"
                  />
                </div>
                <Input
                  placeholder="Location"
                  value={form.location}
                  onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  className="h-9 bg-card/40 border-border/40 rounded-xl text-xs"
                />
                <Input
                  placeholder="Virtual URL"
                  value={form.virtualBoothUrl}
                  onChange={e => setForm(p => ({ ...p, virtualBoothUrl: e.target.value }))}
                  className="h-9 bg-card/40 border-border/40 rounded-xl text-xs"
                />
                <select
                  value={form.careerEventType}
                  onChange={e => setForm(p => ({ ...p, careerEventType: e.target.value }))}
                  className="h-9 bg-card/40 border border-border/40 rounded-xl text-xs font-medium px-3 text-foreground"
                >
                  {Object.entries(EVENT_TYPE_LABELS).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <Input
                  placeholder="Participant limit (optional)"
                  type="number"
                  value={form.participantLimit}
                  onChange={e => setForm(p => ({ ...p, participantLimit: e.target.value }))}
                  className="h-9 bg-card/40 border-border/40 rounded-xl text-xs"
                />
              </div>
              <Button
                size="sm"
                className="h-8 text-[11px] font-black rounded-xl w-full"
                onClick={submitEvent}
                disabled={submitting || !form.title || !form.date}
              >
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (editingEventId ? 'Update Event' : 'Post Event')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search + Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 bg-card/40 border-border/40 rounded-xl text-sm font-medium"
          />
        </div>
      </div>

      {/* Type filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType(null)}
          className={cn("text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full border transition-all",
            !filterType ? "bg-primary text-primary-foreground border-primary" : "border-border/40 text-muted-foreground hover:border-primary/40")}
        >
          All
        </button>
        {Object.entries(EVENT_TYPE_LABELS).map(([key, { label, color }]) => (
          <button
            key={key}
            onClick={() => setFilterType(filterType === key ? null : key)}
            className={cn("text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full border transition-all",
              filterType === key ? color : "border-border/40 text-muted-foreground hover:border-primary/40")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Event Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-10">
          <Calendar className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-sm font-bold text-muted-foreground">No events found.</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {filtered.map((event, i) => {
            const typeInfo = event.careerEventType ? EVENT_TYPE_LABELS[event.careerEventType] : null;
            const upcoming = isUpcoming(event.startDate);
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "bg-card/40 border rounded-2xl p-4 transition-all",
                  event.hasRsvp ? "border-primary/50 bg-primary/5" : "border-border/40 hover:border-border"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {typeInfo && (
                        <span className={cn("text-[8px] font-black uppercase tracking-widest border px-2 py-0.5 rounded-full", typeInfo.color)}>
                          {typeInfo.label}
                        </span>
                      )}
                      {!upcoming && (
                        <span className="text-[8px] font-black uppercase tracking-widest border border-muted/30 text-muted-foreground px-2 py-0.5 rounded-full">
                          Past
                        </span>
                      )}
                    </div>
                    <h3 className="font-black text-sm leading-tight">{event.title}</h3>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    {event.hasRsvp && <CheckCircle2 className="h-5 w-5 text-primary" />}
                    {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEditEvent(event.id)}
                            className="p-1 rounded-lg hover:bg-primary/10 text-muted-foreground"
                            title="Edit event"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteEvent(event.id)}
                            disabled={actionId === `delete-${event.id}`}
                            className="p-1 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                            title="Delete event"
                          >
                            {actionId === `delete-${event.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                    )}
                  </div>
                </div>

                {event.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{event.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(event.startDate)}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </span>
                  )}
                  {event.virtualBoothUrl && (
                    <span className="flex items-center gap-1 text-blue-400">
                      <Video className="h-3 w-3" />
                      Virtual
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {event.rsvpCount} going
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {upcoming && (
                    <Button
                      size="sm"
                      variant={event.hasRsvp ? "outline" : "default"}
                      className={cn("h-7 text-[10px] font-black rounded-xl",
                        event.hasRsvp ? "border-primary/40 text-primary" : "")}
                      onClick={() => toggleRsvp(event.id, event.hasRsvp)}
                      disabled={actionId === event.id}
                    >
                      {actionId === event.id
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : event.hasRsvp ? 'Cancel RSVP' : 'RSVP'}
                    </Button>
                  )}
                  {event.virtualBoothUrl && (
                    <a
                      href={event.virtualBoothUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-black text-blue-400 hover:text-blue-300 border border-blue-500/30 bg-blue-500/5 px-3 py-1 rounded-xl"
                    >
                      Join Virtual
                    </a>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
    </div>
  );
}
