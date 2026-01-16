"use client"

import { PricingCard } from "@/components/subscription/pricing-card"
import { SubscriptionStatusCard } from "@/components/subscription/subscription-status-card"
import { Navbar } from "@/components/shared/navbar"
import { Plus_Jakarta_Sans } from "next/font/google"
import { motion } from "framer-motion"
import { Sparkles, FileText, Brain, GraduationCap } from "lucide-react"
import { useEffect, useState } from "react"

const jakarta = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin-ext", "vietnamese"],
})

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function PricingPage() {
  const [hasSubscription, setHasSubscription] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const response = await fetch('/api/subscription/status')
        if (response.ok) {
          const data = await response.json()
          setHasSubscription(data.hasSubscription)
        }
      } catch (error) {
        console.error('Failed to fetch subscription status:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscriptionStatus()
  }, [])

  return (
    <div className={`min-h-screen bg-background ${jakarta.className}`}>
      <Navbar title="Pricing" showBackToDashboard={true} />
      
      <div className="px-4 py-16 flex gap-8 max-w-[1400px] mx-auto">
        {/* Left Side - Hero and Features */}
        <div className="flex-1 ">
          {/* Hero Section */}
          <motion.div 
            className="text-center max-w-[700px] mx-auto mb-24"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-400 dark:text-purple-300">Simple Pricing</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-semibold pb-7 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-teal-500 dark:from-purple-400 dark:to-teal-400">
              Unlock Unlimited Learning
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
              One simple plan. All features included. No hidden fees.
            </p>
          </motion.div>

          {/* Features Section */}
          <motion.div 
            className="max-w-[900px] mx-auto"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="grid md:grid-cols-3 gap-6">
              <FeatureCard 
                icon={<FileText className="w-8 h-8" />}
                title="Process Anything" 
                description="PDFs, audio, YouTube videos, and web pages"
              />
              <FeatureCard 
                icon={<Brain className="w-8 h-8" />}
                title="AI-Powered Notes" 
                description="Smart notes, flashcards, and quizzes"
              />
              <FeatureCard 
                icon={<GraduationCap className="w-8 h-8" />}
                title="Create Courses" 
                description="Generate complete learning paths"
              />
            </div>
          </motion.div>
        </div>

        {/* Right Side - Pricing or Subscription Card */}
        <div className="w-[500px] shrink-0">
          {/* Pricing Section - Only show if no subscription */}
          {!loading && !hasSubscription && (
            <motion.div 
              className="sticky top-24"
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <PricingCard />
            </motion.div>
          )}

          {/* Subscription Management Section - Only show if has subscription */}
          {!loading && hasSubscription && (
            <motion.div 
              className="sticky top-24"
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <SubscriptionStatusCard />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode
  title: string
  description: string 
}) {
  return (
    <motion.div 
      className="bg-gray-50 dark:bg-[#121212] p-8 rounded-2xl text-center  /10 border border-purple-500/10 dark:border-purple-500/5 hover:border-purple-500/30 dark:hover:border-purple-500/20 transition-all duration-300 hover:-translate-y-1"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="text-purple-500 dark:text-purple-400 mb-4 flex justify-center">{icon}</div>
      <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    </motion.div>
  )
}
