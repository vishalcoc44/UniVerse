'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface PreviewMarqueeProps {
	images: string[];
	isVisible: boolean;
	onToggle: () => void;
	onImageClick: (index: number) => void;
}

export function PreviewMarquee({ images, isVisible, onToggle, onImageClick }: PreviewMarqueeProps) {
	if (images.length === 0) return null;

	// Double the images for seamless loop
	const marqueeImages = [...images, ...images];

	return (
		<div className="relative flex flex-col items-center group/marquee">
			{/* Preview Button with Glow */}
			<div
				className="relative cursor-pointer"
				onClick={onToggle}
			>
				<div className="absolute inset-0 bg-primary/40 blur-xl scale-125 opacity-0 group-hover/marquee:opacity-100 transition-opacity duration-500 rounded-full" />
				<div className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/40 font-bold text-[14px] z-20 transition-all hover:scale-105 active:scale-95 whitespace-nowrap border-b-2 border-primary-foreground/20">
					Preview
				</div>
			</div>

			{/* Connection Stem (The Pipe) with gradient */}
			<AnimatePresence>
				{isVisible && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 28, opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						className="absolute top-[38px] left-1/2 -translate-x-1/2 w-[3px] bg-gradient-to-b from-primary to-primary/40 z-10 origin-top"
					/>
				)}
			</AnimatePresence>

			{/* Marquee Panel - Glassmorphism */}
			<AnimatePresence>
				{isVisible && (
					<motion.div
						initial={{ y: -20, opacity: 0, scale: 0.95 }}
						animate={{ y: 0, opacity: 1, scale: 1 }}
						exit={{ y: -20, opacity: 0, scale: 0.95 }}
						transition={{ type: "spring", damping: 20, stiffness: 200 }}
						className="absolute top-[66px] left-1/2 -translate-x-1/2 w-[320px] h-24 bg-white/10 dark:bg-black/20 backdrop-blur-xl border-2 border-primary/30 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden z-20 hover:border-primary/50"
					>
						{/* Shine effect overlay */}
						<div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none z-10" />

						<motion.div
							className="flex gap-3 items-center h-full px-4"
							animate={{
								x: [0, -96 * images.length],
							}}
							transition={{
								x: {
									repeat: Infinity,
									repeatType: "loop",
									duration: images.length * 4,
									ease: "linear",
								},
							}}
							style={{ width: `${marqueeImages.length * 96}px` }}
						>
							{marqueeImages.map((src, index) => (
								<motion.div
									key={`${src}-${index}`}
									className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer relative group-hover/img:scale-110 transition-all duration-300 border border-white/5 hover:border-primary/50 shadow-lg group/img"
									onClick={() => onImageClick(index % images.length)}
								>
									<img
										src={src}
										alt={`Preview ${index}`}
										className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all"
									/>
									<div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/img:opacity-100 transition-opacity" />
								</motion.div>
							))}
						</motion.div>

						{/* Premium fading edges */}
						<div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background/80 via-background/40 to-transparent pointer-events-none z-10" />
						<div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background/80 via-background/40 to-transparent pointer-events-none z-10" />
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
