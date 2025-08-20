import React from "react";
import NoteSidebar from "../../../components/dashboard/note-sidebar";
import { Navbar } from "../../../components/dashboard/navbar";

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full">
      <div className="fixed top-0 left-0 w-full z-50">
        <Navbar />
      </div>
      <div className="flex w-full pt-16">
        <div className="fixed top-16 left-0 h-[calc(100vh-4rem)] z-40">
          <NoteSidebar />
        </div>
        <div className="flex-1 ml-64 p-6 overflow-y-auto" style={{height: 'calc(100vh - 4rem)'}}>
          {children}
        </div>
      </div>
    </div>
  );
}
