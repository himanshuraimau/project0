"use client";

import { useState } from "react";
import { Volume2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

export function NotificationsCard() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newSharedNotes, setNewSharedNotes] = useState(true);
  const [commentsMentions, setCommentsMentions] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [sound, setSound] = useState(true);
  const [volume, setVolume] = useState([70]);

  return (
    <div 
      className="bg-white/80 dark:bg-[#1A1A1A] rounded-[14px] p-8"
      style={{
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px -1px rgba(0, 0, 0, 0.1)',
        height: '632px'
      }}
    >
      {/* Header */}
      <h2 className="text-[16px] font-normal text-[#0F172B] dark:text-white mb-12">
        Notifications
      </h2>

      <div className="space-y-6">
        {/* Email Notifications */}
        <div className="flex items-center justify-between h-[42px]">
          <div>
            <label className="text-[14px] font-normal text-[#0A0A0A] dark:text-neutral-300 block mb-[4px]">
              Email Notifications
            </label>
            <p className="text-[16px] font-normal text-[#62748E] dark:text-neutral-400 leading-6">
              Receive updates via email
            </p>
          </div>
          <Switch
            checked={emailNotifications}
            onCheckedChange={setEmailNotifications}
            className="data-[state=checked]:bg-[#030213]"
          />
        </div>

        {/* Divider */}
        <div className="h-px bg-[rgba(0,0,0,0.1)] dark:bg-neutral-700"></div>

        {/* New Shared Notes */}
        <div className="flex items-center justify-between h-[42px]">
          <div>
            <label className="text-[14px] font-normal text-[#0A0A0A] dark:text-neutral-300 block mb-[4px]">
              New Shared Notes
            </label>
            <p className="text-[16px] font-normal text-[#62748E] dark:text-neutral-400 leading-6">
              When someone shares a note with you
            </p>
          </div>
          <Switch
            checked={newSharedNotes}
            onCheckedChange={setNewSharedNotes}
            className="data-[state=checked]:bg-[#030213]"
          />
        </div>

        {/* Comments & Mentions */}
        <div className="flex items-center justify-between h-[42px]">
          <div>
            <label className="text-[14px] font-normal text-[#0A0A0A] dark:text-neutral-300 block mb-[4px]">
              Comments & Mentions
            </label>
            <p className="text-[16px] font-normal text-[#62748E] dark:text-neutral-400 leading-6">
              When someone mentions you in a note
            </p>
          </div>
          <Switch
            checked={commentsMentions}
            onCheckedChange={setCommentsMentions}
            className="data-[state=checked]:bg-[#030213]"
          />
        </div>

        {/* Weekly Summary */}
        <div className="flex items-center justify-between h-[42px]">
          <div>
            <label className="text-[14px] font-normal text-[#0A0A0A] dark:text-neutral-300 block mb-[4px]">
              Weekly Summary
            </label>
            <p className="text-[16px] font-normal text-[#62748E] dark:text-neutral-400 leading-6">
              Get a weekly summary of your activity
            </p>
          </div>
          <Switch
            checked={weeklySummary}
            onCheckedChange={setWeeklySummary}
            className="data-[state=unchecked]:bg-[#CBCED4] data-[state=checked]:bg-[#030213]"
          />
        </div>

        {/* Divider */}
        <div className="h-px bg-[rgba(0,0,0,0.1)] dark:bg-neutral-700"></div>

        {/* Push Notifications */}
        <div className="flex items-center justify-between h-[42px]">
          <div>
            <label className="text-[14px] font-normal text-[#0A0A0A] dark:text-neutral-300 block mb-[4px]">
              Push Notifications
            </label>
            <p className="text-[16px] font-normal text-[#62748E] dark:text-neutral-400 leading-6">
              Receive push notifications on your device
            </p>
          </div>
          <Switch
            checked={pushNotifications}
            onCheckedChange={setPushNotifications}
            className="data-[state=checked]:bg-[#030213]"
          />
        </div>

        {/* Sound */}
        <div className="flex items-center justify-between h-[42px]">
          <div>
            <label className="text-[14px] font-normal text-[#0A0A0A] dark:text-neutral-300 block mb-[4px]">
              Sound
            </label>
            <p className="text-[16px] font-normal text-[#62748E] dark:text-neutral-400 leading-6">
              Play sound for notifications
            </p>
          </div>
          <Switch
            checked={sound}
            onCheckedChange={setSound}
            className="data-[state=checked]:bg-[#030213]"
          />
        </div>

        {/* Notification Volume */}
        <div className="h-[50px] mt-6">
          <label className="text-[14px] font-normal text-[#0A0A0A] dark:text-neutral-300 block mb-[26px]">
            Notification Volume
          </label>
          <div className="flex items-center gap-4 h-6">
            <Volume2 className="w-5 h-5 text-[#90A1B9]" strokeWidth={1.67} />
            <div className="flex-1">
              <Slider
                value={volume}
                onValueChange={setVolume}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
            <span className="text-[16px] font-normal text-[#45556C] leading-6 w-12">
              {volume[0]}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
