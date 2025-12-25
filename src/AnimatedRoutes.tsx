import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
// import Index from "./pages/Index"; // Removed as file is missing and seemingly unused
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import RequestUniversity from "./pages/RequestUniversity";
import NotFound from "./pages/NotFound";
import Feed from "./pages/Feed";
import Landing from "./pages/Landing";
import DashboardHome from "./pages/DashboardHome";
import Academic from "./pages/Academic";
import EventsPage from "./pages/EventsPage";
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
import { PageTransition } from "./components/layout/PageTransition";

export default function AnimatedRoutes() {
	const location = useLocation();

	return (
		<AnimatePresence mode="wait">
			<Routes location={location} key={location.pathname}>
				<Route path="/" element={<PageTransition><Landing /></PageTransition>} />
				<Route path="/auth" element={<PageTransition><Login /></PageTransition>} />
				<Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />
				<Route path="/request-university" element={<PageTransition><RequestUniversity /></PageTransition>} />
				<Route path="/dashboard" element={<PageTransition><DashboardHome /></PageTransition>} />
				<Route path="/academic" element={<PageTransition><Academic /></PageTransition>} />
				<Route path="/events" element={<PageTransition><EventsPage /></PageTransition>} />
				<Route path="/feed" element={<PageTransition><Feed /></PageTransition>} />
				<Route path="/messages" element={<PageTransition><Messages /></PageTransition>} />
				<Route path="/career" element={<PageTransition><Career /></PageTransition>} />
				<Route path="/wellness" element={<PageTransition><Wellness /></PageTransition>} />
				<Route path="/travel" element={<PageTransition><Travel /></PageTransition>} />
				<Route path="/research" element={<PageTransition><Research /></PageTransition>} />
				<Route path="/forums" element={<PageTransition><Forums /></PageTransition>} />
				<Route path="/news" element={<PageTransition><News /></PageTransition>} />
				<Route path="/clubs" element={<PageTransition><Clubs /></PageTransition>} />
				<Route path="/updates" element={<PageTransition><Updates /></PageTransition>} />
				<Route path="/marketplace" element={<PageTransition><Marketplace /></PageTransition>} />
				<Route path="/utilities" element={<PageTransition><Utilities /></PageTransition>} />
				<Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
				<Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
			</Routes>
		</AnimatePresence>
	);
}
