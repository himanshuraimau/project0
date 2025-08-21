import React from "react";
import { Navbar } from "../../../components/dashboard/navbar";

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full">
      <div className="fixed top-0 left-0 w-full z-50">
        <Navbar />
      </div>
      <div className="flex w-full pt-16">
        <div className="flex-1  overflow-y-auto" style={{height: 'calc(100vh - 4rem)'}}>
          {children}
        </div>
      </div>
    </div>
  );
}
