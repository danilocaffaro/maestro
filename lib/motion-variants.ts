/**
 * Centralized motion variants for consistent animations across the app.
 * Based on best practices from Agentic Design patterns 2026.
 */

export const agentAnimations = {
  thinking: {
    opacity: [0.6, 1, 0.6],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
  working: {
    scale: [1, 1.02, 1],
    transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
  },
  success: {
    scale: [1, 1.05, 1],
    transition: { duration: 0.4 },
  },
  error: {
    x: [-3, 3, -3, 0],
    transition: { duration: 0.3 },
  },
  idle: {
    opacity: 0.7,
    transition: { duration: 0.3 },
  },
};

export const listItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, x: -8, transition: { duration: 0.15 } },
};

export const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

export const fadeIn = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export const slideIn = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.2 } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
};

export const collapseExpand = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: "auto", opacity: 1, transition: { duration: 0.2 } },
};
