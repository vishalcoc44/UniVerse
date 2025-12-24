import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Academic from "./pages/Academic";
import EventsPage from "./pages/EventsPage";
import Feed from "./pages/Feed";
import Messages from "./pages/Messages";
import Career from "./pages/Career";
import Wellness from "./pages/Wellness";
import Travel from "./pages/Travel";
import Research from "./pages/Research";
import Forums from "./pages/Forums";
import News from "./pages/News";
import Clubs from "./pages/Clubs";
import Updates from "./pages/Updates";
import Marketplace from "./pages/Marketplace";
import Utilities from "./pages/Utilities";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/academic" element={<Academic />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/career" element={<Career />} />
          <Route path="/wellness" element={<Wellness />} />
          <Route path="/travel" element={<Travel />} />
          <Route path="/research" element={<Research />} />
          <Route path="/forums" element={<Forums />} />
          <Route path="/news" element={<News />} />
          <Route path="/clubs" element={<Clubs />} />
          <Route path="/updates" element={<Updates />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/utilities" element={<Utilities />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
