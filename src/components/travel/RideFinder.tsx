import { useEffect, useMemo, useState } from "react";
import { Search, PlusCircle, Loader2, CalendarCheck2, Car, Check, X, MapPin, Clock, Users, IndianRupee, ArrowRight, MessageSquare, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RideCard } from "@/components/travel/RideCard";
import { supabase } from "@/lib/supabase";
import { useUserUniversity } from "@/hooks/useUserUniversity";

type RideOfferItem = {
  id: string;
  from: string;
  to: string;
  date: string;
  seats: number;
  price: number | null;
  driverId: string;
  driver: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    universityName?: string | null;
  } | null;
};

type RideRequestItem = {
  id: string;
  offerId: string;
  passengerId: string;
  status: string;
};

type IncomingRideRequest = {
  id: string;
  offerId: string;
  passengerId: string;
  status: string;
  offer: {
    id: string;
    from: string;
    to: string;
    date: string;
  } | null;
  passenger: {
    fullName: string;
    username: string;
  } | null;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    if ("message" in error && typeof (error as { message: unknown }).message === "string") {
      return (error as { message: string }).message;
    }
    if ("error" in error && typeof (error as { error: unknown }).error === "string") {
      return (error as { error: string }).error;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error);
}

export function RideFinder() {
  const router = useRouter();
  const { universityId, userId } = useUserUniversity();

  const [loadingRides, setLoadingRides] = useState(true);
  const [creatingRide, setCreatingRide] = useState(false);
  const [requestingRideId, setRequestingRideId] = useState<string | null>(null);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);
  const [loadingIncoming, setLoadingIncoming] = useState(false);
  const [connectingUserId, setConnectingUserId] = useState<string | null>(null);

  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  const [whenQuery, setWhenQuery] = useState("");

  const [offerFrom, setOfferFrom] = useState("");
  const [offerTo, setOfferTo] = useState("");
  const [offerWhen, setOfferWhen] = useState("");
  const [offerSeats, setOfferSeats] = useState(2);
  const [offerPrice, setOfferPrice] = useState("");

  const [rides, setRides] = useState<RideOfferItem[]>([]);
  const [myRequests, setMyRequests] = useState<RideRequestItem[]>([]);
  const [myRequestedRides, setMyRequestedRides] = useState<Record<string, RideOfferItem>>({});
  const [myOffers, setMyOffers] = useState<RideOfferItem[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IncomingRideRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"find" | "offer" | "requests" | "my-offers">("find");

  const requestedOfferIds = useMemo(() => {
    return new Set(myRequests.map((request) => request.offerId));
  }, [myRequests]);

  const fetchRides = async () => {
    setLoadingRides(true);

    try {
      let query = supabase
        .from("RideOffer")
        .select("id, from, to, date, seats, price, driverId, universityId, driver:Profile!RideOffer_driverId_fkey(id, fullName, avatarUrl, universityName)")
        .gte("date", new Date().toISOString())
        .order("date", { ascending: true })
        .limit(60);

      if (fromQuery.trim()) query = query.ilike("from", `%${fromQuery.trim()}%`);
      if (toQuery.trim()) query = query.ilike("to", `%${toQuery.trim()}%`);
      if (universityId) query = query.eq("universityId", universityId);

      const { data, error } = await query;
      if (error) throw error;

      let normalized: RideOfferItem[] = ((data || []) as Array<Record<string, any>>).map((row) => {
        const relation = row.driver;
        const driver = Array.isArray(relation) ? relation[0] : relation;

        return {
          id: String(row.id),
          from: String(row.from || ""),
          to: String(row.to || ""),
          date: String(row.date),
          seats: Number(row.seats || 0),
          price: row.price === null || row.price === undefined ? null : Number(row.price),
          driverId: String(row.driverId || ""),
          driver: driver
            ? {
              id: String(driver.id || ""),
              fullName: String(driver.fullName || "Unknown User"),
              avatarUrl: driver.avatarUrl ? String(driver.avatarUrl) : null,
              universityName: driver.universityName ? String(driver.universityName) : null
            }
            : null
        };
      });

      if (whenQuery) {
        const selectedDay = new Date(whenQuery);
        const start = new Date(selectedDay);
        start.setHours(0, 0, 0, 0);
        const end = new Date(selectedDay);
        end.setHours(23, 59, 59, 999);
        normalized = normalized.filter((ride) => {
          const rideDate = new Date(ride.date);
          return rideDate >= start && rideDate <= end;
        });
      }

      setRides(normalized);

      if (userId) {
        const offerIds = normalized.map((ride) => ride.id);
        if (offerIds.length === 0) {
          setMyRequests([]);
        } else {
          const { data: requestData, error: requestError } = await supabase
            .from("RideRequest")
            .select("id, offerId, passengerId, status")
            .eq("passengerId", userId)
            .in("offerId", offerIds);

          if (requestError) {
            throw requestError;
          }

          setMyRequests((requestData || []) as RideRequestItem[]);
        }
      }
    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to load rides.");
    } finally {
      setLoadingRides(false);
    }
  };

  const fetchMyRequests = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("RideRequest")
      .select("id, offerId, passengerId, status")
      .eq("passengerId", userId)
      .order("id", { ascending: false });

    if (error) {
      toast.error(getErrorMessage(error) || "Failed to load your requests.");
      return;
    }

    const requests = (data || []) as RideRequestItem[];
    setMyRequests(requests);

    const offerIds = requests.map((request) => request.offerId);
    if (offerIds.length === 0) {
      setMyRequestedRides({});
      return;
    }

    const { data: offersData, error: offersError } = await supabase
      .from("RideOffer")
      .select("id, from, to, date, seats, price, driverId, universityId, driver:Profile!RideOffer_driverId_fkey(id, fullName, avatarUrl, universityName)")
      .in("id", offerIds);

    if (offersError) {
      toast.error(getErrorMessage(offersError) || "Failed to load requested ride details.");
      return;
    }

    const lookup: Record<string, RideOfferItem> = {};
    ((offersData || []) as Array<Record<string, any>>).forEach((row) => {
      const relation = row.driver;
      const driver = Array.isArray(relation) ? relation[0] : relation;
      const normalized: RideOfferItem = {
        id: String(row.id),
        from: String(row.from || ""),
        to: String(row.to || ""),
        date: String(row.date),
        seats: Number(row.seats || 0),
        price: row.price === null || row.price === undefined ? null : Number(row.price),
        driverId: String(row.driverId || ""),
        driver: driver
          ? {
            id: String(driver.id || ""),
            fullName: String(driver.fullName || "Unknown User"),
            avatarUrl: driver.avatarUrl ? String(driver.avatarUrl) : null,
            universityName: driver.universityName ? String(driver.universityName) : null
          }
          : null
      };
      lookup[normalized.id] = normalized;
    });

    setMyRequestedRides(lookup);
  };

  const fetchIncomingRequests = async () => {
    if (!userId) return;

    setLoadingIncoming(true);
    try {
      const { data: offersData, error: offersError } = await supabase
        .from("RideOffer")
        .select("id, from, to, date, seats, price, driverId, universityId, driver:Profile!RideOffer_driverId_fkey(id, fullName, avatarUrl, universityName)")
        .eq("driverId", userId)
        .order("date", { ascending: true });

      if (offersError) throw offersError;

      const normalizedOffers: RideOfferItem[] = ((offersData || []) as Array<Record<string, any>>).map((row) => {
        const relation = row.driver;
        const driver = Array.isArray(relation) ? relation[0] : relation;

        return {
          id: String(row.id),
          from: String(row.from || ""),
          to: String(row.to || ""),
          date: String(row.date),
          seats: Number(row.seats || 0),
          price: row.price === null || row.price === undefined ? null : Number(row.price),
          driverId: String(row.driverId || ""),
          driver: driver
            ? {
              id: String(driver.id || ""),
              fullName: String(driver.fullName || "Unknown User"),
              avatarUrl: driver.avatarUrl ? String(driver.avatarUrl) : null,
              universityName: driver.universityName ? String(driver.universityName) : null
            }
            : null
        };
      });
      setMyOffers(normalizedOffers);

      const offerIds = normalizedOffers.map((offer) => offer.id);
      if (offerIds.length === 0) {
        setIncomingRequests([]);
        return;
      }

      const { data: requestsData, error: requestsError } = await supabase
        .from("RideRequest")
        .select("id, offerId, passengerId, status, offer:RideOffer!RideRequest_offerId_fkey(id, from, to, date), passenger:Profile!RideRequest_passengerId_fkey(fullName, username)")
        .in("offerId", offerIds)
        .order("id", { ascending: false });

      if (requestsError) throw requestsError;

      const normalizedRequests: IncomingRideRequest[] = ((requestsData || []) as Array<Record<string, any>>).map((row) => {
        const offerRelation = row.offer;
        const offer = Array.isArray(offerRelation) ? offerRelation[0] : offerRelation;
        const passengerRelation = row.passenger;
        const passenger = Array.isArray(passengerRelation) ? passengerRelation[0] : passengerRelation;

        return {
          id: String(row.id),
          offerId: String(row.offerId),
          passengerId: String(row.passengerId),
          status: String(row.status || "PENDING"),
          offer: offer
            ? {
              id: String(offer.id || ""),
              from: String(offer.from || ""),
              to: String(offer.to || ""),
              date: String(offer.date || "")
            }
            : null,
          passenger: passenger
            ? {
              fullName: String(passenger.fullName || "Unknown User"),
              username: String(passenger.username || "")
            }
            : null
        };
      });

      setIncomingRequests(normalizedRequests);
    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to load incoming requests.");
    } finally {
      setLoadingIncoming(false);
    }
  };

  useEffect(() => {
    fetchRides();
    fetchMyRequests();
    fetchIncomingRequests();
  }, [userId, universityId]);

  const handleSearch = async () => {
    await fetchRides();
  };

  const handleCreateOffer = async () => {
    if (!userId) {
      toast.error("Please log in to offer a ride.");
      return;
    }

    if (!offerFrom.trim() || !offerTo.trim() || !offerWhen) {
      toast.error("Please fill pickup, destination, and departure time.");
      return;
    }

    if (offerSeats < 1) {
      toast.error("Seats must be at least 1.");
      return;
    }

    setCreatingRide(true);

    try {
      const { error } = await supabase.from("RideOffer").insert({
        id: crypto.randomUUID(),
        from: offerFrom.trim(),
        to: offerTo.trim(),
        date: new Date(offerWhen).toISOString(),
        seats: offerSeats,
        price: offerPrice.trim() ? Number(offerPrice) : null,
        driverId: userId,
        universityId: universityId || null
      });

      if (error) throw error;

      toast.success("Ride offer posted.");
      setOfferFrom("");
      setOfferTo("");
      setOfferWhen("");
      setOfferSeats(2);
      setOfferPrice("");
      await fetchRides();
      await fetchIncomingRequests();
    } catch (error) {
      toast.error(getErrorMessage(error) || "Could not create offer.");
    } finally {
      setCreatingRide(false);
    }
  };

  const handleRequestSeat = async (rideId: string) => {
    if (!userId) {
      toast.error("Please log in to request a seat.");
      return;
    }

    setRequestingRideId(rideId);
    try {
      const { error } = await supabase.from("RideRequest").insert({
        id: crypto.randomUUID(),
        offerId: rideId,
        passengerId: userId
      });

      if (error) {
        const message = getErrorMessage(error);
        if (message.includes("duplicate") || message.includes("unique")) {
          toast.info("You already requested this ride.");
        } else {
          throw error;
        }
      } else {
        toast.success("Seat request sent.");
      }

      await fetchRides();
      await fetchMyRequests();
      await fetchIncomingRequests();
    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to request seat.");
    } finally {
      setRequestingRideId(null);
    }
  };

  const handleRequestStatusUpdate = async (requestId: string, status: "ACCEPTED" | "REJECTED") => {
    setUpdatingRequestId(requestId);
    try {
      const requestToUpdate = incomingRequests.find((request) => request.id === requestId) || null;
      const { error } = await supabase
        .from("RideRequest")
        .update({ status })
        .eq("id", requestId);

      if (error) throw error;

      toast.success(`Request ${status.toLowerCase()}.`);

      if (status === "ACCEPTED" && requestToUpdate?.passengerId) {
        await connectViaMessages(requestToUpdate.passengerId, { navigate: false, successMessage: "Student connected in Messages." });
      }

      await fetchIncomingRequests();
      await fetchRides();
    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to update request.");
    } finally {
      setUpdatingRequestId(null);
    }
  };

  const connectViaMessages = async (
    targetUserId: string,
    options?: { navigate?: boolean; successMessage?: string }
  ) => {
    if (!userId) {
      toast.error("Please log in to start chat.");
      return;
    }

    if (!targetUserId || targetUserId === userId) {
      toast.error("Invalid user for chat.");
      return;
    }

    const shouldNavigate = options?.navigate !== false;
    setConnectingUserId(targetUserId);

    try {
      const { data: myConvos, error: myConvosError } = await supabase
        .from("ConversationParticipant")
        .select("conversationId")
        .eq("userId", userId);

      if (myConvosError) throw myConvosError;

      const myConvoIds = (myConvos || []).map((item) => item.conversationId);

      if (myConvoIds.length > 0) {
        const { data: existing, error: existingError } = await supabase
          .from("ConversationParticipant")
          .select("conversationId")
          .eq("userId", targetUserId)
          .in("conversationId", myConvoIds)
          .maybeSingle();

        if (existingError) throw existingError;

        if (existing?.conversationId) {
          if (shouldNavigate) {
            router.push("/messages");
          }
          toast.success(options?.successMessage || "Opened existing chat.");
          return;
        }
      }

      const { data: newConvo, error: createError } = await supabase
        .from("Conversation")
        .insert({
          isGroup: false,
          updatedAt: new Date().toISOString()
        })
        .select("id")
        .single();

      if (createError || !newConvo?.id) {
        throw createError || new Error("Could not create conversation.");
      }

      const { error: selfParticipantError } = await supabase
        .from("ConversationParticipant")
        .insert({
          conversationId: newConvo.id,
          userId,
          role: "ADMIN",
          status: "ACCEPTED"
        });

      if (selfParticipantError) throw selfParticipantError;

      const { error: otherParticipantError } = await supabase
        .from("ConversationParticipant")
        .insert({
          conversationId: newConvo.id,
          userId: targetUserId,
          role: "MEMBER",
          status: "ACCEPTED"
        });

      if (otherParticipantError) throw otherParticipantError;

      const { error: firstMessageError } = await supabase
        .from("Message")
        .insert({
          id: crypto.randomUUID(),
          conversationId: newConvo.id,
          senderId: userId,
          content: "Ride request accepted. You can coordinate pickup details here."
        });

      if (firstMessageError) throw firstMessageError;

      if (shouldNavigate) {
        router.push("/messages");
      }
      toast.success(options?.successMessage || "Chat started.");
    } catch (error) {
      toast.error(getErrorMessage(error) || "Could not open chat.");
    } finally {
      setConnectingUserId(null);
    }
  };

  const requestRideLookup = useMemo(() => {
    const byId: Record<string, RideOfferItem> = {};
    rides.forEach((ride) => {
      byId[ride.id] = ride;
    });
    return { ...byId, ...myRequestedRides };
  }, [rides, myRequestedRides]);

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2rem] p-2 w-fit">
        {([
          { id: "find",      label: "Find Ride",    icon: Search },
          { id: "offer",     label: "Offer Ride",   icon: PlusCircle },
          { id: "requests",  label: "My Requests",  icon: CalendarCheck2 },
          { id: "my-offers", label: "My Offers",    icon: Car },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300",
              activeTab === tab.id
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {activeTab === "find" && (
          <motion.div key="find" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
            {/* Search */}
            <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-violet-500 to-pink-500" />
              <div className="flex items-center gap-4 mb-7">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary"><Search className="h-5 w-5" /></div>
                <div>
                  <h3 className="font-black text-xl italic tracking-tight uppercase">Find a Ride</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Search verified student rides at your campus</p>
                </div>
                <span className="ml-auto px-3 py-1.5 rounded-xl bg-green-500/10 text-green-500 text-[9px] font-black uppercase tracking-widest border border-green-500/20">Student Verified</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground/60">From & To</label>
                  <div className="flex bg-background/50 rounded-2xl border border-border/40 overflow-hidden">
                    <Input className="border-none shadow-none focus-visible:ring-0 rounded-none h-12 bg-transparent" placeholder="Campus Gate..." value={fromQuery} onChange={(e) => setFromQuery(e.target.value)} />
                    <div className="w-px bg-border/40" />
                    <Input className="border-none shadow-none focus-visible:ring-0 rounded-none h-12 bg-transparent" placeholder="Airport / Metro..." value={toQuery} onChange={(e) => setToQuery(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground/60">When</label>
                  <Input type="date" className="h-12 bg-background/50 rounded-2xl border-border/40" value={whenQuery} onChange={(e) => setWhenQuery(e.target.value)} />
                </div>
                <Button className="h-12 rounded-2xl bg-primary font-black italic tracking-tighter shadow-xl shadow-primary/20 text-white" onClick={handleSearch}>
                  <Search className="h-4 w-4 mr-2" /> Search
                </Button>
              </div>
            </div>

            {loadingRides ? (
              <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-14 flex items-center justify-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm font-bold italic text-muted-foreground">Finding rides nearby…</span>
              </div>
            ) : rides.length === 0 ? (
              <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-14 text-center">
                <Car className="h-14 w-14 text-muted-foreground/20 mx-auto mb-4" />
                <p className="font-black italic text-xl text-muted-foreground">No rides found</p>
                <p className="text-sm text-muted-foreground/50 mt-1.5">Try different filters or be the first to offer one</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {rides.map((ride) => (
                  <RideCard
                    key={ride.id}
                    ride={{ ...ride, requestedSeats: 0, driver: ride.driver || { id: "", fullName: "Unknown User", avatarUrl: null } }}
                    isOwnRide={ride.driverId === userId}
                    alreadyRequested={requestedOfferIds.has(ride.id)}
                    requestLoading={requestingRideId === ride.id}
                    onRequestSeat={handleRequestSeat}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "offer" && (
          <motion.div key="offer" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-2xl">
            <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-10 space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary"><PlusCircle className="h-5 w-5" /></div>
                <div>
                  <h3 className="font-black text-xl italic tracking-tight uppercase">Offer a Ride</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Share your journey with fellow students</p>
                </div>
              </div>
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground/60">Pickup Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                      <Input className="pl-10 h-12 bg-background/50 rounded-2xl border-border/40" placeholder="Campus Gate 1" value={offerFrom} onChange={(e) => setOfferFrom(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground/60">Destination</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
                      <Input className="pl-10 h-12 bg-background/50 rounded-2xl border-border/40" placeholder="Airport / Railway" value={offerTo} onChange={(e) => setOfferTo(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground/60">Departure Date & Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
                    <Input type="datetime-local" className="pl-10 h-12 bg-background/50 rounded-2xl border-border/40" value={offerWhen} onChange={(e) => setOfferWhen(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground/60">Seats Available</label>
                    <div className="relative">
                      <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                      <Input type="number" min={1} max={8} className="pl-10 h-12 bg-background/50 rounded-2xl border-border/40" value={offerSeats} onChange={(e) => setOfferSeats(Number(e.target.value || 1))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground/60">Price / Seat (₹)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                      <Input type="number" min={0} className="pl-10 h-12 bg-background/50 rounded-2xl border-border/40" placeholder="Free" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
              <Button className="w-full h-14 rounded-2xl bg-primary font-black italic tracking-tighter shadow-xl shadow-primary/20 text-white text-base" onClick={handleCreateOffer} disabled={creatingRide}>
                {creatingRide ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlusCircle className="h-5 w-5 mr-2" />}
                {creatingRide ? "Publishing…" : "Publish Ride Offer"}
              </Button>
            </div>
          </motion.div>
        )}

        {activeTab === "requests" && (
          <motion.div key="requests" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary"><CalendarCheck2 className="h-5 w-5" /></div>
                <div>
                  <h3 className="font-black text-xl italic tracking-tight uppercase">My Requests</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{myRequests.length} ride request{myRequests.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <Button variant="outline" className="rounded-2xl border-border/40 font-black italic text-xs h-10" onClick={fetchMyRequests}>
                <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
              </Button>
            </div>
            {myRequests.length === 0 ? (
              <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-14 text-center">
                <CalendarCheck2 className="h-14 w-14 text-muted-foreground/20 mx-auto mb-4" />
                <p className="font-black italic text-xl text-muted-foreground">No requests yet</p>
                <p className="text-sm text-muted-foreground/50 mt-1.5">Browse rides and request a seat to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myRequests.map((request) => {
                  const ride = requestRideLookup[request.offerId];
                  const statusColors: Record<string, string> = { PENDING: "bg-amber-500/10 text-amber-500 border-amber-500/20", ACCEPTED: "bg-green-500/10 text-green-500 border-green-500/20", REJECTED: "bg-red-500/10 text-red-500 border-red-500/20" };
                  return (
                    <div key={request.id} className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2rem] p-6 flex flex-col md:flex-row md:items-center gap-5">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1.5">
                          <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                          <p className="font-black italic tracking-tight">{ride ? `${ride.from} → ${ride.to}` : "Ride details unavailable"}</p>
                        </div>
                        <p className="text-xs text-muted-foreground ml-7">{ride ? format(new Date(ride.date), "EEE, MMM d • h:mm a") : "Ride may have been removed"}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {request.status === "ACCEPTED" && ride?.driver?.id ? (
                          <Button size="sm" variant="outline" className="rounded-xl font-black italic text-xs border-border/40" onClick={() => connectViaMessages(ride.driver!.id)} disabled={connectingUserId === ride.driver!.id}>
                            {connectingUserId === ride.driver!.id ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5 mr-1.5" />}
                            Message Driver
                          </Button>
                        ) : null}
                        <span className={cn("px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border", statusColors[request.status] || "bg-muted text-muted-foreground border-border/30")}>{request.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "my-offers" && (
          <motion.div key="my-offers" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary"><Car className="h-5 w-5" /></div>
                <div>
                  <h3 className="font-black text-xl italic tracking-tight uppercase">Incoming Requests</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Students who want to join your rides</p>
                </div>
              </div>
              <Button variant="outline" className="rounded-2xl border-border/40 font-black italic text-xs h-10" onClick={fetchIncomingRequests}>
                <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
              </Button>
            </div>
            {loadingIncoming ? (
              <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-14 flex items-center justify-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm font-bold italic text-muted-foreground">Loading requests…</span>
              </div>
            ) : myOffers.length === 0 ? (
              <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-14 text-center">
                <Car className="h-14 w-14 text-muted-foreground/20 mx-auto mb-4" />
                <p className="font-black italic text-xl text-muted-foreground">No rides posted yet</p>
                <p className="text-sm text-muted-foreground/50 mt-1.5">Post a ride offer and manage incoming requests here</p>
              </div>
            ) : incomingRequests.length === 0 ? (
              <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-14 text-center">
                <Users className="h-14 w-14 text-muted-foreground/20 mx-auto mb-4" />
                <p className="font-black italic text-xl text-muted-foreground">No incoming requests yet</p>
                <p className="text-sm text-muted-foreground/50 mt-1.5">Students will appear here once they request your ride</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {incomingRequests.map((request) => {
                  const statusColors: Record<string, string> = { PENDING: "bg-amber-500/10 text-amber-500 border-amber-500/20", ACCEPTED: "bg-green-500/10 text-green-500 border-green-500/20", REJECTED: "bg-red-500/10 text-red-500 border-red-500/20" };
                  return (
                    <div key={request.id} className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2rem] p-7 space-y-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2.5 mb-1.5">
                            <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                            <p className="font-black italic tracking-tight">{request.offer ? `${request.offer.from} → ${request.offer.to}` : "Ride unavailable"}</p>
                          </div>
                          <p className="text-xs text-muted-foreground ml-6.5">{request.offer ? format(new Date(request.offer.date), "EEE, MMM d • h:mm a") : "—"}</p>
                        </div>
                        <span className={cn("px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shrink-0", statusColors[request.status] || "bg-muted text-muted-foreground border-border/30")}>{request.status}</span>
                      </div>
                      <div className="flex items-center gap-3 bg-background/30 rounded-2xl px-4 py-3 border border-border/30">
                        <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm italic shrink-0">{request.passenger?.fullName?.[0] || "?"}</div>
                        <div>
                          <p className="text-sm font-black italic tracking-tight">{request.passenger?.fullName || "Unknown"}</p>
                          {request.passenger?.username && <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">@{request.passenger.username}</p>}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        {request.status === "ACCEPTED" ? (
                          <Button size="sm" variant="outline" className="rounded-xl font-black italic text-xs border-border/40" onClick={() => connectViaMessages(request.passengerId)} disabled={connectingUserId === request.passengerId}>
                            {connectingUserId === request.passengerId ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5 mr-1.5" />}
                            Message Passenger
                          </Button>
                        ) : null}
                        {request.status === "PENDING" ? (
                          <>
                            <Button size="sm" className="rounded-xl font-black italic text-xs bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20" onClick={() => handleRequestStatusUpdate(request.id, "ACCEPTED")} disabled={updatingRequestId === request.id}>
                              {updatingRequestId === request.id ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1.5" />} Accept
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-xl font-black italic text-xs border-red-500/30 text-red-500 hover:bg-red-500/10" onClick={() => handleRequestStatusUpdate(request.id, "REJECTED")} disabled={updatingRequestId === request.id}>
                              <X className="h-3.5 w-3.5 mr-1.5" /> Reject
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
