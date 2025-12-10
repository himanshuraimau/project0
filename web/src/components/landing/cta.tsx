"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function CTA() {
  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10 text-center">
        <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-8 max-w-3xl mx-auto">
          Ready to unlock your <br />
          full potential?
        </h2>
        
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          Join the community of students who have simplified their study routine and boosted their grades.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/sign-up">
            <Button size="lg" className="rounded-full px-10 h-14 text-lg">
              Get Started for Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-4 sm:mt-0 sm:absolute sm:-bottom-12">
            No credit card required • Free tier forever
          </p>
        </div>
      </div>
    </section>
  )
}