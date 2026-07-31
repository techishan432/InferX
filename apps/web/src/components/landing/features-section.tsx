"use client"

import { motion } from "framer-motion"
import {
  Plug,
  Shield,
  Zap,
  Globe,
  Lock,
  Server,
} from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { GradientText } from "@/components/ui/gradient-text"

const features = [
  {
    icon: Plug,
    title: "OpenAI Compatible",
    description:
      "Drop-in replacement for OpenAI API. Switch providers with zero code changes.",
  },
  {
    icon: Shield,
    title: "Soroban Powered",
    description:
      "Smart contracts on Stellar Soroban ensure trustless, verifiable transactions.",
  },
  {
    icon: Zap,
    title: "Instant XLM Payments",
    description:
      "Pay per request with XLM. Settlement in seconds, not days.",
  },
  {
    icon: Globe,
    title: "Decentralized Marketplace",
    description:
      "Open marketplace connecting AI providers and consumers globally.",
  },
  {
    icon: Lock,
    title: "Secure API Encryption",
    description:
      "End-to-end encryption for all API requests. Your data stays private.",
  },
  {
    icon: Server,
    title: "Multi-Provider Support",
    description:
      "Access hundreds of AI models from multiple providers through one unified API.",
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export function FeaturesSection() {
  return (
    <section className="relative px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            <GradientText>Built for the Future</GradientText>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
            Everything you need to build, deploy, and monetize AI inference at
            scale.
          </p>
        </div>

        <motion.div
          className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={cardVariants}>
              <GlassCard className="group relative h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/30">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-cyan-500/10">
                    <feature.icon className="h-6 w-6 text-cyan-400" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    {feature.description}
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
