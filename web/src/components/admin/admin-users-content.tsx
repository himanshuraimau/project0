"use client";

import React, { useEffect, useState, useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserIcon,
  Mail01Icon,
  CrownIcon,
  UserMultiple02Icon,
  Search01Icon,
  Calendar03Icon,
  SparklesIcon,
  Delete01Icon,
  Download01Icon,
} from "@hugeicons/core-free-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  createdAt: string;
  isPremium: boolean;
  subscriptionStatus: string | null;
  hasSubscription: boolean;
  onboarding: {
    isCompleted: boolean;
    currentStep: number;
    source: string | null;
    userType: string | null;
    role: string | null;
    studyIntensity: string | null;
  } | null;
}

function escapeCsvField(value: string | null | undefined): string {
  if (value == null) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n"))
    return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadUsersCsv(users: AdminUser[], filename: string) {
  const headers = [
    "Name",
    "Email",
    "Role",
    "Created At",
    "Plan",
    "Subscription Status",
    "Onboarding Role",
    "User Type",
    "Study Intensity",
  ];
  const rows = users.map((u) => [
    escapeCsvField(u.name),
    escapeCsvField(u.email),
    escapeCsvField(u.role),
    u.createdAt ? new Date(u.createdAt).toISOString() : "",
    u.isPremium ? "Premium" : "Free",
    escapeCsvField(u.subscriptionStatus),
    escapeCsvField(u.onboarding?.role),
    escapeCsvField(u.onboarding?.userType),
    escapeCsvField(u.onboarding?.studyIntensity),
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-4 sm:px-6 border-b border-border/40 last:border-0">
      <div className="h-10 w-10 rounded-full skeleton-base shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 w-32 skeleton-base rounded" />
        <div className="h-3 w-48 skeleton-base rounded" />
      </div>
      <div className="h-6 w-16 skeleton-base rounded-full shrink-0" />
    </div>
  );
}

export function AdminUsersContent() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | "paid" | "free">("all");
  const [roleFilter, setRoleFilter] = useState<"all" | "parent" | "student">(
    "all",
  );
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/admin/users");
        if (!res.ok) {
          if (res.status === 403) {
            setError("Access denied.");
            return;
          }
          throw new Error("Failed to load users");
        }
        const data = await res.json();
        setUsers(data.users ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    let result = users;

    // Search by name or email
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          (u.name && u.name.toLowerCase().includes(q)),
      );
    }

    // Filter by plan (paid / free)
    if (planFilter === "paid") {
      result = result.filter((u) => u.isPremium);
    } else if (planFilter === "free") {
      result = result.filter((u) => !u.isPremium);
    }

    // Filter by onboarding role (parent / student)
    if (roleFilter !== "all") {
      result = result.filter(
        (u) => u.onboarding?.role?.toLowerCase() === roleFilter,
      );
    }

    return result;
  }, [users, search, planFilter, roleFilter]);

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete user");
      }
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setDeleteTarget(null);
      toast.success("User account deleted successfully.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete user.");
    } finally {
      setDeletingId(null);
    }
  };

  const stats = useMemo(() => {
    const total = users.length;
    const premium = users.filter((u) => u.isPremium).length;
    const free = total - premium;
    return { total, premium, free };
  }, [users]);

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4">
        <Card className="max-w-md w-full border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-destructive font-medium text-center">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Premium header */}
      <div className="relative overflow-hidden">
        <div className="relative">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Admin
              </h1>
              <p className=" text-muted-foreground">
                User management & insights
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/40 bg-card/80 shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <HugeiconsIcon icon={UserMultiple02Icon} className="size-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  {loading ? "—" : stats.total}
                </p>
                <p className="text-sm text-muted-foreground">Total users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/80 shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-(--color-success)/15 text-(--color-success)">
                <HugeiconsIcon icon={CrownIcon} className="size-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  {loading ? "—" : stats.premium}
                </p>
                <p className="text-sm text-muted-foreground">Premium</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/80 shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <HugeiconsIcon icon={UserIcon} className="size-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  {loading ? "—" : stats.free}
                </p>
                <p className="text-sm text-muted-foreground">Free</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Download CSV buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={loading || stats.premium === 0}
          onClick={() => {
            const paid = users.filter((u) => u.isPremium);
            downloadUsersCsv(paid, `paid-users-${new Date().toISOString().slice(0, 10)}.csv`);
            toast.success("Paid users CSV downloaded.");
          }}
        >
          <HugeiconsIcon icon={Download01Icon} className="size-4" />
          Download paid users (CSV)
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={loading || stats.free === 0}
          onClick={() => {
            const free = users.filter((u) => !u.isPremium);
            downloadUsersCsv(free, `free-users-${new Date().toISOString().slice(0, 10)}.csv`);
            toast.success("Free users CSV downloaded.");
          }}
        >
          <HugeiconsIcon icon={Download01Icon} className="size-4" />
          Download free users (CSV)
        </Button>
      </div>

      {/* Users table card */}
      <Card className="border-border/40 bg-card shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-muted/20 px-4 py-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold text-foreground">
              All users
            </CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 w-full sm:w-auto">
              <div className="flex items-center rounded-full bg-muted/70 p-1 w-full sm:w-auto max-w-xs">
                <button
                  type="button"
                  onClick={() => setPlanFilter("all")}
                  className={cn(
                    "flex-1 px-3 py-1 text-xs sm:text-sm rounded-full border border-transparent text-muted-foreground hover:text-foreground transition-colors",
                    planFilter === "all" &&
                      "bg-background text-foreground border-border shadow-sm",
                  )}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setPlanFilter("paid")}
                  className={cn(
                    "flex-1 px-3 py-1 text-xs sm:text-sm rounded-full border border-transparent text-muted-foreground hover:text-foreground transition-colors",
                    planFilter === "paid" &&
                      "bg-background text-foreground border-border shadow-sm",
                  )}
                >
                  Pro
                </button>
                <button
                  type="button"
                  onClick={() => setPlanFilter("free")}
                  className={cn(
                    "flex-1 px-3 py-1 text-xs sm:text-sm rounded-full border border-transparent text-muted-foreground hover:text-foreground transition-colors",
                    planFilter === "free" &&
                      "bg-background text-foreground border-border shadow-sm",
                  )}
                >
                  Free
                </button>
              </div>
              <div className="flex items-center rounded-full bg-muted/70 p-1 w-full sm:w-auto max-w-[220px]">
                <button
                  type="button"
                  onClick={() => setRoleFilter("all")}
                  className={cn(
                    "flex-1 px-3 py-1 text-xs sm:text-sm rounded-full border border-transparent text-muted-foreground hover:text-foreground transition-colors",
                    roleFilter === "all" &&
                      "bg-background text-foreground border-border shadow-sm",
                  )}
                >
                  All roles
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter("parent")}
                  className={cn(
                    "flex-1 px-3 py-1 text-xs sm:text-sm rounded-full border border-transparent text-muted-foreground hover:text-foreground transition-colors",
                    roleFilter === "parent" &&
                      "bg-background text-foreground border-border shadow-sm",
                  )}
                >
                  Parent
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter("student")}
                  className={cn(
                    "flex-1 px-3 py-1 text-xs sm:text-sm rounded-full border border-transparent text-muted-foreground hover:text-foreground transition-colors",
                    roleFilter === "student" &&
                      "bg-background text-foreground border-border shadow-sm",
                  )}
                >
                  Student
                </button>
              </div>
              <div className="relative w-full sm:w-72">
                <HugeiconsIcon
                  icon={Search01Icon}
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
                />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 bg-background border-border/60"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y divide-border/40">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
                <HugeiconsIcon
                  icon={UserMultiple02Icon}
                  className="size-7 text-muted-foreground"
                />
              </div>
              <p className="text-foreground font-medium">
                {search || planFilter !== "all" || roleFilter !== "all"
                  ? "No users match your filters."
                  : "No users yet."}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {search || planFilter !== "all" || roleFilter !== "all"
                  ? "Try changing search or filters."
                  : "Users will appear here once they sign up."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30">
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3 sm:px-6">
                      User
                    </th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3 sm:px-6 hidden sm:table-cell">
                      Email
                    </th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3 sm:px-6">
                      Plan
                    </th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3 sm:px-6 hidden md:table-cell">
                      Joined
                    </th>
                    <th className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3 sm:px-6 w-[80px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
                    <tr
                      key={user.id}
                      className={cn(
                        "border-b border-border/40 last:border-0 transition-colors",
                        "hover:bg-muted/30",
                      )}
                    >
                      <td className="px-4 py-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-border/50">
                            <AvatarImage src={user.image ?? undefined} alt="" />
                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                              {user.name
                                ? user.name
                                    .split(/\s+/)
                                    .map((s) => s[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()
                                : user.email.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {user.name || "—"}
                            </p>
                            <p className="text-sm text-muted-foreground truncate sm:hidden">
                              {user.email}
                            </p>
                            {user.onboarding && (
                              <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                {user.onboarding.isCompleted
                                  ? "Onboarding: Completed"
                                  : "Onboarding: In progress"}
                                {user.onboarding.role && (
                                  <> · {user.onboarding.role}</>
                                )}
                                {user.onboarding.studyIntensity && (
                                  <> · {user.onboarding.studyIntensity}</>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 sm:px-6 hidden sm:table-cell">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <HugeiconsIcon
                            icon={Mail01Icon}
                            className="size-4 shrink-0 opacity-70"
                          />
                          <span className="text-sm truncate max-w-[200px]">
                            {user.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        {user.isPremium ? (
                          <Badge
                            className="bg-linear-to-r from-(--brand-500) to-(--brand-600) text-white border-0 shadow-sm"
                            variant="default"
                          >
                            <HugeiconsIcon
                              icon={CrownIcon}
                              className="size-3.5 mr-1"
                            />
                            Pro
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-muted text-muted-foreground font-medium"
                          >
                            Free
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-4 sm:px-6 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <HugeiconsIcon
                            icon={Calendar03Icon}
                            className="size-4 shrink-0"
                          />
                          {new Date(user.createdAt).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 sm:px-6 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget(user)}
                          disabled={deletingId === user.id}
                        >
                          {deletingId === user.id ? (
                            <span className="animate-pulse">Deleting…</span>
                          ) : (
                            <HugeiconsIcon
                              icon={Delete01Icon}
                              className="size-4"
                            />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the account for{" "}
              <strong>{deleteTarget?.name || deleteTarget?.email}</strong> and
              all associated data (notes, folders, subscription, etc.). This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteUser();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!!deletingId}
            >
              {deletingId ? "Deleting…" : "Delete user"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
