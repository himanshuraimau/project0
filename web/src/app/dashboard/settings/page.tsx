import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { DashboardLayout } from "@/components/dashboard"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  User, 
  Bell, 
  Globe, 
  Shield, 
  CreditCard,
  ChevronDown,
  Edit3,
  Save
} from "lucide-react"

export default async function SettingsPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Settings
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage your account preferences and settings
          </p>
        </div>

        {/* Profile Settings */}
        <Card className="rounded-3xl border-0 p-8 shadow-xl bg-card">
          <div className="flex items-center gap-4 mb-6">
            <User className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Profile</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                  JD
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Button variant="outline" className="rounded-2xl">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Change Avatar
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Full Name
                </label>
                <Input
                  defaultValue="John Doe"
                  className="rounded-2xl"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <Input
                  defaultValue="john.doe@example.com"
                  className="rounded-2xl"
                  type="email"
                />
              </div>
            </div>
            
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl px-6 py-2 font-medium">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </Card>

        {/* Subscription */}
        <Card className="rounded-3xl border-0 p-8 shadow-xl bg-card">
          <div className="flex items-center gap-4 mb-6">
            <CreditCard className="h-6 w-6 text-secondary" />
            <h2 className="text-2xl font-bold text-foreground">Subscription</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-6 bg-muted/30 rounded-2xl">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-foreground">Pro Plan</h3>
                  <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-3 py-1">
                    Active
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  Unlimited notes, advanced AI features, priority support
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Next billing: March 15, 2024
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">$19</p>
                <p className="text-sm text-muted-foreground">/month</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Button variant="outline" className="rounded-2xl">
                Change Plan
              </Button>
              <Button variant="outline" className="rounded-2xl text-destructive border-destructive hover:bg-destructive/5">
                Cancel Subscription
              </Button>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="rounded-3xl border-0 p-8 shadow-xl bg-card">
          <div className="flex items-center gap-4 mb-6">
            <Bell className="h-6 w-6 text-accent-foreground" />
            <h2 className="text-2xl font-bold text-foreground">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-2xl">
              <div>
                <h3 className="font-medium text-foreground">Email Notifications</h3>
                <p className="text-sm text-muted-foreground">Receive updates about your notes and account</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-full">
                Enabled
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-border rounded-2xl">
              <div>
                <h3 className="font-medium text-foreground">Processing Complete</h3>
                <p className="text-sm text-muted-foreground">Get notified when note processing is finished</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-full">
                Enabled
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-border rounded-2xl">
              <div>
                <h3 className="font-medium text-foreground">Weekly Summary</h3>
                <p className="text-sm text-muted-foreground">Weekly digest of your note activity</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-full text-muted-foreground">
                Disabled
              </Button>
            </div>
          </div>
        </Card>

        {/* Language & Region */}
        <Card className="rounded-3xl border-0 p-8 shadow-xl bg-card">
          <div className="flex items-center gap-4 mb-6">
            <Globe className="h-6 w-6 text-secondary" />
            <h2 className="text-2xl font-bold text-foreground">Language & Region</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Interface Language
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between rounded-2xl">
                    English (US)
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>English (US)</DropdownMenuItem>
                  <DropdownMenuItem>English (UK)</DropdownMenuItem>
                  <DropdownMenuItem>Spanish</DropdownMenuItem>
                  <DropdownMenuItem>French</DropdownMenuItem>
                  <DropdownMenuItem>German</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Default Audio Language
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between rounded-2xl">
                    English
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>English</DropdownMenuItem>
                  <DropdownMenuItem>Spanish</DropdownMenuItem>
                  <DropdownMenuItem>French</DropdownMenuItem>
                  <DropdownMenuItem>German</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Card>

        {/* Privacy & Security */}
        <Card className="rounded-3xl border-0 p-8 shadow-xl bg-card">
          <div className="flex items-center gap-4 mb-6">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Privacy & Security</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-2xl">
              <div>
                <h3 className="font-medium text-foreground">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-full text-muted-foreground">
                Disabled
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-border rounded-2xl">
              <div>
                <h3 className="font-medium text-foreground">Data Retention</h3>
                <p className="text-sm text-muted-foreground">Automatically delete old notes after specified time</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-full">
                    Never <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Never</DropdownMenuItem>
                  <DropdownMenuItem>1 Year</DropdownMenuItem>
                  <DropdownMenuItem>6 Months</DropdownMenuItem>
                  <DropdownMenuItem>3 Months</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-border rounded-2xl">
              <div>
                <h3 className="font-medium text-foreground">Download My Data</h3>
                <p className="text-sm text-muted-foreground">Export all your notes and account data</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-full">
                Export
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
