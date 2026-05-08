"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { BulkUploadModal } from "./bulk-upload-modal";

interface Props {
  folderId?: string | null;
  className?: string;
  variant?: "primary" | "ghost";
  label?: string;
}

export function AddSourcesButton({
  folderId = null,
  className,
  variant = "primary",
  label = "Add sources",
}: Props) {
  const [open, setOpen] = useState(false);

  const baseClasses =
    "inline-flex items-center justify-center gap-2 h-10 rounded-lg px-4 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer";
  const variantClasses =
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:bg-primary/90"
      : "bg-transparent text-foreground hover:bg-muted";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${baseClasses} ${variantClasses} ${className ?? ""}`}
      >
        <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
        {label}
      </button>
      <BulkUploadModal
        open={open}
        onClose={() => setOpen(false)}
        initialFolderId={folderId}
      />
    </>
  );
}
