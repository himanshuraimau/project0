import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { PricingCard } from "@/components/subscription/pricing-card"
import { SubscriptionStatusCard } from "@/components/subscription/subscription-status-card"
import { Plus_Jakarta_Sans } from "next/font/google"

const jakarta = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin-ext", "vietnamese"],
})

export default async function PricingPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <div className={`min-h-screen bg-background ${jakarta.className}`}>
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        {/* Page Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full neomorphic mb-6">
            <span className="text-2xl">✨</span>
            <span className="text-sm font-semibold text-muted-foreground">Simple Pricing</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Unlock Unlimited Learning
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            One simple plan. All features included. No hidden fees.
          </p>
        </div>

        {/* Current Subscription Status */}
        <div className="max-w-2xl mx-auto mb-12">
          <SubscriptionStatusCard />
        </div>

        {/* Pricing Card */}
        <div className="max-w-xl mx-auto mb-16">
          <PricingCard />
        </div>

        {/* Key Features Grid - Simplified */}
        <div className="max-w-3xl mx-auto mt-20 mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Everything You Need</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard 
              emoji="📄"
              title="Process Anything" 
              description="PDFs, audio, YouTube videos, and web pages"
            />
            <FeatureCard 
              emoji="🤖"
              title="AI-Powered Notes" 
              description="Smart notes, flashcards, and quizzes"
            />
            <FeatureCard 
              emoji="🎓"
              title="Create Courses" 
              description="Generate complete learning paths"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ emoji, title, description }: { emoji: string; title: string; description: string }) {
  return (
    <div className="neomorphic p-8 rounded-3xl text-center hover:shadow-lg transition-all duration-300">
      <div className="text-5xl mb-4">{emoji}</div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}
