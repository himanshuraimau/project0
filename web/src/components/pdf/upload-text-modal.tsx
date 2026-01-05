"use client";

import React, { useState } from "react";
import { X, Pin, ChevronDown, FileText, Sparkles } from "lucide-react";
import { useNotes } from "@/hooks/use-notes";
import { ProcessPDFResult } from "@/lib/types";
import { useDashboardRefresh } from "@/contexts/dashboard-refresh-context";

interface UploadTextModalProps {
    onProcessComplete?: (result: ProcessPDFResult) => void;
    onClose?: () => void;
    onOpenPDFDialog?: () => void;
}

export function UploadTextModal({
    onProcessComplete,
    onClose,
    onOpenPDFDialog,
}: UploadTextModalProps) {
    const { generateNotesFromText, loading } = useNotes();
    const { addLoadingNote, removeLoadingNote } = useDashboardRefresh();
    const [textInput, setTextInput] = useState("");
    const [folder, setFolder] = useState("All notes");
    const [currentTempId, setCurrentTempId] = useState<string | null>(null);

    const handleGenerateNotes = async () => {
        if (!textInput.trim()) return;

        // Generate temp ID and add loading note BEFORE closing modal
        const tempId = `text-${Date.now()}`;
        setCurrentTempId(tempId);
        addLoadingNote(tempId, "pdf");

        // Delay to ensure state update propagates and UI re-renders
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Close modal after adding loading note
        if (onClose) {
            onClose();
        }

        try {
            // Generate notes from text
            const result = await generateNotesFromText(textInput, "Text Note");

            if (result) {
                // Remove loading note using temp ID BEFORE calling completion callback
                if (currentTempId) {
                    removeLoadingNote(currentTempId);
                    setCurrentTempId(null);
                }

                // Wait for shimmer removal to propagate before triggering refresh
                await new Promise((resolve) => setTimeout(resolve, 200));

                // Call completion with result that includes temp ID for tracking
                onProcessComplete?.({
                    ...result,
                    transcript: {
                        ...result.transcript,
                        id: result.transcript.id || tempId,
                    },
                });

                // Reset form
                setTextInput("");
            }
        } catch (error) {
            console.error("Error generating notes from text:", error);
        } finally {
            // Always remove loading note in finally block
            if (currentTempId) {
                removeLoadingNote(currentTempId);
                setCurrentTempId(null);
            }
        }
    };

    const handleImportPDFs = () => {
        if (onClose) {
            onClose();
        }
        // Small delay before opening PDF dialog
        setTimeout(() => {
            if (onOpenPDFDialog) {
                onOpenPDFDialog();
            }
        }, 100);
    };

    return (
        <div className="w-full max-w-[450px] bg-white rounded-2xl p-6 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">Upload Text</h2>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label="Close"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Text Input Area */}
            <div className="mb-5">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    Text
                </label>
                <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Enter or paste your text here..."
                    disabled={loading}
                    className="w-full h-40 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all resize-none"
                />
            </div>

            {/* Folder Selection */}
            <div className="mb-5">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    Folder
                </label>
                <div className="relative">
                    <Pin
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500 pointer-events-none z-10"
                    />
                    <select
                        value={folder}
                        onChange={(e) => setFolder(e.target.value)}
                        className="w-full h-12 pl-11 pr-10 border border-gray-200 rounded-xl appearance-none text-gray-800 font-medium bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all cursor-pointer"
                    >
                        <option>All notes</option>
                        <option>Work</option>
                        <option>Personal</option>
                        <option>Projects</option>
                    </select>
                    <ChevronDown
                        size={18}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
                {/* Import PDF Button */}
                <button
                    onClick={handleImportPDFs}
                    className="w-full h-12 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                    <FileText size={20} />
                    Import PDF(s)
                </button>

                {/* Generate Notes Button */}
                <button
                    onClick={handleGenerateNotes}
                    disabled={loading || !textInput.trim()}
                    className="w-full h-12 bg-black text-white font-medium rounded-xl hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Sparkles size={20} />
                    {loading ? "Processing..." : "Generate Notes"}
                </button>
            </div>
        </div>
    );
}
