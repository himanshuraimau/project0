'use client';

import { usePodcastGeneration } from '@/hooks/usePodcastGeneration';

interface Props {
    noteId: string;
    noteContent?: string;
    noteTitle?: string;
}

export function PodcastGenerator({ noteId, noteContent, noteTitle }: Props) {
    const { job, isGenerating, generate, reset } = usePodcastGeneration();

    const handleGenerate = async () => {
        try {
            if (!noteContent) {
                alert('Note content is empty. Cannot generate audio.');
                return;
            }
            await generate(noteId, noteContent);
        } catch (error) {
            alert('Failed to start audio generation. Please try again.');
        }
    };

    const handleDownload = async (audioUrl: string, title: string) => {
        try {
            // Try direct download first (faster)
            const response = await fetch(audioUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_audio.mp3`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Direct download failed, trying API endpoint:', error);
            // Fallback: Try using the API endpoint if direct download fails (CORS issues)
            try {
                // If we have a podcast ID, use the secure download endpoint
                if (job?.jobId) {
                    const apiUrl = `/api/podcast/download/${job.jobId}`;
                    const a = document.createElement('a');
                    a.href = apiUrl;
                    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_audio.mp3`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                } else {
                    throw new Error('No podcast ID available');
                }
            } catch (fallbackError) {
                console.error('API download also failed:', fallbackError);
                alert('Failed to download audio. Please try again or right-click the audio player and select "Save audio as..."');
            }
        }
    };

    const handleShare = async (audioUrl: string, title: string) => {
        try {
            if (navigator.share) {
                // Use Web Share API if available
                await navigator.share({
                    title: `Audio: ${title}`,
                    text: `Check out this AI-generated audio from my notes!`,
                    url: audioUrl,
                });
            } else {
                // Fallback: Copy link to clipboard
                await navigator.clipboard.writeText(audioUrl);
                alert('Audio link copied to clipboard!');
            }
        } catch (error) {
            console.error('Share error:', error);
            // Fallback: Copy to clipboard
            try {
                await navigator.clipboard.writeText(audioUrl);
                alert('Audio link copied to clipboard!');
            } catch (clipboardError) {
                alert('Failed to share audio. Please try again.');
            }
        }
    };

    return (
        <div className="podcast-generator w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            {/* Idle state */}
            {!job && !isGenerating && (
                <div className="flex flex-col gap-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                        Generate Audio
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Convert your note into AI-generated audio narration
                    </p>
                    {!noteContent ? (
                        <p className="text-sm text-red-600 dark:text-red-400">
                            Note content is empty. Please add content to your note before generating audio.
                        </p>
                    ) : (
                        <button
                            onClick={handleGenerate}
                            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Generate Audio
                        </button>
                    )}
                </div>
            )}

            {/* Generating state */}
            {isGenerating && job && (
                <div className="generating-state">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        🎙️ Generating Your Audio...
                    </h3>
                    <div className="progress-bar w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
                        <div
                            className="progress-fill h-full bg-blue-600 transition-all duration-500 ease-out"
                            style={{ width: `${job.progress}%` }}
                        />
                    </div>
                    <p className="text-sm text-gray-600">
                        {job.progress}% - {job.currentStep || 'Processing...'}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                        This may take 5-15 seconds.
                    </p>
                </div>
            )}

            {/* Completed state */}
            {job?.status === 'completed' && job.audioUrl && (
                <div className="completed-state">
                    <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-4">
                        🎉 Your Audio is Ready!
                    </h3>
                    <audio
                        controls
                        src={job.audioUrl}
                        className="w-full mb-4"
                    />
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <span>
                            Duration: {Math.floor(job.audioDuration! / 60)}:{(job.audioDuration! % 60).toString().padStart(2, '0')}
                        </span>
                        <button
                            onClick={reset}
                            className="px-4 py-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        >
                            Generate Another
                        </button>
                    </div>

                    {/* Download and Share buttons */}
                    <div className="flex gap-3 mb-4">
                        <button
                            onClick={() => handleDownload(job.audioUrl!, noteTitle || 'audio')}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Download
                        </button>
                        <button
                            onClick={() => handleShare(job.audioUrl!, noteTitle || 'audio')}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                            </svg>
                            Share
                        </button>
                    </div>
                </div>
            )}

            {/* Failed state */}
            {job?.status === 'failed' && (
                <div className="failed-state">
                    <h3 className="text-xl font-semibold text-red-600 mb-4">
                        ❌ Generation Failed
                    </h3>
                    <p className="text-red-600 mb-4">
                        {job.error || 'An unknown error occurred'}
                    </p>
                    <button
                        onClick={handleGenerate}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
}
