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
      <AnimatedGradient className="left-1/4 top-0 h-96 w-96 bg-cyan-500" delay={0} />
      <AnimatedGradient
        className="right-1/4 top-20 h-80 w-80 bg-purple-600"
        delay={2}
      />
      <AnimatedGradient
        className="bottom-0 left-1/2 h-72 w-72 bg-cyan-400"
        delay={4}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-zinc-300 backdrop-blur-md">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            Powered by Stellar Soroban
          </div>
        </motion.div>

        <motion.h1
          className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <GradientText>The Decentralized AI</GradientText>
          <br />
          <span className="text-white">Inference Marketplace</span>
        </motion.h1>

        <motion.p
          className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400 sm:text-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Monetize AI APIs with Stellar. Pay per request with XLM. No
          subscriptions.
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
                className="gap-2 bg-gradient-to-r from-cyan-500 to-purple-600 px-8 py-6 text-base text-white hover:from-cyan-400 hover:to-purple-500"
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
                className="gap-2 border-white/20 px-8 py-6 text-base text-white backdrop-blur-md hover:bg-white/10"
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
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                <stat.icon className="h-5 w-5 text-cyan-400" />
              </div>
              <p className="mt-3 text-2xl font-bold text-white sm:text-3xl">
                {stat.value}
              </p>
              <p className="text-sm text-zinc-400">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
