import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AppProviders } from "@/components/providers/app-providers"
import { LayoutChrome } from "@/components/layout/layout-chrome"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "InferX - Decentralized AI Marketplace",
  description:
    "The decentralized AI inference marketplace powered by Stellar. Monetize AI APIs, pay per request with XLM, and access hundreds of AI models through one unified API.",
  keywords: ["AI", "marketplace", "Stellar", "XLM", "decentralized", "inference", "API"],
  openGraph: {
    title: "InferX - Decentralized AI Marketplace",
    description:
      "Monetize AI APIs with Stellar. Pay per request with XLM. No subscriptions.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-theme-pattern text-foreground transition-colors duration-300">
        <AppProviders>
          <LayoutChrome>{children}</LayoutChrome>
        </AppProviders>
      </body>
    </html>
  )
}
