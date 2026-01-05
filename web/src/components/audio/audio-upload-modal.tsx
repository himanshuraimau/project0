"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, ChevronDown, Pin, Sparkles } from "lucide-react";
import { useDashboardRefresh } from "@/contexts/dashboard-refresh-context";

interface AudioUploadModalProps {
    onTranscriptionComplete: (result: {
        transcript: { id: string; content: string };
        note: {
            id?: string;
            title?: string;
            content?: string;
            error?: string;
            message?: string;
        };
    }) => void;
    onClose?: () => void;
}

export default function AudioUploadModal({
    onTranscriptionComplete,
    onClose,
}: AudioUploadModalProps) {
    const router = useRouter();
    const { addLoadingNote, removeLoadingNote } = useDashboardRefresh();
    const [isProcessing, setIsProcessing] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [fileName, setFileName] = useState("");
    const [audioLanguage, setAudioLanguage] = useState("English");
    const [folder, setFolder] = useState("All notes");
    const [currentTempId, setCurrentTempId] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (file) {
            // Check file size (25MB limit for OpenAI Whisper)
            const maxFileSize = 25 * 1024 * 1024; // 25MB
            if (file.size > maxFileSize) {
                alert(
                    `File too large! Maximum size is 25MB. Your file is ${(
                        file.size /
                        1024 /
                        1024
                    ).toFixed(2)}MB. Please compress or choose a smaller file.`
                );
                event.target.value = ""; // Clear the input
                return;
            }

            // Check file type
            const allowedTypes = [
                "audio/mpeg",
                "audio/mp3",
                "audio/wav",
                "audio/flac",
                "audio/m4a",
                "audio/ogg",
                "audio/webm",
                "audio/mp4",
            ];
            if (!allowedTypes.includes(file.type)) {
                alert(
                    `Unsupported audio format: ${file.type}. Please use MP3, WAV, FLAC, M4A, OGG, WebM, or MP4.`
                );
                event.target.value = ""; // Clear the input
                return;
            }

            setAudioBlob(file);
            setFileName(file.name.replace(/\.[^/.]+$/, "")); // Remove extension
        }
    };

    const transcribeAudio = async () => {
        if (!audioBlob) return;

        setIsProcessing(true);

        // Add loading note BEFORE closing modal
        const tempId = `audio-upload-${Date.now()}`;
        setCurrentTempId(tempId);
        addLoadingNote(tempId, "audio");

        // Longer delay to ensure state update propagates and UI re-renders
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Close modal after adding loading note
        if (onClose) {
            onClose();
        }

        try {
            const formData = new FormData();
            formData.append("audio", audioBlob);
            formData.append("fileName", fileName || "uploaded-audio");

            const response = await fetch("/api/audio/transcribe", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();

                // Remove loading note using temp ID BEFORE calling completion callback
                if (currentTempId) {
                    removeLoadingNote(currentTempId);
                    setCurrentTempId(null);
                }

                // Wait for shimmer removal to propagate before triggering refresh
                await new Promise((resolve) => setTimeout(resolve, 200));

                // Call completion with result that includes temp ID for tracking
                onTranscriptionComplete({
                    ...result,
                    transcript: {
                        ...result.transcript,
                        id: result.transcript.id || tempId,
                    },
                });

                // Reset form
                setAudioBlob(null);
                setFileName("");
            } else {
                const errorData = await response.json();

                // Handle specific error types
                if (
                    response.status === 403 &&
                    errorData.error === "FREE_TIER_LIMIT_REACHED"
                ) {
                    // Redirect to pricing page for free tier limit
                    router.push(errorData.upgradeUrl || "/pricing?reason=note-limit");
                    return;
                } else if (response.status === 413) {
                    throw new Error(
                        `File too large: ${errorData.error || "Audio file exceeds 25MB limit"}`
                    );
                } else if (response.status === 402) {
                    throw new Error("Insufficient credits to process audio");
                } else if (response.status === 400) {
                    throw new Error(errorData.error || "Invalid audio file format");
                } else {
                    throw new Error(errorData.error || "Failed to transcribe audio");
                }
            }
        } catch (error) {
            console.error("Transcription error:", error);
            alert("Failed to transcribe audio. Please try again.");
        } finally {
            // Always remove loading note in finally block
            if (currentTempId) {
                removeLoadingNote(currentTempId);
                setCurrentTempId(null);
            }
            setIsProcessing(false);
        }
    };

    const handleUploadZoneClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="w-full max-w-[650px] bg-white rounded-2xl p-6 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">Upload audio</h2>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label="Close"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Upload Zone */}
            <div className="mb-5">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".wav,.mp3,.aiff,.aac,.ogg,.flac,.m4a,.webm,.mp4"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="audio-file-input"
                />
                <label
                    htmlFor="audio-file-input"
                    onClick={handleUploadZoneClick}
                    className="flex flex-col items-center justify-center w-full border-2 border-gray-200 rounded-xl p-12 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                    <div className="bg-gray-100 p-3 rounded-lg mb-4">
                        <Upload size={24} className="text-gray-600" />
                    </div>
                    <p className="text-sm text-gray-600 text-center">
                        {audioBlob
                            ? `Selected: ${fileName || "Audio file"}`
                            : "Drag audio file here, or click to select"}
                    </p>
                    {audioBlob && (
                        <p className="text-xs text-gray-500 mt-2">
                            Size: {(audioBlob.size / 1024 / 1024).toFixed(2)}MB
                        </p>
                    )}
                </label>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 mb-5">
                {/* Audio Language */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Audio language
                    </label>
                    <div className="relative">
                        <select
                            value={audioLanguage}
                            onChange={(e) => setAudioLanguage(e.target.value)}
                            className="w-full h-12 px-4 pr-10 border border-gray-200 rounded-xl appearance-none text-gray-800 font-medium bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all cursor-pointer"
                        >
                            <option>English</option>
                            <option>Spanish</option>
                            <option>French</option>
                            <option>German</option>
                            <option>Chinese</option>
                            <option>Japanese</option>
                            <option>Korean</option>
                            <option>Arabic</option>
                            <option>Hindi</option>
                            <option>Portuguese</option>
                        </select>
                        <ChevronDown
                            size={18}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                        />
                    </div>
                </div>

                {/* Folder */}
                <div>
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
            </div>

            {/* Footer Button */}
            <button
                onClick={transcribeAudio}
                disabled={isProcessing || !audioBlob}
                className="w-full h-14 bg-black text-white font-medium rounded-xl hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Sparkles size={20} />
                {isProcessing ? "Processing..." : "Generate Notes"}
            </button>
        </div>
    );
}
