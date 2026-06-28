import React from "react";
import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  id: string;
  illustrationType: "tasks" | "schedule" | "recommendations" | "generic";
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  id,
  illustrationType,
  title,
  description,
  action,
}: EmptyStateProps) {
  // Render a custom abstract vector illustration depending on the type
  const renderIllustration = () => {
    switch (illustrationType) {
      case "tasks":
        return (
          <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
            {/* Background glowing orb */}
            <motion.div
              className="absolute w-32 h-32 rounded-full bg-amber-500/10 blur-2xl"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.6, 0.8, 0.6],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            {/* Vector Illustration */}
            <svg
              className="w-32 h-32 text-amber-500/80"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Folder/Clipboard backing */}
              <motion.rect
                x="30"
                y="35"
                width="60"
                height="65"
                rx="8"
                stroke="currentColor"
                strokeWidth="2"
                className="text-slate-700"
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
              <motion.path
                d="M45 35V30H75V35"
                stroke="currentColor"
                strokeWidth="2"
                className="text-slate-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              />
              {/* Lines representing missing tasks */}
              <motion.path
                d="M45 55H75"
                stroke="currentColor"
                strokeWidth="2"
                className="text-slate-800"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              />
              <motion.path
                d="M45 68H75"
                stroke="currentColor"
                strokeWidth="2"
                className="text-slate-800"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              />
              <motion.path
                d="M45 81H65"
                stroke="currentColor"
                strokeWidth="2"
                className="text-slate-800"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              />
              {/* Sparkle representing a clean slate */}
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.2, 1], opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <path
                  d="M85 30L87.5 35L92.5 37.5L87.5 40L85 45L82.5 40L77.5 37.5L82.5 35L85 30Z"
                  fill="#f59e0b"
                />
                <circle cx="85" cy="37.5" r="8" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" className="animate-spin" style={{ transformOrigin: "85px 37.5px" }} />
              </motion.g>
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.2, 1], opacity: 1 }}
                transition={{ delay: 1, duration: 0.6 }}
              >
                <path
                  d="M25 70L27 74L31 76L27 78L25 82L23 78L19 76L23 74L25 70Z"
                  fill="#14b8a6"
                />
              </motion.g>
            </svg>
          </div>
        );

      case "schedule":
        return (
          <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
            {/* Background glowing orb */}
            <motion.div
              className="absolute w-32 h-32 rounded-full bg-teal-500/10 blur-2xl"
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.5, 0.7, 0.5],
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            {/* Vector Illustration */}
            <svg
              className="w-32 h-32 text-teal-500/80"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer circular orbit */}
              <motion.circle
                cx="60"
                cy="60"
                r="42"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-slate-800"
                strokeDasharray="4 4"
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              />
              {/* Inner chronological path */}
              <motion.circle
                cx="60"
                cy="60"
                r="28"
                stroke="currentColor"
                strokeWidth="2"
                className="text-slate-700"
                initial={{ strokeDasharray: "0 180" }}
                animate={{ strokeDasharray: "140 40" }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
              {/* Clock face backing */}
              <motion.circle
                cx="60"
                cy="60"
                r="18"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-slate-600"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6 }}
              />
              {/* Clock hands */}
              <motion.line
                x1="60"
                y1="60"
                x2="60"
                y2="48"
                stroke="#14b8a6"
                strokeWidth="2"
                strokeLinecap="round"
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "60px 60px" }}
              />
              <motion.line
                x1="60"
                y1="60"
                x2="70"
                y2="60"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="text-slate-400"
                animate={{ rotate: 30 }}
                transition={{ duration: 1 }}
                style={{ transformOrigin: "60px 60px" }}
              />
              {/* Floating stars */}
              <motion.circle
                cx="25"
                cy="40"
                r="3"
                fill="#f59e0b"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.circle
                cx="95"
                cy="75"
                r="2"
                fill="#14b8a6"
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              />
            </svg>
          </div>
        );

      case "recommendations":
        return (
          <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
            {/* Background glowing orb */}
            <motion.div
              className="absolute w-32 h-32 rounded-full bg-amber-500/10 blur-2xl"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.7, 0.5],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            {/* Vector Illustration */}
            <svg
              className="w-32 h-32 text-amber-500/80"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Compass or path guide backing */}
              <motion.rect
                x="32"
                y="32"
                width="56"
                height="56"
                rx="28"
                stroke="currentColor"
                strokeWidth="2"
                className="text-slate-800"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
              />
              {/* Mountain or road lines representing a roadmap */}
              <motion.path
                d="M40 75L55 52L68 66L80 48"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-slate-700"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              />
              {/* Golden navigation stars */}
              <motion.path
                d="M60 20L62 25L67 27L62 29L60 34L58 29L53 27L58 25L60 20Z"
                fill="#f59e0b"
                animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.path
                d="M85 45L86.5 48.5L90 50L86.5 51.5L85 55L83.5 51.5L80 50L83.5 48.5L85 45Z"
                fill="#f59e0b"
                animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              />
              {/* Compass pointer */}
              <motion.polygon
                points="60,45 64,60 60,56 56,60"
                fill="#14b8a6"
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformOrigin: "60px 53px" }}
              />
            </svg>
          </div>
        );

      case "generic":
      default:
        return (
          <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
            {/* Background glowing orb */}
            <motion.div
              className="absolute w-32 h-32 rounded-full bg-slate-700/10 blur-2xl"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.7, 0.5],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            {/* Vector Illustration */}
            <svg
              className="w-32 h-32 text-slate-500"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="35"
                y="35"
                width="50"
                height="50"
                rx="12"
                stroke="currentColor"
                strokeWidth="2"
                className="text-slate-800"
              />
              <circle cx="60" cy="60" r="12" stroke="currentColor" strokeWidth="2" className="text-slate-700" />
            </svg>
          </div>
        );
    }
  };

  return (
    <motion.div
      id={id}
      className="bg-slate-800/40 border border-slate-700/50 border-dashed rounded-xl py-12 px-6 text-center space-y-6 max-w-lg mx-auto shadow-xl shadow-black/5"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
    >
      {renderIllustration()}

      <div className="space-y-2">
        <h4 className="font-bold text-white text-base tracking-tight">{title}</h4>
        <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
          {description}
        </p>
      </div>

      {action && (
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}
