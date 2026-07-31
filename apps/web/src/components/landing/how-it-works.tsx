"use client"

import { motion } from "framer-motion"
import {
  ServerCog,
  Search,
  CreditCard,
  ShieldCheck,
  Banknote,
} from "lucide-react"
import { GradientText } from "@/components/ui/gradient-text"

const steps = [
  {
    icon: ServerCog,
    title: "Register Endpoint",
    description: "Provider registers an AI endpoint on the marketplace.",
  },
  {
    icon: Search,
    title: "Select Model",
    description: "Consumer browses and selects an AI model.",
  },
  {
    icon: CreditCard,
    title: "Pay with XLM",
    description: "Consumer pays using Stellar XLM per request.",
  },
  {
    icon: ShieldCheck,
    title: "Escrow Routing",
    description: "Request is routed through Soroban escrow contract.",
  },
  {
    icon: Banknote,
    title: "Earn Instantly",
    description: "Provider receives XLM payment instantly on completion.",
  },
]

const stepVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.15, duration: 0.5 },
  }),
}

export function HowItWorks() {
  return (
    <section className="relative px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            <GradientText>How InferX Works</GradientText>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            From registration to payment &mdash; five simple steps.
          </p>
        </div>

        <div className="mt-16">
          <div className="hidden lg:block">
            <div className="relative flex items-center justify-between">
              <div className="absolute left-[10%] right-[10%] top-1/2 h-0.5 -translate-y-1/2 bg-gradient-to-r from-cyan-500/50 to-purple-500/50" />

              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  className="relative z-10 flex flex-col items-center text-center"
                  custom={i}
                  variants={stepVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border/50 dark:border-white/10 bg-background shadow-lg shadow-cyan-500/10">
                    <step.icon className="h-7 w-7 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="mt-3 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 text-xs font-bold text-white">
                    {i + 1}
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-1 max-w-[140px] text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-6 lg:hidden">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                className="flex items-start gap-4"
                custom={i}
                variants={stepVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
              >
                <div className="relative flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border/50 dark:border-white/10 bg-background">
                    <step.icon className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  {i < steps.length - 1 && (
                    <div className="mt-2 h-8 w-0.5 bg-gradient-to-b from-cyan-500/50 to-purple-500/50" />
                  )}
                </div>
                <div className="pt-2">
                  <div className="mb-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 text-[10px] font-bold text-white">
                    {i + 1}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
