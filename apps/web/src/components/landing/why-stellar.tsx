"use client"

import { motion } from "framer-motion"
import { Clock, DollarSign, Code, Globe } from "lucide-react"
import { GradientText } from "@/components/ui/gradient-text"
import { GlassCard } from "@/components/ui/glass-card"

const benefits = [
  {
    icon: Clock,
    title: "Fast Settlement",
    description:
      "Transactions settle in 3-5 seconds on the Stellar network. No waiting for block confirmations.",
  },
  {
    icon: DollarSign,
    title: "Low Fees",
    description:
      "Stellar transaction fees are a fraction of a cent. No gas wars, no unpredictable costs.",
  },
  {
    icon: Code,
    title: "Smart Contracts",
    description:
      "Soroban smart contracts enable trustless escrow, verifiable computation, and automated payouts.",
  },
  {
    icon: Globe,
    title: "Global Payments",
    description:
      "Send and receive payments anywhere in the world, 24/7, with no intermediaries.",
  },
]

export function WhyStellar() {
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-cyan-950/10 to-zinc-950" />

      <div className="relative mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            <GradientText>Why Stellar?</GradientText>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
            The blockchain built for real-world payments and decentralized
            applications.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {benefits.map((benefit, i) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <GlassCard className="flex items-start gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-purple-500/10">
                  <benefit.icon className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {benefit.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                    {benefit.description}
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
