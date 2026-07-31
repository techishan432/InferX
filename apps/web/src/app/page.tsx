import { HeroSection } from "@/components/landing/hero-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { HowItWorks } from "@/components/landing/how-it-works"
import { WhyStellar } from "@/components/landing/why-stellar"
import { CTASection } from "@/components/landing/cta-section"

export default function Home() {
  return (
    <>
      <HeroSection />
      <HowItWorks />
      <FeaturesSection />
      <WhyStellar />
      <CTASection />
    </>
  )
}
