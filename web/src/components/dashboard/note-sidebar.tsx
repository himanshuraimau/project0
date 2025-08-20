
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Sidebar on the left, note content on the right
export default function NoteSidebar({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("flex h-full w-full", className)}>
      <aside className="w-64 p-4 border-r bg-muted h-screen">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Notes</h2>
          <Button variant="outline" className="w-full">New Note</Button>
          {/* List of notes would go here */}
          <div className="mt-4">
            <ul className="space-y-2">
              <li>
                <Button variant="ghost" className="w-full justify-start">Note 1</Button>
              </li>
              <li>
                <Button variant="ghost" className="w-full justify-start">Note 2</Button>
              </li>
              {/* ...more notes */}
            </ul>
          </div>
        </div>
      </aside>
      <div className="flex-1 p-6 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
