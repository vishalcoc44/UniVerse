'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion, useScroll, useTransform, animate, useInView } from "framer-motion";
import {
	ArrowRight, Check, Clock, Sparkles, Zap, Globe, BookOpen,
	Users, MessageCircle, Car, Shield, GraduationCap, Layout, MoreHorizontal, ChevronRight, MapPin
} from "lucide-react";
import { useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EventCard } from "@/components/dashboard/EventCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { PostCard } from "@/components/feed/PostCard";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { PreviewMarquee } from "@/components/landing/PreviewMarquee";
import { LightboxModal } from "@/components/landing/LightboxModal";
import { useState } from "react";

export default function Landing() {
	const { scrollY, scrollYProgress } = useScroll();
	const [showMarquee, setShowMarquee] = useState(true);
	const [isManuallyClosed, setIsManuallyClosed] = useState(false);

	useEffect(() => {
		return scrollY.onChange((latest) => {
			if (latest > 500) {
				setShowMarquee(false);
			} else {
				// Only show if the user hasn't manually closed it at the top
				setShowMarquee(!isManuallyClosed);
			}
		});
	}, [scrollY, isManuallyClosed]);

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [images, setImages] = useState<string[]>([]);
	const [activeIndex, setActiveIndex] = useState(0);

	useEffect(() => {
		fetch('/api/images')
			.then(async res => {
				if (!res.ok) {
					const errorText = await res.text();
					throw new Error(`Failed to fetch images: ${res.status} ${res.statusText} - ${errorText}`);
				}
				return res.json();
			})
			.then(data => {
				if (Array.isArray(data)) {
					setImages(data);
				} else {
					console.warn('API /api/images returned non-array data:', data);
				}
			})
			.catch(err => {
				console.error('Error fetching images:', err);
			});
	}, []);

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: { staggerChildren: 0.2 }
		}
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
	};

	return (
		<div className="min-h-screen bg-background relative overflow-hidden font-sans selection:bg-primary/20">

			{/* Background Dots Pattern & Progress Bar */}
			<motion.div style={{ scaleX: scrollYProgress }} className="fixed top-0 left-0 right-0 h-1 bg-primary z-[60] origin-left" />
			<div className="absolute inset-0 z-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50 pointer-events-none" />

			{/* Navbar */}
			<nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
				<div className="container mx-auto px-6 h-20 flex items-center justify-between">
					<Link href="/" className="flex items-center gap-2 group">
						<div className="h-9 w-9 rounded-xl overflow-hidden shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
							<img src="/universe_logo.png" alt="UniVerse Logo" className="w-full h-full object-cover" />
						</div>
						<span className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors">UniVerse</span>
					</Link>

					<div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
						<PreviewMarquee
							images={images}
							isVisible={showMarquee}
							onToggle={() => {
								const next = !showMarquee;
								setShowMarquee(next);
								if (scrollY.get() < 500) {
									setIsManuallyClosed(!next);
								}
							}}
							onImageClick={(index) => {
								setActiveIndex(index);
								setIsModalOpen(true);
							}}
						/>
						{['Features', 'How it Works', 'Community'].map((item) => (
							<a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-primary transition-colors relative group">
								{item}
								<span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
							</a>
						))}
					</div>

					<div className="flex items-center gap-3">
						<Link href="/request-university">
							<Button variant="ghost" className="hidden sm:flex font-medium text-muted-foreground hover:text-primary hover:bg-primary/5">
								Add University
							</Button>
						</Link>
						<Link href="/auth">
							<Button variant="ghost" className="font-medium hover:bg-primary/10 hover:text-primary">Sign in</Button>
						</Link>
						<Link href="/signup">
							<Button className="rounded-full px-6 font-medium shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all">
								Sign Up
							</Button>
						</Link>
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 container mx-auto px-6 z-10 min-h-screen flex flex-col justify-center">
				<div className="max-w-5xl mx-auto text-center relative">

					{/* Main Text */}
					<motion.h1
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.2 }}
						className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-8 leading-tight relative z-20"
					>
						<span className="text-blue-400 [text-shadow:0_0_10px_rgba(0,0,0,0.3)]">UniVerse - </span>Your Campus <br />
						<span className="text-blue-400 [text-shadow:0_0_10px_rgba(0,0,0,0.3)]">Super App</span>
					</motion.h1>

					<motion.p
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.4 }}
						className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed relative z-20"
					>
						Everything you need to survive and thrive at university. <br />Academics, social, career, and more—synced in real-time.
					</motion.p>

					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.5, delay: 0.6 }}
						className="flex flex-col sm:flex-row gap-4 justify-center items-center relative z-20"
					>
						<Link href="/dashboard">
							<Button size="lg" className="rounded-full h-16 px-12 text-xl shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all hover:scale-105 active:scale-95 bg-primary group">
								Launch App
								<ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
							</Button>
						</Link>

					</motion.div>

					{/* Floating Elements (Kept from previous version but enhanced) */}
					<FloatingElement delay={0} x={-20} y={-10} className="hidden lg:block -top-20 -left-32 w-52 rotate-[-6deg] opacity-60 hover:opacity-100 transition-opacity duration-300">
						<div className="bg-yellow-50 dark:bg-yellow-900/20 backdrop-blur-md border border-yellow-200 dark:border-yellow-700/30 p-5 rounded-lg shadow-lg">
							<div className="bg-red-500/20 w-3 h-3 rounded-full mx-auto mb-3" />
							<p className="font-handwriting text-foreground/80 font-medium leading-snug">
								"Physics Lab due tomorrow! Don't forget!" 📌
							</p>
						</div>
					</FloatingElement>

					<FloatingElement delay={1} x={20} y={-15} className="hidden lg:block top-0 -right-44 w-64 rotate-[3deg] opacity-60 hover:opacity-100 transition-opacity duration-300">
						<div className="bg-card p-4 rounded-2xl shadow-xl border border-border/50">
							<div className="flex items-center gap-3 mb-3">
								<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Clock className="h-4 w-4" /></div>
								<div className="text-left">
									<p className="text-xs font-bold">Upcoming Event</p>
									<p className="text-[10px] text-muted-foreground">in 10 mins</p>
								</div>
							</div>
							<div className="h-2 w-full bg-secondary rounded-full overflow-hidden"><div className="h-full w-3/4 bg-primary animate-pulse" /></div>
						</div>
					</FloatingElement>

					<FloatingElement delay={2} x={-15} y={20} className="hidden lg:block bottom-20 -left-40 w-60 rotate-[-3deg] opacity-60 hover:opacity-100 transition-opacity duration-300">
						<div className="bg-card p-5 rounded-2xl shadow-xl border border-border/50">
							<div className="flex items-center justify-between mb-3">
								<span className="font-bold text-sm">Tasks</span>
								<span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">2/3 Done</span>
							</div>
							{[1, 2, 3].map(i => (
								<div key={i} className="flex items-center gap-2 mb-2">
									<div className={`h-4 w-4 rounded border flex items-center justify-center ${i !== 3 ? 'bg-green-500 border-green-500 text-white' : 'border-border'}`}>
										{i !== 3 && <Check className="h-3 w-3" />}
									</div>
									<div className={`h-2 w-24 rounded-full ${i !== 3 ? 'bg-muted' : 'bg-primary/20'}`} />
								</div>
							))}
						</div>
					</FloatingElement>

					<FloatingElement delay={1.5} x={15} y={15} className="hidden lg:block bottom-32 -right-32 w-auto rotate-[6deg] opacity-60 hover:opacity-100 transition-opacity duration-300">
						<div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur p-4 rounded-2xl shadow-2xl border border-border/50 flex gap-4">
							{[BookOpen, MessageCircle, Car, Globe].map((Icon, i) => (
								<div key={i} className="p-2 rounded-lg bg-secondary hover:scale-110 transition-transform cursor-pointer">
									<Icon className="h-5 w-5 text-foreground/70" />
								</div>
							))}
						</div>
					</FloatingElement>

				</div>
			</section>

			{/* Features Grid Section */}
			<section id="features" className="py-32 bg-secondary/30 relative">
				<div className="container mx-auto px-6">
					<motion.div
						initial="hidden"
						whileInView="visible"
						viewport={{ once: false, amount: 0.2 }}
						variants={containerVariants}
						className="text-center max-w-3xl mx-auto mb-20"
					>
						<motion.span variants={itemVariants} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4 inline-block">
							Features
						</motion.span>
						<motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-bold mb-6">
							A complete ecosystem for your student life.
						</motion.h2>
						<motion.p variants={itemVariants} className="text-xl text-muted-foreground">
							Stop juggling 10 different apps. UniVerse connects every aspect of your campus experience.
						</motion.p>
					</motion.div>

					<motion.div
						initial="hidden"
						whileInView="visible"
						viewport={{ once: false, margin: "-100px" }}
						variants={containerVariants}
						className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
					>
						<FeatureCard
							icon={<Layout className="h-6 w-6 text-blue-500" />}
							title="Central Dashboard"
							description="Your entire day at a glance. Events, tasks, and feed all in one view."
							delay={0}
							variant="blue"
						/>
						<FeatureCard
							icon={<BookOpen className="h-6 w-6 text-violet-500" />}
							title="Academic Hub"
							description="Share notes, track assignments, and access course resources instantly."
							delay={0.1}
							variant="purple"
						/>
						<FeatureCard
							icon={<Users className="h-6 w-6 text-pink-500" />}
							title="Social Feed"
							description="Connect with peers, join clubs, and stay updated with campus news."
							delay={0.2}
							variant="pink"
						/>
						<FeatureCard
							icon={<Car className="h-6 w-6 text-orange-500" />}
							title="Ride Sharing"
							description="Find students heading your way and split the cab fare securely."
							delay={0.3}
							variant="orange"
						/>
						<FeatureCard
							icon={<GraduationCap className="h-6 w-6 text-emerald-500" />}
							title="Career Center"
							description="AI resume analysis and exclusive job opportunities for students."
							delay={0.4}
						// Default (greenish if no variant passed or add new variant logic)
						/>
						<FeatureCard
							icon={<MessageCircle className="h-6 w-6 text-cyan-500" />}
							title="Real-time Chat"
							description="Instant messaging for study groups, projects, and social circles."
							delay={0.5}
							variant="blue"
						/>
					</motion.div>
				</div>
			</section>

			{/* How it Works Section */}
			<section id="how-it-works" className="py-32 relative overflow-hidden">
				<div className="absolute inset-0 bg-primary/5 -skew-y-3 transform origin-left scale-110" />
				<div className="container mx-auto px-6 relative">
					<div className="text-center mb-20">
						<h2 className="text-4xl font-bold mb-4">How UniVerse Works</h2>
						<p className="text-muted-foreground">Seamless integration into your daily routine.</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
						{/* Connecting Line (Desktop) */}
						<div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-border z-0">
							<motion.div
								initial={{ scaleX: 0 }}
								whileInView={{ scaleX: 1 }}
								viewport={{ once: false }}
								transition={{ duration: 1.5, delay: 0.5 }}
								className="h-full bg-gradient-to-r from-primary/50 to-primary origin-left"
							/>
						</div>

						<WorkflowStep
							number="1"
							title="Connect"
							desc="Sign up with your university email to verify your student status."
							delay={0}
						/>
						<WorkflowStep
							number="2"
							title="Personalize"
							desc="Select your major, interests, and clubs to curate your feed."
							delay={0.2}
						/>
						<WorkflowStep
							number="3"
							title="Thrive"
							desc="Access tools, join discussions, and manage your life effortlessly."
							delay={0.4}
						/>
					</div>
				</div>
			</section>



			{/* DISTRIBUTED FEATURE SHOWCASE */}

			{/* 1. Academic Excellence */}
			<section className="py-24 overflow-hidden">
				<div className="container mx-auto px-6">
					<div className="flex flex-col lg:flex-row items-center gap-16">
						<div className="lg:w-1/2">
							<Badge variant="outline" className="mb-4 text-emerald-600 border-emerald-200 bg-emerald-50">Academic Success</Badge>
							<h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
								Master your schedule, <br />
								<span className="text-emerald-500">effortlessly.</span>
							</h2>
							<p className="text-xl text-muted-foreground mb-8 leading-relaxed">
								Never miss a deadline again. Our intelligent academic tracker integrates with your courses, predicting crunch times and organizing your study materials automatically.
							</p>
							<ul className="space-y-4 mb-8">
								<li className="flex items-center gap-3">
									<div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><Check className="h-3 w-3" /></div>
									<span className="text-muted-foreground">Automated deadline syncing</span>
								</li>
								<li className="flex items-center gap-3">
									<div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><Check className="h-3 w-3" /></div>
									<span className="text-muted-foreground">AI-powered study resource recommendations</span>
								</li>
							</ul>
						</div>
						<div className="lg:w-1/2 relative perspective-[1000px]">
							<motion.div
								initial={{ opacity: 0, rotateY: 20, x: 50 }}
								whileInView={{ opacity: 1, rotateY: -10, x: 0 }}
								transition={{ duration: 0.8 }}
								viewport={{ once: false, amount: 0.3 }}
								className="relative z-10"
							>
								<div className="absolute -top-10 -right-10 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 w-72 h-72 rounded-full blur-3xl" />
								<FloatingCard delay={0}>
									<div className="relative transform hover:scale-105 transition-transform duration-500">
										<DeadlineCard />
										<div className="absolute -bottom-10 -left-10 transform scale-90">
											<QuickActionMock />
										</div>
									</div>
								</FloatingCard>
							</motion.div>
						</div>
					</div>
				</div>
			</section>

			{/* 2. Campus Life & Community */}
			<section className="py-24 bg-secondary/30 overflow-hidden">
				<div className="container mx-auto px-6">
					<div className="flex flex-col lg:flex-row-reverse items-center gap-16">
						<div className="lg:w-1/2">
							<Badge variant="outline" className="mb-4 text-pink-600 border-pink-200 bg-pink-50">Vibrant Community</Badge>
							<h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
								The social heart of <br />
								<span className="text-pink-500">campus life.</span>
							</h2>
							<p className="text-xl text-muted-foreground mb-8 leading-relaxed">
								Discover events, join clubs, and connect with peers who share your interests. From study groups to hackathons, it's all happening here.
							</p>
							<div className="flex gap-4">
								<Button className="rounded-full bg-pink-500 hover:bg-pink-600">Explore Events</Button>
							</div>
						</div>
						<div className="lg:w-1/2 relative perspective-[1000px] flex justify-center">
							<motion.div
								initial={{ opacity: 0, rotateY: -20, x: -50 }}
								whileInView={{ opacity: 1, rotateY: 10, x: 0 }}
								transition={{ duration: 0.8 }}
								viewport={{ once: false, amount: 0.3 }}
								className="relative z-10"
							>
								<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-pink-500/20 to-purple-500/20 w-80 h-80 rounded-full blur-3xl" />
								<FloatingCard delay={0.5}>
									<div className="relative">
										<div className="transform rotate-[-5deg] hover:rotate-0 transition-transform duration-500 z-10 relative">
											<PostCard
												id="demo-post-1"
												author={{ id: "arts-club", name: "Campus Arts", handle: "arts_club", avatar: "", role: "Club" }}
												content="Don't miss the open mic night this Friday! 🎤🎸 #Music #CampusLife"
												timestamp="5m ago"
												stats={{ likes: 45, comments: 12, shares: 5 }}
												tags={["event", "music"]}
											/>
										</div>
										<div className="absolute -bottom-20 -right-10 transform rotate-[5deg] scale-90 hover:rotate-0 hover:scale-95 transition-all duration-500 z-20">
											<EventCard
												id="demo-event-1"
												title="Tech Talk: AI Future"
												type="Academic"
												date="Tomorrow"
												time="2:00 PM"
												location="Auditorium B"
												attendees={45}
												variant="lavender"
												status="upcoming"
											/>
										</div>
									</div>
								</FloatingCard>
							</motion.div>
						</div>
					</div>
				</div>
			</section>

			{/* 3. Wellness & Balance */}
			<section className="py-24 overflow-hidden">
				<div className="container mx-auto px-6">
					<div className="flex flex-col lg:flex-row items-center gap-16">
						<div className="lg:w-1/2">
							<Badge variant="outline" className="mb-4 text-orange-600 border-orange-200 bg-orange-50">Student Wellness</Badge>
							<h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
								Prioritize your <br />
								<span className="text-orange-500">mental peace.</span>
							</h2>
							<p className="text-xl text-muted-foreground mb-8 leading-relaxed">
								University is stressful. We help you stay balanced with daily mood tracking, wellness resources, and crisis support access right when you need it.
							</p>
						</div>
						<div className="lg:w-1/2 flex justify-center perspective-[1000px]">
							<motion.div
								initial={{ opacity: 0, scale: 0.8 }}
								whileInView={{ opacity: 1, scale: 1 }}
								transition={{ type: "spring", bounce: 0.4 }}
								viewport={{ once: false, amount: 0.3 }}
								className="relative"
							>
								<div className="absolute inset-0 bg-gradient-to-r from-orange-200 to-yellow-200 blur-2xl opacity-50 rounded-full" />
								<FloatingCard delay={1}>
									<div className="bg-card/50 backdrop-blur-xl p-8 rounded-3xl border border-border/50 shadow-2xl relative">
										<h3 className="text-lg font-semibold mb-4 text-center">How are you feeling today?</h3>
										<MoodRow />
										<div className="mt-6 flex justify-center">
											<div className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
												Your streak: 🔥 12 Days
											</div>
										</div>
									</div>
								</FloatingCard>
							</motion.div>
						</div>
					</div>
				</div>
			</section>

			{/* 4. Utilities & Logistics */}
			<section className="py-24 bg-gradient-to-b from-blue-50/50 to-transparent overflow-hidden">
				<div className="container mx-auto px-6">
					<div className="flex flex-col lg:flex-row-reverse items-center gap-16">
						<div className="lg:w-1/2">
							<Badge variant="outline" className="mb-4 text-blue-600 border-blue-200 bg-blue-50">Campus Utilities</Badge>
							<h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
								Navigate intuitively <br />
								<span className="text-blue-500">like a pro.</span>
							</h2>
							<p className="text-xl text-muted-foreground mb-8 leading-relaxed">
								From tracking the campus shuttle in real-time to finding the nearest study room. All the utility tools you need, integrated into one map.
							</p>
						</div>
						<div className="lg:w-1/2 flex justify-center perspective-[1000px]">
							<motion.div
								initial={{ opacity: 0, x: -50 }}
								whileInView={{ opacity: 1, x: 0 }}
								transition={{ duration: 0.8 }}
								viewport={{ once: false, amount: 0.3 }}
								className="relative"
							>
								<div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full" />
								<FloatingCard delay={1.5}>
									<div className="relative rotate-3 hover:rotate-0 transition-transform duration-300">
										<ShuttleCard />

										<div className="absolute top-[-20px] right-[-40px] bg-white p-3 rounded-xl shadow-lg border border-border/50 w-40 animate-bounce-slow">
											<div className="flex items-center gap-2">
												<div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
												<span className="text-xs font-bold text-foreground">Shuttle Arriving</span>
											</div>
										</div>
									</div>
								</FloatingCard>
							</motion.div>
						</div>
					</div>
				</div>
			</section>

			{/* 5. Marketplace */}
			<section className="py-24 overflow-hidden">
				<div className="container mx-auto px-6">
					<div className="flex flex-col lg:flex-row items-center gap-16">
						<div className="lg:w-1/2">
							<Badge variant="outline" className="mb-4 text-purple-600 border-purple-200 bg-purple-50">Student Marketplace</Badge>
							<h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
								Buy, sell, and trade <br />
								<span className="text-purple-500">within your campus.</span>
							</h2>
							<p className="text-xl text-muted-foreground mb-8 leading-relaxed">
								Need a textbook? Moving out? Find trusted buyers and sellers exclusively from your university network. Safe, secure, and instant.
							</p>
							<div className="flex gap-4">
								<Button variant="secondary" className="rounded-full">Browse Listings</Button>
							</div>
						</div>
						<div className="lg:w-1/2 flex justify-center perspective-[1000px]">
							<motion.div
								initial={{ opacity: 0, scale: 0.8, rotateY: 20 }}
								whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
								transition={{ duration: 0.8 }}
								viewport={{ once: false, amount: 0.3 }}
								className="relative z-10"
							>
								<div className="absolute top-0 right-0 bg-purple-500/10 w-full h-full rounded-full blur-3xl transform translate-x-10 -translate-y-10" />
								<FloatingCard delay={2}>
									<div className="transform rotate-2 hover:rotate-0 transition-all duration-300">
										<ProductCard
											product={{
												id: "1",
												title: "MacBook Pro M2 - Great Condition",
												price: 950,
												image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=400&h=300&fit=crop",
												category: "Electronics",
												condition: "Like New",
												seller: { name: "David K.", avatar: "", verified: true },
												postedAt: "2h ago"
											}}
										/>
										<div className="absolute -bottom-5 -right-5 bg-white p-4 rounded-xl shadow-lg border border-border/50">
											<div className="flex items-center gap-2 text-green-600 font-bold">
												<Check className="h-4 w-4" /> Verified Student
											</div>
										</div>
									</div>
								</FloatingCard>
							</motion.div>
						</div>
					</div>
				</div>
			</section>

			{/* 6. Research & Innovation */}
			<section className="py-24 bg-gradient-to-t from-cyan-50/30 to-transparent overflow-hidden">
				<div className="container mx-auto px-6">
					<div className="flex flex-col lg:flex-row-reverse items-center gap-16">
						<div className="lg:w-1/2">
							<Badge variant="outline" className="mb-4 text-cyan-600 border-cyan-200 bg-cyan-50">Research Hub</Badge>
							<h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
								Collaborate on <br />
								<span className="text-cyan-500">breakthroughs.</span>
							</h2>
							<p className="text-xl text-muted-foreground mb-8 leading-relaxed">
								Join cutting-edge research projects, find mentors, and publish your findings. Connect with labs and professors directly.
							</p>
						</div>
						<div className="lg:w-1/2 flex justify-center perspective-[1000px]">
							<motion.div
								initial={{ opacity: 0, x: -50 }}
								whileInView={{ opacity: 1, x: 0 }}
								transition={{ duration: 0.8 }}
								viewport={{ once: false, amount: 0.3 }}
								className="relative z-10"
							>
								<FloatingCard delay={2.5}>
									<ProjectMock />
								</FloatingCard>
							</motion.div>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-32 relative">
				<div className="container mx-auto px-6 text-center max-w-4xl">
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						whileInView={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.5 }}
						className="bg-card border border-border/50 rounded-3xl p-12 md:p-20 shadow-2xl relative overflow-hidden group"
					>
						<div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

						<h2 className="text-4xl md:text-5xl font-bold mb-6 relative z-10">Ready to transform your campus experience?</h2>
						<p className="text-xl text-muted-foreground mb-10 relative z-10">Join the fastest growing student community today.</p>

						<div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
							<Link href="/signup">
								<Button size="lg" className="rounded-full h-14 px-10 text-lg bg-primary hover:bg-primary/90">
									Create Free Account
								</Button>
							</Link>
						</div>
					</motion.div>
				</div>
			</section>

			{/* Footer */}
			<footer className="py-12 border-t border-border bg-card/50">
				<div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
					<div className="flex items-center gap-2">
						<div className="h-6 w-6 rounded overflow-hidden">
							<img src="/universe_logo.png" alt="UniVerse Logo" className="w-full h-full object-cover" />
						</div>
						<span className="font-bold">UniVerse</span>
					</div>
					<div className="flex gap-8 text-sm text-muted-foreground">
						<a href="#" className="hover:text-foreground transition-colors">Privacy</a>
						<a href="#" className="hover:text-foreground transition-colors">Terms</a>
						<a href="#" className="hover:text-foreground transition-colors">Twitter</a>
						<a href="#" className="hover:text-foreground transition-colors">Instagram</a>
					</div>
					<p className="text-sm text-muted-foreground">© 2025 UniVerse Connect. All rights reserved.</p>
				</div>
			</footer>

			<LightboxModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				images={images}
				activeIndex={activeIndex}
				onPrev={() => setActiveIndex((prev) => (prev - 1 + images.length) % images.length)}
				onNext={() => setActiveIndex((prev) => (prev + 1) % images.length)}
			/>
		</div>
	);
}

