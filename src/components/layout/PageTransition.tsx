import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
	children: ReactNode;
	className?: string;
}

const variants = {
	initial: {
		opacity: 0,
		x: 100,
		scale: 0.9,
		filter: "blur(10px)"
	},
	animate: {
		opacity: 1,
		x: 0,
		scale: 1,
		filter: "blur(0px)",
		transition: {
			duration: 0.2,
			// ease: "easeInOut", // Removed to fix type error
			staggerChildren: 0.1
		}
	},
	exit: {
		opacity: 0,
		x: -100,
		scale: 0.9,
		filter: "blur(10px)",
		transition: {
			duration: 0.2,
			// ease: "easeIn" // Removed to fix type error
		}
	}
};

export const PageTransition = ({ children, className = "" }: PageTransitionProps) => {
	return (
		<motion.div
			variants={variants}
			initial="initial"
			animate="animate"
			exit="exit"
			className={`min-h-[calc(100vh-80px)] w-full ${className}`} // Adjust for navbar height if needed
		>
			{children}
		</motion.div>
	);
};
