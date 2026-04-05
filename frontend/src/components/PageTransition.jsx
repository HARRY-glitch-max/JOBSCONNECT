import React from "react";
import { motion } from "framer-motion";

/**
 * 🛠️ ANIMATION VARIANTS
 * Using 'variants' keeps the JSX clean and allows for staggered 
 * animations if you add children later.
 */
const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
    filter: "blur(4px)", // Adds a premium "focus" effect as it enters
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1], // Professional 'out-expo' curve
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: "blur(4px)",
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const PageTransition = ({ children }) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;