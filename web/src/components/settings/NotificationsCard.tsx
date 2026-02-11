"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification01Icon, VolumeHighIcon } from "@hugeicons/core-free-icons";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

const switchRowClass =
  "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 first:pt-0";

export function NotificationsCard() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newSharedNotes, setNewSharedNotes] = useState(true);
  const [commentsMentions, setCommentsMentions] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [sound, setSound] = useState(true);
  const [volume, setVolume] = useState([70]);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border/80 bg-muted/20">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <HugeiconsIcon icon={Notification01Icon} className="size-5" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Notification preferences
        </h2>
      </div>

      <div className="p-6 space-y-0">
        <div className="space-y-0">
          <div className={switchRowClass}>
            <div className="min-w-0">
              <Label className="text-lg font-medium text-foreground cursor-pointer">
                Email notifications
              </Label>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Receive updates via email
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
              className="shrink-0 data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
            />
          </div>
          <div className="h-px bg-border/80" />

          <div className={switchRowClass}>
            <div className="min-w-0">
              <Label className="text-lg font-medium text-foreground cursor-pointer">
                New shared notes
              </Label>
              <p className="mt-0.5 text-sm text-muted-foreground">
                When someone shares a note with you
              </p>
            </div>
            <Switch
              checked={newSharedNotes}
              onCheckedChange={setNewSharedNotes}
              className="shrink-0 data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
            />
          </div>
          <div className="h-px bg-border/80" />

          <div className={switchRowClass}>
            <div className="min-w-0">
              <Label className="text-lg font-medium text-foreground cursor-pointer">
                Comments & mentions
              </Label>
              <p className="mt-0.5 text-sm text-muted-foreground">
                When someone mentions you in a note
              </p>
            </div>
            <Switch
              checked={commentsMentions}
              onCheckedChange={setCommentsMentions}
              className="shrink-0 data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
            />
          </div>
          <div className="h-px bg-border/80" />

          <div className={switchRowClass}>
            <div className="min-w-0">
              <Label className="text-lg font-medium text-foreground cursor-pointer">
                Weekly summary
              </Label>
              <p className="mt-0.5 text-sm text-muted-foreground">
                A weekly digest of your activity
              </p>
            </div>
            <Switch
              checked={weeklySummary}
              onCheckedChange={setWeeklySummary}
              className="shrink-0 data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
            />
          </div>
        </div>

        <div className="h-px bg-border my-4" />

        {/* Push & sound */}
        <div className="space-y-0">
          <div className={switchRowClass}>
            <div className="min-w-0">
              <Label className="text-lg font-medium text-foreground cursor-pointer">
                Push notifications
              </Label>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Receive push notifications on your device
              </p>
            </div>
            <Switch
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
              className="shrink-0 data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
            />
          </div>
          <div className="h-px bg-border/80" />

          <div className={switchRowClass}>
            <div className="min-w-0">
              <Label className="text-lg font-medium text-foreground cursor-pointer">
                Sound
              </Label>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Play a sound for new notifications
              </p>
            </div>
            <Switch
              checked={sound}
              onCheckedChange={setSound}
              className="shrink-0 data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
            />
          </div>
        </div>

        {/* Volume */}
        <div className="pt-6 mt-6 border-t border-border/80">
          <Label className="text-lg font-medium text-foreground block mb-3">
            Notification volume
          </Label>
          <div className="flex items-center gap-4">
            <HugeiconsIcon
              icon={VolumeHighIcon}
              className="size-5 shrink-0 text-muted-foreground"
            />
            <Slider
              value={volume}
              onValueChange={setVolume}
              max={100}
              step={1}
              className="flex-1 min-w-0"
            />
            <span className="text-sm font-medium tabular-nums text-foreground w-10 text-right">
              {volume[0]}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