// Sub-components for cleaner code

function DeadlineCard() {
	return (
		<div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900 p-4 rounded-2xl shadow-sm w-64">
			<div className="flex justify-between items-start mb-2">
				<span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">CS301</span>
				<MoreHorizontal className="h-4 w-4 text-emerald-700/50" />
			</div>
			<h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-100 mb-1">Data Structures</h4>
			<div className="flex items-center gap-2 text-emerald-700/80 text-xs">
				<span>Jan 15 • 10:00 AM</span>
				<span className="font-bold text-emerald-600 bg-white/50 px-1.5 rounded">3 Days left</span>
			</div>
		</div>
	)
}

function QuickActionMock() {
	return (
		<div className="bg-white dark:bg-card border border-border/50 p-4 rounded-xl shadow-sm flex items-center gap-4 w-72">
			<div className="h-12 w-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 flex items-center justify-center">
				<Sparkles className="h-6 w-6" />
			</div>
			<div className="flex-1">
				<h4 className="font-semibold text-sm">Academic AI Assistant</h4>
				<p className="text-xs text-muted-foreground leading-tight mt-0.5">Get instant help with doubts & resources.</p>
			</div>
			<ChevronRight className="h-4 w-4 text-muted-foreground/50" />
		</div>
	)
}

function ShuttleCard() {
	return (
		<div className="bg-white dark:bg-card border border-border/50 p-4 rounded-xl shadow-sm w-72">
			<div className="flex items-center gap-3 mb-3">
				<div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">CL-N</div>
				<div>
					<h4 className="font-bold text-sm">Campus Loop - North</h4>
					<div className="flex items-center gap-1.5 mt-0.5">
						<span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">Arriving</span>
						<span className="text-[10px] text-muted-foreground">• ETA: 2 min</span>
					</div>
				</div>
			</div>
			<div className="flex justify-between text-xs text-muted-foreground">
				<div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Next: Student Center</div>
			</div>
		</div>
	)
}

