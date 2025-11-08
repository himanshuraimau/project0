"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Mic, Sparkles } from "lucide-react"

export function CTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Dynamic gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
      
      {/* Floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-40 h-40 rounded-full bg-secondary/20 blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 rounded-full bg-accent/30 blur-2xl animate-pulse delay-500" />
      </div>

      <div className="container relative z-10 mx-auto px-8 text-center">
        {/* Badge */}
        <div className="mb-8 flex justify-center">
          <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-6 py-2 text-sm font-medium">
            <Sparkles className="w-4 h-4 mr-2" />
            Start Your Learning Revolution
          </Badge>
        </div>

        {/* Heading */}
        <h2 className="text-4xl lg:text-6xl font-bold leading-tight mb-8">
          <span className="bg-gradient-to-br from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
            Ready to Transform
          </span>
          <span className="block text-primary mt-2">
            Your Study Experience?
          </span>
        </h2>

        {/* Description */}
        <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed mb-12 max-w-3xl mx-auto">
          Join thousands of students who have revolutionized their learning with AI-powered study tools. 
          Start your free trial today.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl px-12 py-4 text-lg font-medium  hover: transition-all duration-300 hover:-translate-y-1 group"
          >
            <Mic className="w-5 h-5 mr-3 group-hover:animate-pulse" />
            Start Free Trial
            <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            className="border-2 border-primary hover:bg-primary/5 text-primary rounded-2xl px-12 py-4 text-lg font-medium hover: transition-all duration-300"
          >
            Learn More
          </Button>
        </div>

        {/* Social proof */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center group">
            <div className="text-3xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform duration-300">
              10,000+
            </div>
            <div className="text-muted-foreground">Active Students</div>
          </div>
          
          <div className="text-center group">
            <div className="text-3xl font-bold text-secondary-foreground mb-2 group-hover:scale-110 transition-transform duration-300">
              100+
            </div>
            <div className="text-muted-foreground">Languages Supported</div>
          </div>
          
          <div className="text-center group">
            <div className="text-3xl font-bold text-accent-foreground mb-2 group-hover:scale-110 transition-transform duration-300">
              25%
            </div>
            <div className="text-muted-foreground">Average Grade Improvement</div>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground mb-4">
            Trusted by students at top universities worldwide
          </p>
          <div className="flex justify-center items-center gap-8 opacity-70 hover:opacity-100 transition-opacity duration-300">
            <div className="text-2xl font-bold text-foreground hover:text-primary transition-colors duration-300 cursor-pointer">MIT</div>
            <div className="text-2xl font-bold text-foreground hover:text-primary transition-colors duration-300 cursor-pointer">Stanford</div>
            <div className="text-2xl font-bold text-foreground hover:text-primary transition-colors duration-300 cursor-pointer">Harvard</div>
            <div className="text-2xl font-bold text-foreground hover:text-primary transition-colors duration-300 cursor-pointer">Oxford</div>
          </div>
        </div>
      </div>
    </section>
  )
}
