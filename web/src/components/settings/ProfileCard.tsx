"use client";

import { useState, useEffect, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon, Loading01Icon, Delete01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

async function uploadProfileImageToS3(file: File): Promise<string> {
  const res = await fetch("/api/image/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      size: file.size,
      scope: "profile",
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to get upload URL");
  }
  const { uploadUrl, publicUrl } = await res.json();
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!uploadRes.ok) throw new Error("Upload to S3 failed");
  return publicUrl;
}

interface ProfileCardProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function ProfileCard({ user }: ProfileCardProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(user.name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(
    user.name?.split(" ").slice(1).join(" ") || ""
  );
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.image ?? null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [subscriptionData, setSubscriptionData] = useState<{
    hasSubscription: boolean;
    access?: { hasAccess: boolean };
    subscription?: {
      priceId: string;
      metadata?: {
        scheduledPriceId?: string;
        scheduledPlanType?: string;
      };
    };
  } | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    
    const yearlyPriceId = process.env.NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID;
    const isYearly = subscriptionData.subscription?.priceId === yearlyPriceId;
    const scheduledToYearly = subscriptionData.subscription?.metadata?.scheduledPriceId === yearlyPriceId;
    
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

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setAvatarUploading(true);
    try {
      const url = await uploadProfileImageToS3(file);
      // Save to DB
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: url }),
      });
      if (!res.ok) throw new Error("Failed to save profile image");
      setAvatarUrl(url);
      toast.success("Profile photo updated");
    } catch {
      toast.error("Could not upload photo. Try again.");
    } finally {
      setAvatarUploading(false);
    }
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

  const handleDeleteAccount = async () => {
    // Check subscription status
    if (subscriptionData?.hasSubscription && subscriptionData?.access?.hasAccess) {
      toast.error("Please cancel your subscription before deleting your account.");
      setShowDeleteDialog(false);
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete account");
      }

      // Logout and redirect
      await signOut();
      router.push("/");
      toast.success("Account deleted successfully");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account. Please try again or contact support.");
      setIsDeleting(false);
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
          <div className="relative shrink-0 group">
            <Avatar className="size-20 rounded-2xl border-2 border-border">
              <AvatarImage src={avatarUrl ?? undefined} alt="" />
              <AvatarFallback className="rounded-2xl bg-primary/15 text-primary text-xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {/* Upload overlay */}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
              aria-label="Change profile photo"
            >
              {avatarUploading ? (
                <HugeiconsIcon icon={Loading01Icon} className="size-5 text-white animate-spin" />
              ) : (
                <span className="text-xs text-white font-medium">Change</span>
              )}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleAvatarFile}
              disabled={avatarUploading}
            />
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

        {/* Danger Zone */}
        <div className="pt-6 border-t border-border/80">
          <h3 className="text-sm font-semibold text-foreground mb-3">Danger Zone</h3>
          <Button
            onClick={() => setShowDeleteDialog(true)}
            variant="destructive"
            className="w-full h-11 rounded-xl gap-2 font-medium"
          >
            <HugeiconsIcon icon={Delete01Icon} className="size-5" />
            Delete Account
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Your account will be permanently deleted and cannot be recovered. If you have an active subscription, you must cancel it first before deleting your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
