"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles, Users, Cpu, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GradientText } from "@/components/ui/gradient-text"
import { AnimatedGradient } from "@/components/ui/animated-gradient"

const stats = [
  { icon: Users, value: "150+", label: "Providers" },
  { icon: Cpu, value: "500+", label: "Models" },
  { icon: Activity, value: "1M+", label: "Requests" },
]

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      <AnimatedGradient className="left-1/4 top-0 h-96 w-96 bg-cyan-500/20" delay={0} />
      <AnimatedGradient
        className="right-1/4 top-20 h-80 w-80 bg-violet-600/20"
        delay={2}
      />
      <AnimatedGradient
        className="bottom-0 left-1/2 h-72 w-72 bg-cyan-400/20"
        delay={4}
      />

      <div className="relative mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-sm font-semibold text-cyan-600 dark:text-cyan-400 backdrop-blur-md shadow-sm">
            <Sparkles className="h-4 w-4 text-cyan-500" />
            Powered by Stellar Soroban
          </div>
        </motion.div>

        <motion.h1
          className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <GradientText>The Decentralized AI</GradientText>
          <br />
          <span className="text-foreground">Inference Marketplace</span>
        </motion.h1>

        <motion.p
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Monetize AI APIs with Stellar. Pay per request with XLM. No
          subscriptions required.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Link href="/marketplace">
              <Button
                size="lg"
                variant="gradient"
                className="gap-2 px-8 py-6 text-base font-semibold shadow-lg shadow-cyan-500/20"
              >
                Explore Marketplace
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Link href="/dashboard/provider">
              <Button
                variant="outline"
                size="lg"
                className="gap-2 border-border bg-card/60 px-8 py-6 text-base text-foreground backdrop-blur-md hover:bg-accent"
              >
                Become a Provider
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-16 grid grid-cols-3 gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/20 bg-card/80 shadow-sm backdrop-blur-md">
                <stat.icon className="h-6 w-6 text-cyan-500" />
              </div>
              <p className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
