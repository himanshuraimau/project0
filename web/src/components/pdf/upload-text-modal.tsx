"use client";

import React, { useState, useEffect } from "react";
import { X, FileText, Sparkles, ChevronDown } from "lucide-react";
import { useNotes } from "@/hooks/use-notes";
import { useFolders } from "@/hooks/use-folders";
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
    const { folders, getFolders, loading: foldersLoading } = useFolders();
    const { addLoadingNote, removeLoadingNote } = useDashboardRefresh();
    const [textInput, setTextInput] = useState("");
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [currentTempId, setCurrentTempId] = useState<string | null>(null);

    // Load folders on mount
    useEffect(() => {
        getFolders();
    }, [getFolders]);

    const handleGenerateNotes = async () => {
        if (!textInput.trim()) return;

        const tempId = `text-${Date.now()}`;
        setCurrentTempId(tempId);
        addLoadingNote(tempId, "pdf");

        await new Promise((resolve) => setTimeout(resolve, 300));

        if (onClose) {
            onClose();
        }

        try {
            const result = await generateNotesFromText(textInput, "Text Note", selectedFolderId);

            if (result) {
                if (currentTempId) {
                    removeLoadingNote(currentTempId);
                    setCurrentTempId(null);
                }

                await new Promise((resolve) => setTimeout(resolve, 200));

                onProcessComplete?.({
                    ...result,
                    transcript: {
                        ...result.transcript,
                        id: result.transcript.id || tempId,
                    },
                });

                setTextInput("");
                setSelectedFolderId(null);
            }
        } catch (error) {
            console.error("Error generating notes from text:", error);
        } finally {
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
        setTimeout(() => {
            if (onOpenPDFDialog) {
                onOpenPDFDialog();
            }
        }, 100);
    };

    return (
        <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Upload Text</h2>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Text Input */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Text
                </label>
                <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    disabled={loading}
                    className="w-full h-64 px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-transparent transition-all resize-none disabled:opacity-50"
                />
            </div>

            {/* Folder Selection */}
            <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Folder
                </label>
                <div className="relative">
                    <select
                        value={selectedFolderId || ""}
                        onChange={(e) => setSelectedFolderId(e.target.value || null)}
                        disabled={foldersLoading || loading}
                        className="w-full h-12 px-4 pr-10 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl appearance-none text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-transparent disabled:opacity-50"
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
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4 px-20">
                <button
                    onClick={handleImportPDFs}
                    disabled={loading}
                    className="w-full h-14 bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <FileText size={20} />
                    Import PDF(s)
                </button>

                <button
                    onClick={handleGenerateNotes}
                    disabled={loading || !textInput.trim()}
                    className="w-full h-12 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Sparkles size={20} />
                    {loading ? "Processing..." : "Generate Notes"}
                </button>
            </div>
        </div>
    );
}
