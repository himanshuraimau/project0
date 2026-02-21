"use client";

import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface ProfileCardProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function ProfileCard({ user }: ProfileCardProps) {
  const [firstName, setFirstName] = useState(user.name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(
    user.name?.split(" ").slice(1).join(" ") || ""
  );
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<{
    hasSubscription: boolean;
    access?: { hasAccess: boolean };
    subscription?: {
      productId: string;
      metadata?: {
        scheduledProductId?: string;
        scheduledPlanType?: string;
      };
    };
  } | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [memberSince, setMemberSince] = useState<string | null>(null);

  const displayName = user.name || "User";
  const initials =
    firstName && lastName
      ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
      : displayName.charAt(0).toUpperCase();

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          const createdAt = data?.user?.createdAt;
          if (createdAt) {
            const date = new Date(createdAt);
            setMemberSince(date.toLocaleDateString("en-US", { month: "long", year: "numeric" }));
          }
        }
      } catch (err) {
        console.error("Error fetching profile for member since:", err);
      }
    }
    fetchProfile();
  }, []);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch("/api/subscription/status");
        if (response.ok) {
          const data = await response.json();
          setSubscriptionData(data);
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      } finally {
        setLoadingSubscription(false);
      }
    }
    fetchSubscription();

    // Listen for subscription updates from other components
    const handleSubscriptionUpdate = () => {
      fetchSubscription();
    };
    window.addEventListener('subscription-updated', handleSubscriptionUpdate);

    return () => {
      window.removeEventListener('subscription-updated', handleSubscriptionUpdate);
    };
  }, []);

  const getPlanDisplay = () => {
    if (loadingSubscription) return "Loading...";
    const hasAccess = subscriptionData?.hasSubscription && subscriptionData?.access?.hasAccess;
    if (!hasAccess) return "Free Plan";
    
    const yearlyProductId = process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO_SUBSCRIPTION_YEARLY;
    const isYearly = subscriptionData.subscription?.productId === yearlyProductId;
    const scheduledToYearly = subscriptionData.subscription?.metadata?.scheduledProductId === yearlyProductId;
    
    if (scheduledToYearly && !isYearly) {
      return "Pro Plan (Monthly → Yearly)";
    }
    
    return isYearly ? "Pro Plan (Yearly)" : "Pro Plan (Monthly)";
  };

  const getPlanBadgeColor = () => {
    const hasAccess = subscriptionData?.hasSubscription && subscriptionData?.access?.hasAccess;
    if (!hasAccess) {
      return "bg-muted/50 text-muted-foreground";
    }
    return "bg-primary/10 text-primary";
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // TODO: wire to API when available
      await new Promise((r) => setTimeout(r, 600));
      toast.success("Profile updated");
    } catch {
      toast.error("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Card header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border/80 bg-muted/20">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <HugeiconsIcon icon={UserIcon} className="size-5" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Profile
        </h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Avatar & identity */}
        <div className="flex items-start gap-4 pb-6 border-b border-border/80">
          <div className="relative shrink-0">
            <Avatar className="size-20 rounded-2xl border-2 border-border">
              <AvatarImage src={user.image ?? undefined} alt="" />
              <AvatarFallback className="rounded-2xl bg-primary/15 text-primary text-xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground truncate">
              {displayName}
            </h3>
            <span className={`inline-flex mt-1.5 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getPlanBadgeColor()}`}>
              {getPlanDisplay()}
            </span>
            {memberSince && (
              <p className="mt-2 text-sm text-muted-foreground">
                Member since {memberSince}
              </p>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-foreground text-lg">
                First name
              </Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="James"
                className="h-11 rounded-xl border-border bg-muted/30 focus-visible:ring-primary/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-foreground text-lg">
                Last name
              </Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ron"
                className="h-11 rounded-xl border-border bg-muted/30 focus-visible:ring-primary/30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground text-lg">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              value={user.email ?? ""}
              disabled
              className="h-11 rounded-xl border-border bg-muted/50 text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground ">
              Email is managed by your account provider.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className="text-foreground text-lg">
              Bio
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
              className="rounded-xl border-border bg-muted/30 focus-visible:ring-primary/30 resize-none"
            />
          </div>
        </div>

        <Button
          onClick={handleSaveChanges}
          disabled={saving}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 cursor-pointer font-medium"
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
