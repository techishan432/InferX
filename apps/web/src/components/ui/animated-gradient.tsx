"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimatedGradientProps {
  className?: string
  delay?: number
  duration?: number
}

export function AnimatedGradient({
  className,
  delay = 0,
  duration = 8,
}: AnimatedGradientProps) {
  return (
    <motion.div
      className={cn(
        "absolute rounded-full blur-3xl opacity-20",
        className
      )}
      animate={{
        x: [0, 30, -20, 0],
        y: [0, -20, 30, 0],
        scale: [1, 1.1, 0.9, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  )
}
