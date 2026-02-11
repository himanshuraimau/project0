"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { UpgradeModal } from "@/components/subscription/upgrade-modal";

interface UpgradeModalContextValue {
  openUpgradeModal: () => void;
}

const UpgradeModalContext = createContext<UpgradeModalContextValue | null>(
  null
);

export function UpgradeModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const openUpgradeModal = useCallback(() => {
    setOpen(true);
  }, []);

  return (
    <UpgradeModalContext.Provider value={{ openUpgradeModal }}>
      {children}
      <UpgradeModal open={open} onOpenChange={setOpen} />
    </UpgradeModalContext.Provider>
  );
}

export function useUpgradeModal() {
  const ctx = useContext(UpgradeModalContext);
  if (!ctx) {
    return {
      openUpgradeModal: () => {
        if (typeof window !== "undefined") {
          window.location.href = "/pricing";
        }
      },
    };
  }
  return ctx;
}
