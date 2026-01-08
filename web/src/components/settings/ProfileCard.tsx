"use client";

import { useState } from "react";
import { Camera, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  const [lastName, setLastName] = useState(user.name?.split(" ").slice(1).join(" ") || "");
  const [bio, setBio] = useState("");

  // Get initials for avatar
  const getInitials = () => {
    if (firstName) return firstName.charAt(0).toUpperCase();
    if (user.name) return user.name.charAt(0).toUpperCase();
    return "U";
  };

  // Calculate member since date (mock for now)
  const getMemberSince = () => {
    return "October 2025";
  };

  const handleSaveChanges = () => {
    // TODO: Implement save logic
    console.log("Saving changes:", { firstName, lastName, bio });
  };

  return (
    <div 
      className="bg-[#F9FAFB] dark:bg-[#1A1A1A] rounded-[14px] border border-black dark:border-neutral-700 p-6"
      style={{
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px -1px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Header */}
      <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-6">
        Profile
      </h2>

      {/* User Info Section */}
      <div className="flex items-start gap-4 mb-8 pb-6 border-b border-neutral-200 dark:border-neutral-700">
        {/* Avatar */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full dark-gradient-element flex items-center justify-center text-white text-2xl font-semibold">
            {user.image ? (
              <img src={user.image} alt="Profile" className="w-full h-full rounded-full object-cover" />
            ) : (
              getInitials()
            )}
          </div>
          <button className="absolute bottom-0 right-0 w-7 h-7 bg-white dark:bg-neutral-800 rounded-full border-2 border-white dark:border-neutral-700 flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
            <Camera className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
          </button>
        </div>

        {/* User Details */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
              {user.name || "User"}
            </h3>
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-medium rounded-full">
              Free Plan
            </span>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
            Member since {getMemberSince()}
          </p>
          <button className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
            Change Photo
          </button>
        </div>
      </div>

      {/* Profile Form */}
      <div className="space-y-5">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName" className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
              First Name
            </Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="James"
              className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 rounded-lg h-11"
            />
          </div>
          <div>
            <Label htmlFor="lastName" className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
              Last Name
            </Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Ron"
              className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 rounded-lg h-11"
            />
          </div>
        </div>

        {/* Email Field */}
        <div>
          <Label htmlFor="email" className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            value={user.email || ""}
            disabled
            className="bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 rounded-lg h-11 text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
          />
        </div>

        {/* Bio Field */}
        <div>
          <Label htmlFor="bio" className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
            Bio
          </Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            rows={4}
            className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 rounded-lg resize-none"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6">
        <button
          onClick={handleSaveChanges}
          className="w-full dark-gradient-element text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