function MoodRow() {
	return (
		<div className="bg-white dark:bg-card border border-border/50 p-3 rounded-2xl shadow-sm flex gap-2 w-auto inline-flex">
			{['😖', '😕', '😐', '🙂', '🤩'].map((emoji, i) => (
				<div key={i} className={`h-10 w-10 rounded-xl flex items-center justify-center text-xl grayscale-[0.5] hover:grayscale-0 hover:scale-110 transition-all cursor-pointer ${i === 3 ? 'bg-green-100 grayscale-0 ring-2 ring-green-500/20' : 'bg-secondary'}`}>
					{emoji}
				</div>
			))}
		</div>
	)
}

function ProjectMock() {
	return (
		<div className="w-[340px] bg-card rounded-2xl border border-border/50 shadow-xl overflow-hidden relative group">
			<div className="h-2 bg-gradient-to-r from-cyan-400 to-blue-500" />
			<div className="p-6">
				<div className="flex justify-between items-start mb-4">
					<Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">Open Research</Badge>
					<div className="bg-muted p-2 rounded-lg">
						<Zap className="h-4 w-4 text-muted-foreground" />
					</div>
				</div>
				<h3 className="font-bold text-lg mb-2 group-hover:text-cyan-600 transition-colors">Autonomous Drone Swarm Navigation</h3>
				<p className="text-sm text-muted-foreground mb-6 line-clamp-3">
					Developing decentralized algorithms for collision avoidance in high-density drone swarms using reinforcement learning.
				</p>
				<div className="flex items-center gap-3 pt-4 border-t border-border/50">
					<div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">Dr</div>
					<div>
						<p className="text-xs font-bold">Dr. Emily Chen</p>
						<p className="text-[10px] text-muted-foreground">Robotics Lab</p>
					</div>
				</div>
			</div>
			<div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
		</div>
	)
}

