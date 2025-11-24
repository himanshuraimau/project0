import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import notesApi from '@/lib/api/notes';
import { transcribeAudio } from '@/lib/api/audio';
import { processWebpage } from '@/lib/api/webpage';
import {
    CreateNoteRequest,
    GenerateNoteRequest,
    GenerateNoteFromTextRequest,
    GenerateFocusedNoteRequest,
    Note,
    GenerateNoteFromTextResponse,
    TranscribeAudioResponse,
    ProcessWebpageRequest,
    ProcessWebpageResponse
} from '@/lib/api/types';

interface UseNoteCreationResult {
    isLoading: boolean;
    error: string | null;
    createNote: (data: CreateNoteRequest) => Promise<Note | null>;
    generateAINote: (data: GenerateNoteRequest) => Promise<Note | null>;
    generateNoteFromText: (data: GenerateNoteFromTextRequest) => Promise<GenerateNoteFromTextResponse | null>;
    generateFocusedNote: (data: GenerateFocusedNoteRequest) => Promise<Note | null>;
    transcribeAudio: (data: FormData) => Promise<TranscribeAudioResponse | null>;
    processWebpage: (data: ProcessWebpageRequest) => Promise<ProcessWebpageResponse | null>;
}

export const useNoteCreation = (): UseNoteCreationResult => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleNoteLimitError = (error: any) => {
        // Check if it's a note limit error (status 403 and has specific fields)
        if (error.statusCode === 403 && (error.message?.includes('limit') || error.notesLimit)) {
            Alert.alert(
                'Free Limit Reached',
                `You've reached the free tier limit of ${error.notesLimit || 3} notes. Upgrade to Pro for unlimited notes!`,
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Upgrade Now',
                        onPress: () => router.push('/(onboarding)/paywall/paywall5'),
                        style: 'default',
                    },
                ]
            );
            return true;
        }
        return false;
    };

    const wrapApiCall = async <T,>(
        apiCall: () => Promise<T>,
        errorMessage: string
    ): Promise<T | null> => {
        try {
            setIsLoading(true);
            setError(null);
            const result = await apiCall();
            return result;
        } catch (err: any) {
            console.error(errorMessage, err);

            // Handle note limit error
            if (handleNoteLimitError(err)) {
                // Error was handled by redirect
                return null;
            }

            // Handle other errors
            const msg = err.message || 'An unexpected error occurred';
            setError(msg);
            Alert.alert('Error', msg);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const createNote = async (data: CreateNoteRequest) => {
        return wrapApiCall(
            () => notesApi.createNote(data),
            'Failed to create note'
        );
    };

    const generateAINote = async (data: GenerateNoteRequest) => {
        return wrapApiCall(
            () => notesApi.generateAINote(data),
            'Failed to generate AI note'
        );
    };

    const generateNoteFromText = async (data: GenerateNoteFromTextRequest) => {
        return wrapApiCall(
            () => notesApi.generateNoteFromText(data),
            'Failed to generate note from text'
        );
    };

    const generateFocusedNote = async (data: GenerateFocusedNoteRequest) => {
        return wrapApiCall(
            () => notesApi.generateFocusedNote(data),
            'Failed to generate focused note'
        );
    };

    const transcribeAudioWrapper = async (data: FormData) => {
        return wrapApiCall(
            () => transcribeAudio(data),
            'Failed to transcribe audio'
        );
    };

    const processWebpageWrapper = async (data: ProcessWebpageRequest) => {
        return wrapApiCall(
            () => processWebpage(data),
            'Failed to process webpage'
        );
    };

    return {
        isLoading,
        error,
        createNote,
        generateAINote,
        generateNoteFromText,
        generateFocusedNote,
        transcribeAudio: transcribeAudioWrapper,
        processWebpage: processWebpageWrapper,
    };
};
