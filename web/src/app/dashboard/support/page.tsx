import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { DashboardLayout } from "@/components/dashboard"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Mail, Send } from "lucide-react"

export default async function SupportPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Help Centre
          </h1>
          <p className="text-lg text-muted-foreground">
            Find answers to common questions and get the help you need
          </p>
        </div>

        {/* Most Popular FAQs */}
        <Card className="rounded-3xl border-0 p-8 shadow-xl bg-card">
          <h2 className="text-2xl font-bold text-foreground mb-6">Most Popular</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="family-plan" className="border-border">
              <AccordionTrigger className="text-left">
                Family plan?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! We offer family plans that allow multiple users to share a subscription. 
                Family plans support up to 6 users and include all premium features for each member.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="gift-coconote" className="border-border">
              <AccordionTrigger className="text-left">
                Gift coconote?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Absolutely! You can purchase gift subscriptions for friends, family, or colleagues. 
                Gift subscriptions can be purchased for 1, 3, 6, or 12 months and can be redeemed at any time.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="language-support" className="border-border">
              <AccordionTrigger className="text-left">
                Do you support my language?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We currently support over 50 languages including English, Spanish, French, German, Italian, 
                Portuguese, Russian, Chinese, Japanese, Korean, and many more. If your language isn't supported, 
                you can request it through our feature request form.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="feature-request" className="border-border">
              <AccordionTrigger className="text-left">
                Feature request/improvement!
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We love hearing from our users! You can submit feature requests and suggestions through 
                the contact form below or email us directly. We review all suggestions and prioritize 
                features based on user demand and feasibility.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>

        {/* Recording & Notes */}
        <Card className="rounded-3xl border-0 p-8 shadow-xl bg-card">
          <h2 className="text-2xl font-bold text-foreground mb-6">Recording & Notes</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="recording-quality" className="border-border">
              <AccordionTrigger className="text-left">
                How do I improve recording quality?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                For best results, use a quiet environment, speak clearly, and ensure your microphone 
                is positioned 6-12 inches from your mouth. External microphones typically provide 
                better quality than built-in laptop mics.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="file-formats" className="border-border">
              <AccordionTrigger className="text-left">
                What file formats are supported?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We support most common audio formats including MP3, WAV, M4A, FLAC, and more. 
                For documents, we support PDF, TXT, DOCX, and direct text input.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="note-organization" className="border-border">
              <AccordionTrigger className="text-left">
                How can I organize my notes?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                You can create custom folders, use tags, and search through your notes. 
                Our AI also automatically categorizes notes to help you find them later.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>

        {/* Subscription & Payments */}
        <Card className="rounded-3xl border-0 p-8 shadow-xl bg-card">
          <h2 className="text-2xl font-bold text-foreground mb-6">Subscription & Payments</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="cancel-subscription" className="border-border">
              <AccordionTrigger className="text-left">
                How do I cancel my subscription?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                You can cancel your subscription anytime from your account settings. 
                Your subscription will remain active until the end of your current billing period.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="refund-policy" className="border-border">
              <AccordionTrigger className="text-left">
                What's your refund policy?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We offer a 30-day money-back guarantee for all new subscriptions. 
                If you're not satisfied within the first 30 days, contact us for a full refund.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="payment-methods" className="border-border">
              <AccordionTrigger className="text-left">
                What payment methods do you accept?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We accept all major credit cards (Visa, MasterCard, American Express), 
                PayPal, and Apple Pay for convenient and secure payments.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>

        {/* Support Email */}
        <Card className="rounded-3xl border-0 p-8 shadow-xl bg-card">
          <h2 className="text-2xl font-bold text-foreground mb-6">Support Email</h2>
          <div className="flex items-start gap-4 p-6 bg-muted/30 rounded-2xl">
            <Mail className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <p className="font-medium text-foreground mb-2">support@project0.com</p>
              <p className="text-muted-foreground text-sm">
                Our support team typically responds within 24 hours during business days. 
                For urgent issues, please include "URGENT" in your subject line.
              </p>
            </div>
          </div>
        </Card>

        {/* Contact Us */}
        <Card className="rounded-3xl border-0 p-8 shadow-xl bg-card">
          <h2 className="text-2xl font-bold text-foreground mb-6">Contact Us</h2>
          <div className="space-y-6">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                Subject
              </label>
              <Input
                id="subject"
                placeholder="What can we help you with?"
                className="rounded-2xl"
              />
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                Message
              </label>
              <textarea
                id="message"
                rows={6}
                placeholder="Describe your question or concern in detail..."
                className="w-full p-3 border border-border rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
              />
            </div>
            
            <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl px-8 py-3 font-medium shadow-lg hover:shadow-xl transition-all duration-300">
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
