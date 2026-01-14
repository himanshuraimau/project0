"use client";

import React, { useState, useEffect } from "react";
import { X, Pin, ChevronDown, Sparkles } from "lucide-react";
import { useFolders } from "@/hooks/use-folders";
import { useDashboardRefresh } from "@/contexts/dashboard-refresh-context";
import { toast } from "sonner";

interface AddLinkModalProps {
    onClose?: () => void;
    onProcessComplete?: (result: any) => void;
}

export function AddLinkModal({
    onClose,
    onProcessComplete,
}: AddLinkModalProps) {
    const { folders, getFolders, loading: foldersLoading } = useFolders();
    const { addLoadingNote, removeLoadingNote } = useDashboardRefresh();
    const [linkInput, setLinkInput] = useState("");
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentTempId, setCurrentTempId] = useState<string | null>(null);

    // Load folders on mount
    useEffect(() => {
        getFolders();
    }, [getFolders]);

    const detectLinkType = (url: string): "youtube" | "webpage" => {
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
            return "youtube";
        }
        return "webpage";
    };

    const handleGenerateNotes = async () => {
        if (!linkInput.trim()) return;

        setIsProcessing(true);

        const tempId = `link-${Date.now()}`;
        setCurrentTempId(tempId);
        addLoadingNote(tempId, "pdf");

        await new Promise((resolve) => setTimeout(resolve, 300));

        if (onClose) {
            onClose();
        }

        try {
            const linkType = detectLinkType(linkInput);

            let result;

            if (linkType === "youtube") {
                // Use /api/transcripts for YouTube (like mobile)
                const transcriptResponse = await fetch("/api/transcripts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url: linkInput }),
                });

                const transcriptResult = await transcriptResponse.json();

                if (!transcriptResponse.ok || !transcriptResult.success) {
                    throw new Error(transcriptResult.error || "Failed to process YouTube video");
                }

                // Generate AI notes from transcript
                const noteResponse = await fetch("/api/notes/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        transcriptId: transcriptResult.data.id,
                        folderId: selectedFolderId,
                    }),
                });

                const noteResult = await noteResponse.json();

                result = {
                    success: true,
                    data: {
                        transcript: transcriptResult.data,
                        note: noteResult.success ? noteResult.data : null,
                    },
                };
            } else {
                // Use /api/webpage/process for webpages
                const response = await fetch("/api/webpage/process", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        url: linkInput,
                        folderId: selectedFolderId,
                    }),
                });

                result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result.error || result.message || "Failed to process webpage");
                }
            }

            if (currentTempId) {
                removeLoadingNote(currentTempId);
                setCurrentTempId(null);
            }

            await new Promise((resolve) => setTimeout(resolve, 200));

            onProcessComplete?.(result.data);
            setLinkInput("");
            setSelectedFolderId(null);

            const source = linkType === "youtube" ? "YouTube video" : "webpage";
            toast.success(`🔗 ${source} processed successfully! Notes generated.`, {
                description: `Content extracted and notes created`,
                duration: 4000,
            });
        } catch (error) {
            console.error("Error processing link:", error);
            toast.error(error instanceof Error ? error.message : "Failed to process link. Please try again.");
        } finally {
            if (currentTempId) {
                removeLoadingNote(currentTempId);
                setCurrentTempId(null);
            }
            setIsProcessing(false);
        }
    };

    return (
        <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl p-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Add link</h2>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors w-9 h-[33px]"
                >
                    <X size={36} className="text-[#99A1AF]" strokeWidth={2.5} />
                </button>
            </div>

            {/* Link Input */}
            <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Link
                </label>
                <input
                    type="text"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    placeholder="youtube.com/anyvideo"
                    disabled={isProcessing}
                    className="w-full h-12 px-4 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-transparent transition-all disabled:opacity-50"
                />
            </div>

            {/* Helper Text */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                Supports YouTube, PDFs, TikTok, and websites
            </p>

            {/* Folder Selection */}
            <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Folder
                </label>
                <div className="relative">
                    <Pin
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500 dark:text-purple-400 pointer-events-none z-10"
                    />
                    <select
                        value={selectedFolderId || ""}
                        onChange={(e) => setSelectedFolderId(e.target.value || null)}
                        disabled={foldersLoading || isProcessing}
                        className="w-full h-12 pl-11 pr-10 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl appearance-none text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-transparent disabled:opacity-50"
                    >
                        <option value="">📌 All notes</option>
                        {folders.map((folder) => (
                            <option key={folder.id} value={folder.id}>
                                📁 {folder.name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown
                        size={20}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
                    />
                </div>
            </div>

            {/* Action Button */}
            <button
                onClick={handleGenerateNotes}
                disabled={isProcessing || !linkInput.trim()}
                className="w-full h-14 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-full hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Sparkles size={20} />
                {isProcessing ? "Processing..." : "Generate Notes"}
            </button>
        </div>
    );
}
