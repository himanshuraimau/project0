"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, FileText, Sparkles, ChevronDown } from "lucide-react";
import { useNotes } from "@/hooks/use-notes";
import { useFolders } from "@/hooks/use-folders";
import { ProcessPDFResult } from "@/lib/types";
import { useDashboardRefresh } from "@/contexts/dashboard-refresh-context";
import { toast } from "sonner";

interface UploadTextModalProps {
    onProcessComplete?: (result: ProcessPDFResult) => void;
    onClose?: () => void;
}

export function UploadTextModal({
    onProcessComplete,
    onClose,
}: UploadTextModalProps) {
    const { generateNotesFromText, processPDFWithNotes, loading } = useNotes();
    const { folders, getFolders, loading: foldersLoading } = useFolders();
    const { addLoadingNote, removeLoadingNote } = useDashboardRefresh();
    const [textInput, setTextInput] = useState("");
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [currentTempId, setCurrentTempId] = useState<string | null>(null);
    const [selectedPDFFile, setSelectedPDFFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load folders on mount
    useEffect(() => {
        getFolders();
    }, [getFolders]);

    const handleGenerateNotes = async () => {
        // Check if we have PDF file selected or text input
        const hasPDF = selectedPDFFile !== null;
        const hasText = textInput.trim().length > 0;

        if (!hasPDF && !hasText) return;

        const tempId = hasPDF ? `pdf-${Date.now()}` : `text-${Date.now()}`;
        setCurrentTempId(tempId);
        addLoadingNote(tempId, "pdf");

        await new Promise((resolve) => setTimeout(resolve, 300));

        if (onClose) {
            onClose();
        }

        try {
            let result;

            if (hasPDF) {
                // Process PDF with notes generation
                result = await processPDFWithNotes(selectedPDFFile, {
                    generateNotes: true,
                    extractImages: false,
                });
            } else {
                // Generate notes from text
                result = await generateNotesFromText(textInput, "Text Note", selectedFolderId);
            }

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
                setSelectedPDFFile(null);
            }
        } catch (error) {
            console.error("Error generating notes:", error);
        } finally {
            if (currentTempId) {
                removeLoadingNote(currentTempId);
                setCurrentTempId(null);
            }
        }
    };

    const handleImportPDFs = () => {
        // Trigger file input click to open file explorer
        fileInputRef.current?.click();
    };

    const handlePDFSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (file.type !== 'application/pdf') {
            toast.error("Invalid file type", {
                description: "Please select a PDF file",
            });
            return;
        }

        // Check file size (10MB limit)
        const maxFileSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxFileSize) {
            toast.error("File too large", {
                description: "PDF must be less than 10MB",
            });
            return;
        }

        // Just store the file, don't process it yet
        setSelectedPDFFile(file);
        
        toast.success("PDF uploaded", {
            description: `${file.name} is ready. Click "Generate Notes" to process.`,
        });
    };

    return (
        <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl p-8">
            {/* Hidden file input for PDF selection */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handlePDFSelect}
                className="hidden"
            />
            
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Upload Text</h2>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors w-9 h-[33px]"
                >
                    <X size={36} className="text-[#99A1AF]" strokeWidth={2.5} />
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
                    disabled={loading || selectedPDFFile !== null}
                    placeholder={selectedPDFFile ? "Text input disabled when PDF is selected" : "Enter your text here..."}
                    className="w-full h-64 px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-transparent transition-all resize-none disabled:opacity-50"
                />
            </div>

            {/* Selected PDF Display */}
            {selectedPDFFile && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FileText size={24} className="text-blue-600 dark:text-blue-400" />
                            <div>
                                <p className="font-medium text-gray-800 dark:text-gray-200">
                                    {selectedPDFFile.name}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {(selectedPDFFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedPDFFile(null);
                                if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                }
                            }}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}

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
                    disabled={loading || textInput.trim().length > 0}
                    className="w-full h-14 bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <FileText size={20} />
                    {selectedPDFFile ? "Change PDF" : "Import PDF(s)"}
                </button>

                <button
                    onClick={handleGenerateNotes}
                    disabled={loading || (!textInput.trim() && !selectedPDFFile)}
                    className="w-full h-12 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Sparkles size={20} />
                    {loading ? "Processing..." : "Generate Notes"}
                </button>
            </div>
        </div>
    );
}
