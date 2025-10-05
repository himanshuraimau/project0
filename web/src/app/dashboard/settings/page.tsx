"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import {
  User,
  Globe,
  Shield,
  ChevronRight,
  LogOut,
} from "lucide-react"

export default function SettingsPage() {
  const { userId } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!userId) {
      router.push("/sign-in")
    }
  }, [userId, router])

  const handleShareClick = async () => {
    try {
      await navigator.clipboard.writeText("www.soniclearn.ai")
      toast.success("Link copied to clipboard!", {
        duration: 3000,
        style: {
          minWidth: '400px',
          padding: '20px 24px',
          fontSize: '18px',
          fontWeight: '600',
          borderRadius: '12px',
        },
      })
    } catch (error) {
      toast.error("Failed to copy link", {
        duration: 3000,
        style: {
          minWidth: '400px',
          padding: '20px 24px',
          fontSize: '18px',
          fontWeight: '600',
          borderRadius: '12px',
        },
      })
    }
  }

  if (!userId) {
    return null
  }

  const settings: {
    icon: React.ReactNode
    label: string
    subtext?: string
    color?: string
    onClick?: () => void
  }[] = [
    { 
      icon: <Globe className="h-7 w-7 text-foreground" />, 
      label: "Share with a friend", 
      color: "text-foreground",
      onClick: handleShareClick
    },
    { icon: <Shield className="h-7 w-7 text-foreground" />, label: "Privacy Policy", color: "text-foreground" },
    { icon: <User className="h-7 w-7 text-foreground" />, label: "Manage Account", color: "text-foreground" },
    { icon: <LogOut className="h-7 w-7 text-foreground" />, label: "Sign out", subtext: "jiskhar011@gmail.com", color: "text-foreground" },
  ]

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background p-8">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Settings</h1>

        <div className="space-y-4">
          {settings.map((item, i) => (
            <Card
              key={i}
              className="flex flex-row items-center justify-between px-6 py-5 rounded-2xl transition cursor-pointer border border-gray-300 hover:border-gray-500"
              onClick={item.onClick}
            >
              <div className="flex items-center gap-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  {item.icon}
                </div>
                <div className="flex flex-col justify-center">
                  <p className={`text-lg font-semibold ${item.color || "text-foreground"}`}>
                    {item.label}
                  </p>
                  {item.subtext && (
                    <p className="text-sm text-muted-foreground">{item.subtext}</p>
                  )}
                </div>
              </div>

              <div>
                <ChevronRight className="h-6 w-6 text-muted-foreground" />
              </div>
            </Card>
          ))}

          <Card className="flex flex-row items-center justify-between px-6 py-5 rounded-2xl hover:bg-destructive/10 transition cursor-pointer border border-gray-300 hover:border-gray-500">
            <div className="flex items-center gap-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <Shield className="h-7 w-7 text-destructive" />
              </div>
              <p className="text-lg font-semibold text-destructive">Delete account</p>
            </div>
            <ChevronRight className="h-6 w-6 text-muted-foreground" />
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
