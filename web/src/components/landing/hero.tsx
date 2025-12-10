"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Play, Sparkles } from "lucide-react"
import { useSession } from "@/lib/auth-client"
import Link from "next/link"
import Image from "next/image"

export function Hero() {
  const { data: session } = useSession()
  
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      
      {/* Glow Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-primary/20 blur-[100px] rounded-full opacity-50 pointer-events-none" />

      <div className="container relative z-10 mx-auto px-6 text-center">
        
        {/* Announcement Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border/50 backdrop-blur-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[10px] h-5">New</Badge>
          <span className="text-sm font-medium text-muted-foreground">JelliNote 2.0 is now live</span>
          <ArrowRight className="w-3 h-3 text-muted-foreground" />
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          Study smarter, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/50">
            not harder.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          The all-in-one workspace for students. Turn messy lectures into organized notes, 
          flashcards, and quizzes instantly. 
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          {!session ? (
            <>
              <Link href="/sign-up">
                <Button size="lg" className="rounded-full px-8 h-12 text-base font-medium shadow-lg shadow-primary/20">
                  Start Learning Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="rounded-full px-8 h-12 text-base font-medium bg-background/50 backdrop-blur-sm">
                <Play className="w-4 h-4 mr-2" />
                See how it works
              </Button>
            </>
          ) : (
            <Link href="/dashboard">
              <Button size="lg" className="rounded-full px-8 h-12 text-base font-medium">
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>

        {/* Dashboard Preview / Visual Anchor */}
        <div className="relative mx-auto max-w-5xl rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm shadow-2xl animate-in fade-in zoom-in-95 duration-1000 delay-300 overflow-hidden">
          <Image
            src="/hero.png"
            alt="JelliNote Dashboard Preview"
            width={1920}
            height={1080}
            className="w-full h-auto rounded-xl"
            priority
          />
        </div>

        {/* Social Proof Text */}
        <div className="mt-12 text-sm text-muted-foreground">
          Trusted by 10,000+ top students from MIT, Stanford, and Harvard
        </div>
      </div>
    </section>
  )
}