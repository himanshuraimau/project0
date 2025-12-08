"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mic, Play, FileText, Headphones, Zap, Users, LayoutDashboard, Share2, Brain, Sparkles, GraduationCap } from "lucide-react"
import { useSession } from "@/lib/auth-client"
import Link from "next/link"

export function Hero() {
  const { data: session } = useSession()
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
      
      {/* Floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-32 right-32 w-48 h-48 rounded-full bg-secondary/20 blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 rounded-full bg-accent/30 blur-2xl animate-pulse delay-500" />
      </div>

      <div className="container relative z-10 mx-auto px-8 text-center">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <img
            src="/logo.png"
            alt="JelliNote AI"
            className="h-20 w-auto rounded-2xl  hover: transition-all duration-300 hover:scale-105"
          />
        </div>

        {/* Status badge */}
        <div className="mb-8 flex justify-center">
          <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-6 py-2 text-sm font-medium">
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered Study Revolution
          </Badge>
        </div>

        {/* Main heading */}
        <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-8 bg-gradient-to-br from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
          Transform Learning with
          <span className="block text-primary mt-4">
            JelliNote AI
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed mb-12 max-w-4xl mx-auto">
          AI-powered note-taking with smart flashcards, interactive quizzes, mindmaps, 
          and podcasts. Generate complete courses, share notes, organize in folders, and learn in 100+ languages.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
          {!session ? (
            <>
              <Link href="/sign-up">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl px-10 py-4 text-lg font-medium  hover: transition-all duration-300 hover:-translate-y-1"
                >
                  <Zap className="w-5 h-5 mr-3" />
                  Get Started Free
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-primary/30 hover:bg-primary/10 rounded-2xl px-10 py-4 text-lg font-medium hover: transition-all duration-300"
              >
                <Play className="w-5 h-5 mr-3" />
                Watch Demo
              </Button>
            </>
          ) : (
            <>
              <Link href="/dashboard">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl px-10 py-4 text-lg font-medium  hover: transition-all duration-300 hover:-translate-y-1"
                >
                  <LayoutDashboard className="w-5 h-5 mr-3" />
                  Go to Dashboard
                </Button>
              </Link>
              
              <Link href="/dashboard/folders">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-primary/30 hover:bg-primary/10 rounded-2xl px-10 py-4 text-lg font-medium hover: transition-all duration-300"
                >
                  <FileText className="w-5 h-5 mr-3" />
                  My Notes
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Feature icons */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 max-w-4xl mx-auto">
          <div className="flex flex-col items-center gap-3 group">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all duration-300">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Smart Notes</span>
          </div>
          
          <div className="flex flex-col items-center gap-3 group">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all duration-300">
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">AI Courses</span>
          </div>
          
          <div className="flex flex-col items-center gap-3 group">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all duration-300">
              <Share2 className="w-8 h-8 text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Share Notes</span>
          </div>
          
          <div className="flex flex-col items-center gap-3 group">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all duration-300">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Mindmaps</span>
          </div>

          <div className="flex flex-col items-center gap-3 group">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all duration-300">
              <Headphones className="w-8 h-8 text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Podcasts</span>
          </div>
        </div>

        {/* Social proof */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Trusted by 10,000+ students worldwide
          </p>
          <div className="flex justify-center items-center gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-primary/40" />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
