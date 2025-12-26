'use client';

import { usePodcastGeneration } from '@/hooks/usePodcastGeneration';

interface Props {
    noteId: string;
    noteContent?: string;
    noteTitle?: string;
}

export function PodcastGenerator({ noteId, noteContent, noteTitle }: Props) {
    const { job, isGenerating, generate, reset } = usePodcastGeneration();

    const handleGenerate = async (duration: 'short' | 'long') => {
        try {
            if (!noteContent) {
                alert('Note content is empty. Cannot generate podcast.');
                return;
            }
            await generate(noteId, noteContent, duration);
        } catch (error) {
            alert('Failed to start podcast generation. Please try again.');
        }
    };

    return (
        <div className="podcast-generator w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            {/* Idle state */}
            {!job && !isGenerating && (
                <div className="flex flex-col gap-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                        Generate Podcast
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Convert your note into an AI-generated podcast
                    </p>
                    {!noteContent ? (
                        <p className="text-sm text-red-600 dark:text-red-400">
                            Note content is empty. Please add content to your note before generating a podcast.
                        </p>
                    ) : (
                        <div className="flex gap-4">
                            <button
                                onClick={() => handleGenerate('short')}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                Generate Short Podcast (3-5 min)
                            </button>
                            <button
                                onClick={() => handleGenerate('long')}
                                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                            >
                                Generate Long Podcast (8-10 min)
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Generating state */}
            {isGenerating && job && (
                <div className="generating-state">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        🎙️ Generating Your Podcast...
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
                        This may take 30-120 seconds. Feel free to navigate away - we'll save your podcast.
                    </p>
                </div>
            )}

            {/* Completed state */}
            {job?.status === 'completed' && job.audioUrl && (
                <div className="completed-state">
                    <h3 className="text-xl font-semibold text-green-600 mb-4">
                        🎉 Your Podcast is Ready!
                    </h3>
                    <audio
                        controls
                        src={job.audioUrl}
                        className="w-full mb-4"
                    />
                    <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>
                            Duration: {Math.floor(job.audioDuration! / 60)}:{(job.audioDuration! % 60).toString().padStart(2, '0')}
                        </span>
                        <button
                            onClick={reset}
                            className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Generate Another
                        </button>
                    </div>

                    {/* Transcript preview */}
                    {job.transcript && job.transcript.length > 0 && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold text-gray-700 mb-2">Transcript</h4>
                            <div className="max-h-48 overflow-y-auto text-sm text-gray-600 space-y-2">
                                {job.transcript.map((item: any, index: number) => (
                                    <div key={index} className="flex gap-2">
                                        <span className="font-medium text-gray-700">
                                            {item.speaker}:
                                        </span>
                                        <span>{item.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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
                        onClick={() => handleGenerate('short')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
}
