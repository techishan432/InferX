"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GradientText } from "@/components/ui/gradient-text"

export function CTASection() {
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-950/30 to-purple-950/30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.1)_0%,transparent_70%)]" />

      <motion.div
        className="relative mx-auto max-w-3xl text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          <GradientText>Ready to Get Started?</GradientText>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-400">
          Join the decentralized AI marketplace today. Start earning or
          consuming AI inference with Stellar.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
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
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link href="/dashboard/provider">
              <Button
                variant="outline"
                size="lg"
                className="gap-2 border-white/20 px-8 py-6 text-base text-white hover:bg-white/10"
              >
                Become a Provider
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