function FloatingElement({ children, className, x, y, delay }: { children: React.ReactNode, className?: string, x: number, y: number, delay: number }) {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1, y: [0, y, 0], x: [0, x, 0] }}
			transition={{
				opacity: { duration: 0.5, delay },
				y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay },
				x: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: delay + 0.5 }
			}}
			className={`absolute ${className}`}
		>
			{children}
		</motion.div>
	)
}


function FloatingCard({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) {
	return (
		<motion.div
			animate={{ y: [0, -10, 0] }}
			transition={{
				duration: 4,
				repeat: Infinity,
				ease: "easeInOut",
				delay: delay
			}}
		>
			{children}
		</motion.div>
	)
}

function FeatureCard({ icon, title, description, delay, variant = "default" }: { icon: React.ReactNode, title: string, description: string, delay: number, variant?: string }) {
	const variants = {
		blue: "from-blue-500/20 to-cyan-500/20 border-blue-500/20 hover:border-blue-500/50",
		purple: "from-violet-500/20 to-purple-500/20 border-violet-500/20 hover:border-violet-500/50",
		pink: "from-pink-500/20 to-rose-500/20 border-pink-500/20 hover:border-pink-500/50",
		orange: "from-orange-500/20 to-amber-500/20 border-orange-500/20 hover:border-orange-500/50",
		default: "from-primary/10 to-primary/5 border-primary/20 hover:border-primary/50"
	}

	const glowColor = variant === "blue" ? "bg-blue-500" :
		variant === "purple" ? "bg-violet-500" :
			variant === "pink" ? "bg-pink-500" :
				variant === "orange" ? "bg-orange-500" :
					"bg-primary";

	return (
		<motion.div
			variants={{
				hidden: { opacity: 0, y: 20 },
				visible: { opacity: 1, y: 0 }
			}}
			whileHover={{ y: -8, scale: 1.02 }}
			className={`
                relative p-1 rounded-3xl overflow-hidden group
                bg-gradient-to-br ${variants[variant as keyof typeof variants] || variants.default}
                backdrop-blur-xl transition-all duration-500
            `}
		>
			{/* Animated Gradient Border Layer */}
			<div className={`absolute inset-0 bg-gradient-to-r ${variants[variant as keyof typeof variants]} opacity-20 group-hover:opacity-100 transition-opacity duration-500 blur-xl`} />

			<div className="relative h-full bg-card/40 backdrop-blur-2xl p-8 rounded-[1.4rem] border border-white/10 overflow-hidden">
				{/* Glow Orb */}
				<div className={`absolute -top-10 -right-10 w-32 h-32 ${glowColor} rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />

				<div className="relative z-10">
					<div className="h-16 w-16 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-white/20 transition-all duration-300 shadow-lg">
						{icon}
					</div>

					<h3 className="text-xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 group-hover:from-foreground group-hover:to-primary transition-all duration-300">
						{title}
					</h3>

					<p className="text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">
						{description}
					</p>
				</div>

				{/* Bottom Shine */}
				<div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
			</div>
		</motion.div>
	);
}

// Add these missing components or remove checks
function WorkflowStep({ number, title, desc, delay }: { number: string, title: string, desc: string, delay: number }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			transition={{ delay, duration: 0.5 }}
			viewport={{ once: false }}
			className="relative z-10 text-center"
		>
			<div className="w-16 h-16 rounded-full bg-background border-4 border-primary flex items-center justify-center text-2xl font-bold mb-6 mx-auto shadow-lg relative z-10">
				{number}
			</div>
			<h3 className="text-xl font-bold mb-2">{title}</h3>
			<p className="text-muted-foreground">{desc}</p>
		</motion.div>
	)
}


