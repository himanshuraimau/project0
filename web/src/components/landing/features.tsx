"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Mic, 
  FileText, 
  Zap, 
  Headphones, 
  Languages, 
  Smartphone,
  Clock,
  TrendingUp,
  Shield,
  Sparkles 
} from "lucide-react"

const features = [
  {
    icon: Mic,
    title: "One-Tap Recording",
    description: "Record lectures with a single tap and let AI automatically generate comprehensive notes.",
    badge: "Core Feature",
    gradient: "from-primary/20 to-primary/5"
  },
  {
    icon: FileText,
    title: "Smart Content Conversion",
    description: "Transform audio, video, and PDF files into organized study materials instantly.",
    badge: "AI-Powered",
    gradient: "from-secondary/20 to-secondary/5"
  },
  {
    icon: Zap,
    title: "Automated Flashcards",
    description: "Generate engaging flashcards for active recall learning from any content.",
    badge: "Study Tool",
    gradient: "from-success/20 to-success/5"
  },
  {
    icon: Headphones,
    title: "Podcast Conversion",
    description: "Convert your study materials into audio podcasts for learning on-the-go.",
    badge: "Audio Learning",
    gradient: "from-primary/20 to-primary/5"
  },
  {
    icon: Languages,
    title: "100+ Languages",
    description: "Support for over 100 languages with accurate transcription and translation.",
    badge: "Global",
    gradient: "from-secondary/20 to-secondary/5"
  },
  {
    icon: Smartphone,
    title: "Cross-Platform",
    description: "Available on web and mobile with seamless synchronization across devices.",
    badge: "Everywhere",
    gradient: "from-success/20 to-success/5"
  }
]

const benefits = [
  {
    icon: Clock,
    title: "Save Time",
    description: "Reduce study preparation time by 70% with automated content processing."
  },
  {
    icon: TrendingUp,
    title: "Better Grades",
    description: "Students report average grade improvements of 15-25% using Project0."
  },
  {
    icon: Shield,
    title: "Honor Code Compliant",
    description: "Designed to support learning while maintaining academic integrity."
  },
  {
    icon: Sparkles,
    title: "Personalized Learning",
    description: "AI adapts to your learning style and optimizes content accordingly."
  }
]

export function Features() {
  return (
    <section className="py-24 bg-gradient-to-b from-background to-secondary/10">
      <div className="container mx-auto px-8">
        {/* Section header */}
        <div className="text-center mb-20">
          <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-6 py-2 text-sm font-medium mb-6">
            Core Features
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text text-transparent">
            Everything You Need to
            <span className="block text-primary">Supercharge Learning</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            Powered by advanced AI, Project0 transforms how you capture, process, and review study materials.
          </p>
        </div>

        {/* Main features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="group rounded-3xl border-0 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-card to-card/95 overflow-hidden relative"
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <CardContent className="p-0 relative z-10">
                {/* Icon and badge */}
                <div className="flex items-start justify-between mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <Badge variant="secondary" className="rounded-full text-xs">
                    {feature.badge}
                  </Badge>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits section */}
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold mb-12 text-foreground">
            Why Students Choose Project0
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center group">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                <benefit.icon className="w-10 h-10 text-primary" />
              </div>
              <h4 className="text-lg font-semibold mb-3 text-foreground">
                {benefit.title}
              </h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
