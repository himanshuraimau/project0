"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard";
import { toast } from "sonner";
import { User, Globe, Shield, ChevronRight, LogOut, X } from "lucide-react";

export default function SettingsPage() {
  const { userId } = useAuth();
  const { openUserProfile, signOut } = useClerk();
  const router = useRouter();
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!userId) {
      router.push("/sign-in");
    }
  }, [userId, router]);

  const handleShareClick = async () => {
    try {
      await navigator.clipboard.writeText("www.soniclearn.ai");
      toast.success("Link copied to clipboard!", {
        duration: 3000,
        style: {
          minWidth: "400px",
          padding: "20px 24px",
          fontSize: "18px",
          fontWeight: "600",
          borderRadius: "12px",
        },
      });
    } catch (error) {
      toast.error("Failed to copy link", {
        duration: 3000,
        style: {
          minWidth: "400px",
          padding: "20px 24px",
          fontSize: "18px",
          fontWeight: "600",
          borderRadius: "12px",
        },
      });
    }
  };

  const handlePrivacyPolicyClick = () => {
    setShowPrivacyPolicy(true);
  };

  const handleManageAccountClick = () => {
    openUserProfile();
  };

  const handleSignOutClick = () => {
    signOut(() => router.push("/"));
  };

  const handleDeleteAccountClick = () => {
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast.success(
          "Account and all data deleted successfully. You will be redirected to the sign-in page.",
          {
            duration: 5000,
            style: {
              minWidth: "400px",
              padding: "20px 24px",
              fontSize: "18px",
              fontWeight: "600",
              borderRadius: "12px",
            },
          }
        );

        // Give a moment for the toast to show, then sign out and redirect
        setTimeout(() => {
          signOut(() => {
            window.location.href = "/sign-in";
          });
        }, 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete account");
      }
    } catch (error) {
      console.error("Account deletion error:", error);
      toast.error("Failed to delete account. Please try again.", {
        duration: 3000,
        style: {
          minWidth: "400px",
          padding: "20px 24px",
          fontSize: "18px",
          fontWeight: "600",
          borderRadius: "12px",
        },
      });
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };

  if (!userId) {
    return null;
  }

  const settings: {
    icon: React.ReactNode;
    label: string;
    subtext?: string;
    color?: string;
    onClick?: () => void;
  }[] = [
    {
      icon: <span className="text-foreground font-bold text-xl">🚀</span>,
      label: "Go Unlimited — Get Pro",
      subtext: "Unlimited notes, transcripts & features",
      color: "text-foreground",
      onClick: () => router.push("/pricing"),
    },
    {
      icon: <Globe className="h-7 w-7 text-foreground" />,
      label: "Share with a friend",
      color: "text-foreground",
      onClick: handleShareClick,
    },
    {
      icon: <Shield className="h-7 w-7 text-foreground" />,
      label: "Privacy Policy",
      color: "text-foreground",
      onClick: handlePrivacyPolicyClick,
    },
    {
      icon: <User className="h-7 w-7 text-foreground" />,
      label: "Manage Account",
      color: "text-foreground",
      onClick: handleManageAccountClick,
    },
    {
      icon: <LogOut className="h-7 w-7 text-foreground" />,
      label: "Sign out",
      color: "text-foreground",
      onClick: handleSignOutClick,
    },
  ];

  return (
    <Suspense fallback={null}>
      <DashboardLayout>
        <div className="min-h-screen bg-background p-8">
          <h1 className="text-3xl font-bold mb-8 text-foreground">Settings</h1>

          <div className="space-y-4">
            {settings.map((item, i) => (
              <div
                key={i}
                className="flex flex-row items-center justify-between px-6 py-5 rounded-2xl transition-all duration-300 cursor-pointer neomorphic"
                onClick={item.onClick}
              >
                <div className="flex items-center gap-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    {item.icon}
                  </div>
                  <div className="flex flex-col justify-center">
                    <p
                      className={`text-lg font-semibold ${
                        item.color || "text-foreground"
                      }`}
                    >
                      {item.label}
                    </p>
                    {item.subtext && (
                      <p className="text-sm text-muted-foreground">
                        {item.subtext}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <ChevronRight className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            ))}

            <div
              className="flex flex-row items-center justify-between px-6 py-5 rounded-2xl transition-all duration-300 cursor-pointer neomorphic"
              onClick={handleDeleteAccountClick}
            >
              <div className="flex items-center gap-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                  <Shield className="h-7 w-7 text-destructive" />
                </div>
                <p className="text-lg font-semibold text-destructive">
                  Delete account
                </p>
              </div>
              <ChevronRight className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Privacy Policy Modal */}
        {showPrivacyPolicy && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold text-foreground">
                  Privacy Policy
                </h2>
                <button
                  onClick={() => setShowPrivacyPolicy(false)}
                  className="p-2 hover:bg-muted rounded-full transition"
                >
                  <X className="h-6 w-6 text-muted-foreground" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  <p className="text-sm text-muted-foreground mb-2">
                    Effective April 1, 2024
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Last updated August 14, 2025
                  </p>

                  <h3 className="text-xl font-semibold mb-4">Introduction</h3>
                  <p className="mb-6">
                    Welcome to SonicLearn! This Privacy Policy explains how we
                    gather, use, and manage your personal information when you
                    interact with our iOS and web applications ("SonicLearn",
                    also known as "SonicLearn: AI Note-taker" or "SonicLearn AI
                    Notes"). Our goal is to provide you with a secure and
                    seamless note-taking experience.
                  </p>

                  <h3 className="text-xl font-semibold mb-4">Who We Are</h3>
                  <p className="mb-6">
                    SonicLearn, LLC, a Delaware-incorporated Limited Liability
                    Corporation, owns and operates SonicLearn. We are a small,
                    self-funded company committed to offering a reliable,
                    user-friendly platform for your note-taking needs.
                  </p>

                  <h3 className="text-xl font-semibold mb-4">
                    Information We Collect
                  </h3>
                  <ul className="mb-6 space-y-2">
                    <li>
                      <strong>Audio Recordings and Files:</strong> We may store
                      audio recordings and files you upload, allowing you to
                      access, listen, or download them anytime.
                    </li>
                    <li>
                      <strong>App Usage Data:</strong> We collect basic
                      information needed to run the app effectively, including
                      analytics such as the number of notes you create. This
                      helps us improve SonicLearn over time.
                    </li>
                  </ul>

                  <h3 className="text-xl font-semibold mb-4">
                    Third-Party Services
                  </h3>
                  <p className="mb-4">
                    To operate SonicLearn efficiently, we rely on third-party
                    services, including:
                  </p>
                  <ul className="mb-6 space-y-1">
                    <li>
                      Mixpanel —{" "}
                      <a
                        href="https://mixpanel.com/legal/privacy-policy/"
                        className="text-blue-600 hover:underline"
                      >
                        https://mixpanel.com/legal/privacy-policy/
                      </a>
                    </li>
                    <li>
                      RevenueCat —{" "}
                      <a
                        href="https://www.revenuecat.com/privacy/"
                        className="text-blue-600 hover:underline"
                      >
                        https://www.revenuecat.com/privacy/
                      </a>
                    </li>
                    <li>
                      Stripe —{" "}
                      <a
                        href="https://stripe.com/privacy"
                        className="text-blue-600 hover:underline"
                      >
                        https://stripe.com/privacy
                      </a>
                    </li>
                  </ul>
                  <p className="mb-6">
                    These third parties may collect and process data on our
                    behalf. Please refer to their respective privacy policies to
                    understand how they handle information.
                  </p>
                  <p className="mb-6">
                    We do not use your personal data to train our AI models.
                    However, third-party services may use your data
                    independently to improve their own models. While we choose
                    providers that respect privacy, we cannot control their
                    independent practices.
                  </p>

                  <h3 className="text-xl font-semibold mb-4">Your Rights</h3>
                  <ul className="mb-6 space-y-2">
                    <li>
                      <strong>Data Deletion:</strong> You may request deletion
                      of all your information from our systems at any time.
                    </li>
                    <li>
                      <strong>Contact:</strong> For any inquiries, reach out to
                      us at help@soniclearn.app.
                    </li>
                  </ul>

                  <h3 className="text-xl font-semibold mb-4">
                    Access to Personal Information
                  </h3>
                  <p className="mb-6">
                    In certain circumstances, such as mergers, acquisitions, or
                    sales of assets, your personal information may be
                    transferred to affiliates or third parties. This includes
                    events like bankruptcy or corporate restructuring.
                  </p>

                  <h3 className="text-xl font-semibold mb-4">
                    Updates to This Policy
                  </h3>
                  <p className="mb-6">
                    We may update this Privacy Policy periodically by posting a
                    new version with a revised “Last updated” date. Continuing
                    to use SonicLearn after updates indicates your acceptance of
                    the changes.
                  </p>

                  <h3 className="text-xl font-semibold mb-4">
                    Contact Information
                  </h3>
                  <p className="mb-4">
                    If you have questions or need help, please contact us:
                  </p>
                  <p className="mb-6">
                    Email:{" "}
                    <a
                      href="mailto:help@soniclearn.app"
                      className="text-blue-600 hover:underline"
                    >
                      help@soniclearn.app
                    </a>
                  </p>

                  <p className="text-center font-medium">
                    Thank you for using SonicLearn. We appreciate you!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Account Confirmation Modal */}
        {showDeleteConfirmation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-md w-full overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold text-destructive">
                  Delete Account
                </h2>
                <button
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="p-2 hover:bg-muted rounded-full transition"
                  disabled={isDeleting}
                >
                  <X className="h-6 w-6 text-muted-foreground" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-foreground mb-4">
                  Are you sure you want to delete your account? This action
                  cannot be undone and will permanently remove:
                </p>
                <ul className="text-foreground mb-4 ml-4 space-y-1 text-sm">
                  <li>• All your notes and transcripts</li>
                  <li>• All courses, quizzes, and flashcards</li>
                  <li>• All mindmaps</li>
                  <li>• Your credit balance and purchase history</li>
                  <li>• Your entire account from our system</li>
                </ul>
                <p className="text-destructive text-sm font-medium mb-4">
                  This deletion is permanent and cannot be recovered.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowDeleteConfirmation(false)}
                    className="px-4 py-2 text-foreground bg-muted hover:bg-muted/80 rounded-lg transition"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 text-white bg-destructive hover:bg-destructive/90 rounded-lg transition flex items-center gap-2"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Deleting...
                      </>
                    ) : (
                      "Delete Account"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </Suspense>
  );
}
