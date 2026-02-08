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
    const { addLoadingNote, removeLoadingNote, triggerRefresh } = useDashboardRefresh();
    const [linkInput, setLinkInput] = useState("");
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentTempId, setCurrentTempId] = useState<string | null>(null);
    const [processingUrls, setProcessingUrls] = useState<Set<string>>(new Set());

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

        const normalizedUrl = linkInput.trim().toLowerCase();
        
        // Check if this URL is already being processed
        if (processingUrls.has(normalizedUrl)) {
            toast.warning("⏳ Already processing this link", {
                description: "This link is currently being processed. Please wait for it to complete.",
                duration: 4000,
            });
            return;
        }

        setIsProcessing(true);
        setProcessingUrls(prev => new Set(prev).add(normalizedUrl));

        const tempId = `link-${Date.now()}`;
        setCurrentTempId(tempId);
        
        const linkType = detectLinkType(linkInput);
        addLoadingNote(tempId, linkType === "youtube" ? "youtube" : "webpage");

        await new Promise((resolve) => setTimeout(resolve, 300));

        if (onClose) {
            onClose();
        }

        try {
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
                    // Handle specific error codes
                    if (transcriptResponse.status === 408 || transcriptResult.error === 'TIMEOUT') {
                        // Show a different message for timeouts - processing continues in background
                        toast.info("⏱️ YouTube video is being processed", {
                            description: transcriptResult.message || "This is taking longer than expected. The transcript is being processed in the background and should appear in your notes within 5-10 minutes.",
                            duration: 8000,
                        });
                        
                        // Don't throw error, just close modal and remove loading state
                        if (currentTempId) {
                            removeLoadingNote(currentTempId);
                            setCurrentTempId(null);
                        }
                        setIsProcessing(false);
                        return;
                    }
                    
                    // Handle other specific errors
                    const errorMessages: Record<string, string> = {
                        'NO_CAPTIONS': 'This video does not have captions available.',
                        'SERVICE_UNAVAILABLE': 'YouTube transcript service is temporarily busy. Please try again in a few minutes.',
                        'RATE_LIMITED': 'Too many requests. Please wait a moment before trying again.',
                        'NETWORK_ERROR': 'Connection issue. Please check your internet and try again.',
                        'EXTERNAL_API_ERROR': 'YouTube service error. Please try again or use a different video.',
                    };
                    
                    const errorMsg = errorMessages[transcriptResult.error] || transcriptResult.message || "Failed to process YouTube video";
                    throw new Error(errorMsg);
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

                if (!noteResponse.ok || !noteResult.success) {
                    // Transcript was created but notes failed
                    toast.warning("⚠️ Transcript created, but notes generation failed", {
                        description: "You can retry generating notes from your transcripts list.",
                        duration: 5000,
                    });
                    
                    result = {
                        success: true,
                        data: {
                            transcript: transcriptResult.data,
                            note: null,
                        },
                    };
                } else {
                    result = {
                        success: true,
                        data: {
                            transcript: transcriptResult.data,
                            note: noteResult.data,
                        },
                    };
                }
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
            
            // Trigger refresh to update note counter immediately
            triggerRefresh();
            
            setLinkInput("");
            setSelectedFolderId(null);

            const source = linkType === "youtube" ? "YouTube video" : "webpage";
            
            if (result.data.note) {
                toast.success(`🔗 ${source} processed successfully! Notes generated.`, {
                    description: `Content extracted and notes created`,
                    duration: 4000,
                });
            } else {
                toast.success(`🔗 ${source} transcript created`, {
                    description: `Transcript saved. You can generate notes from it later.`,
                    duration: 4000,
                });
            }
        } catch (error) {
            console.error("Error processing link:", error);
            
            
            // Remove from processing URLs after a delay to prevent immediate re-submission
            setTimeout(() => {
                setProcessingUrls(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(normalizedUrl);
                    return newSet;
                });
            }, 2000);
            const errorMessage = error instanceof Error ? error.message : "Failed to process link. Please try again.";
            
            toast.error("❌ Processing failed", {
                description: errorMessage,
                duration: 6000,
            });
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
