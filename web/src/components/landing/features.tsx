"use client"

import { 
  FileText, 
  Brain, 
  Share2, 
  Mic, 
  Languages, 
  Zap,
  FolderOpen
} from "lucide-react"

export function Features() {
  return (
    <section className="py-24 md:py-32 relative">
      <div className="container mx-auto px-6">
        
        <div className="mb-16 md:mb-24">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
            Everything you need <br/>
            <span className="text-muted-foreground">to ace your exams.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl">
            JelliNote handles the busy work so you can focus on actually understanding the material.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          
          {/* Feature 1: Large Card (Spans 2 columns) */}
          <div className="md:col-span-2 rounded-3xl bg-secondary/30 border border-border/50 p-8 md:p-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
              <FileText className="w-64 h-64" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                <FileText className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Smart Note Generation</h3>
              <p className="text-muted-foreground max-w-md">
                Upload PDFs, record lectures, or paste links. We extract the key concepts and 
                format them into beautiful, readable notes automatically.
              </p>
            </div>
          </div>

          {/* Feature 2: Tall Card */}
          <div className="md:row-span-2 rounded-3xl bg-secondary/30 border border-border/50 p-8 md:p-12 relative overflow-hidden group">
            <div className="absolute bottom-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Brain className="w-48 h-48" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Active Recall</h3>
              <p className="text-muted-foreground mb-6">
                Stop passively reading. JelliNote turns your content into:
              </p>
              <ul className="space-y-3 text-muted-foreground font-medium">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  Interactive Quizzes
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  Smart Flashcards
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  Spaced Repetition
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 3: Standard Card */}
          <div className="rounded-3xl bg-secondary/30 border border-border/50 p-8 group hover:bg-secondary/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
              <Mic className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Audio to Text</h3>
            <p className="text-sm text-muted-foreground">
              Record your lectures. We'll transcribe them and highlight what's important.
            </p>
          </div>

          {/* Feature 4: Standard Card */}
          <div className="rounded-3xl bg-secondary/30 border border-border/50 p-8 group hover:bg-secondary/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
              <Share2 className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Collaboration</h3>
            <p className="text-sm text-muted-foreground">
              Share folders with classmates. Study together in real-time.
            </p>
          </div>

          {/* Feature 5: Wide Card */}
          <div className="md:col-span-2 rounded-3xl bg-secondary/30 border border-border/50 p-8 flex flex-col md:flex-row md:items-center gap-6 group hover:bg-secondary/40 transition-colors">
            <div className="flex-1">
              <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center mb-4">
                <Languages className="w-5 h-5 text-pink-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Polyglot Learning</h3>
              <p className="text-muted-foreground">
                Study in your native language. Instant translation and support for over 100+ languages.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-background/50 px-4 py-2 rounded-full border border-border/50">
               <span className="text-foreground">Supports:</span>
               <span>English</span>
               <span>•</span>
               <span>Spanish</span>
               <span>•</span>
               <span>Mandarin</span>
               <span>•</span>
               <span>Hindi</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}