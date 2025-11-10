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
  Sparkles,
  Share2,
  Brain,
  Folder,
  MessageSquare,
  GraduationCap
} from "lucide-react"

const features = [
  {
    icon: FileText,
    title: "Smart Note Generation",
    description: "Create comprehensive notes from PDFs, audio, video, and web content with AI-powered extraction.",
    badge: "Core Feature",
    gradient: "from-primary/20 to-primary/5"
  },
  {
    icon: GraduationCap,
    title: "AI Course Generator",
    description: "Generate complete courses with structured units, chapters, and video recommendations in seconds.",
    badge: "Featured",
    gradient: "from-violet-500/20 to-violet-500/5"
  },
  {
    icon: Share2,
    title: "Share & Collaborate",
    description: "Share notes via secure links. Recipients can preview and save copies with full content including quizzes and flashcards.",
    badge: "New",
    gradient: "from-blue-500/20 to-blue-500/5"
  },
  {
    icon: Folder,
    title: "Organize with Folders",
    description: "Keep your notes organized in custom folders with color coding and easy navigation.",
    badge: "Productivity",
    gradient: "from-green-500/20 to-green-500/5"
  },
  {
    icon: Zap,
    title: "Smart Flashcards",
    description: "Automatically generate interactive flashcards from your notes for effective memorization.",
    badge: "Study Tool",
    gradient: "from-yellow-500/20 to-yellow-500/5"
  },
  {
    icon: MessageSquare,
    title: "Interactive Quizzes",
    description: "Test your knowledge with AI-generated quizzes based on your note content.",
    badge: "Assessment",
    gradient: "from-purple-500/20 to-purple-500/5"
  },
  {
    icon: Brain,
    title: "Visual Mindmaps",
    description: "Transform complex concepts into clear mindmaps for better understanding and retention.",
    badge: "Visual Learning",
    gradient: "from-pink-500/20 to-pink-500/5"
  },
  {
    icon: Headphones,
    title: "AI Podcasts",
    description: "Convert your notes into engaging podcast-style audio for learning on the go.",
    badge: "Audio Learning",
    gradient: "from-indigo-500/20 to-indigo-500/5"
  },
  {
    icon: Languages,
    title: "100+ Languages",
    description: "Support for over 100 languages with accurate transcription and translation capabilities.",
    badge: "Global",
    gradient: "from-red-500/20 to-red-500/5"
  },
  {
    icon: Smartphone,
    title: "Cross-Platform Sync",
    description: "Access your notes seamlessly across web and mobile with real-time synchronization.",
    badge: "Everywhere",
    gradient: "from-cyan-500/20 to-cyan-500/5"
  }
]

const benefits = [
  {
    icon: Clock,
    title: "Save Time",
    description: "Reduce study preparation time by 70% with automated content processing and organization."
  },
  {
    icon: TrendingUp,
    title: "Better Retention",
    description: "Students report 15-25% improvement in knowledge retention using JelliNote AI."
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your notes are encrypted and secure. Share only what you want, when you want."
  },
  {
    icon: Sparkles,
    title: "AI-Powered",
    description: "Advanced AI adapts to your learning style and creates personalized study materials."
  }
]

export function Features() {
  return (
    <section className="py-24 bg-gradient-to-b from-background to-secondary/10">
      <div className="container mx-auto px-8">
        {/* Section header */}
        <div className="text-center mb-20">
          <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-6 py-2 text-sm font-medium mb-6">
            Powerful Features
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text text-transparent">
            Everything You Need to
            <span className="block text-primary">Excel in Your Studies</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            JelliNote AI combines cutting-edge AI technology with intuitive design to transform how you learn.
          </p>
        </div>

        {/* Main features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="group rounded-3xl border-0 p-8  hover: transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-card to-card/95 overflow-hidden relative"
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
            Why Students Choose JelliNote AI
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
