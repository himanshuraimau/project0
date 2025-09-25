"use client";

import React from "react";
import { UserControl } from "@/components/user-control";
import { ThemeToggleButton } from "@/components/dashboard/theme-toggle-button";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  weight: "600",
});

interface NavbarProps {
  title: string;
  className?: string;
}

export function Navbar({ title, className = "" }: NavbarProps) {
  return (
    <div
      className={`${jakarta.className} py-[17px] border-b border-stone-200 flex bg-white dark:bg-stone-950 items-center dark:border-stone-900 justify-between px-8 transition-all duration-300 ${className}`}
    >
      <h1 className=" font-medium text-stone-900 dark:text-stone-100">
        {title}
      </h1>
      <span className="flex gap-6 items-center">
        <ThemeToggleButton />
        <UserControl showName />
      </span>
    </div>
  );
}
