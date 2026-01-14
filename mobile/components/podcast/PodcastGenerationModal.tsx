import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePodcastGeneration } from '@/lib/hooks/usePodcastGeneration';

const { width } = Dimensions.get('window');

interface Props {
    visible: boolean;
    onClose: () => void;
    noteId: string;
    noteContent: string;
    onComplete?: (podcast: any) => void;
}

export default function PodcastGenerationModal({
    visible,
    onClose,
    noteId,
    noteContent,
    onComplete,
}: Props) {
    const { job, isGenerating, generate, reset } = usePodcastGeneration();
    const hasAutoNavigated = useRef(false);

    // Auto-close and navigate when podcast generation completes
    useEffect(() => {
        if (job?.status === 'completed' && !hasAutoNavigated.current) {
            hasAutoNavigated.current = true;
            // Small delay to show the success state briefly
            const timer = setTimeout(() => {
                if (onComplete && job) {
                    onComplete(job);
                }
                reset();
                onClose();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [job?.status, job, onComplete, reset, onClose]);

    // Reset the auto-navigate flag when modal opens
    useEffect(() => {
        if (visible) {
            hasAutoNavigated.current = false;
        }
    }, [visible]);

    const handleGenerate = async () => {
        try {
            if (!noteContent || noteContent.trim().length === 0) {
                alert('Note content is empty. Cannot generate audio.');
                return;
            }
            await generate(noteId, noteContent);
        } catch (error: any) {
            alert(error.message || 'Failed to start audio generation');
        }
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Generate Audio</Text>
                        <TouchableOpacity
                            onPress={handleClose}
                            style={styles.closeButton}
                        >
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        {/* Idle State */}
                        {!job && !isGenerating && (
                            <View style={styles.idleState}>
                                <Ionicons
                                    name="mic-outline"
                                    size={64}
                                    color="#6366F1"
                                />
                                <Text style={styles.title}>
                                    Convert to Audio
                                </Text>
                                <Text style={styles.description}>
                                    Transform your note into AI-generated audio narration
                                </Text>

                                {!noteContent || noteContent.trim().length === 0 ? (
                                    <Text style={styles.errorText}>
                                        Note content is empty. Please add content to
                                        your note first.
                                    </Text>
                                ) : (
                                    <TouchableOpacity
                                        style={[
                                            styles.generateButton,
                                            { backgroundColor: '#6366F1', width: '100%' },
                                        ]}
                                        onPress={handleGenerate}
                                    >
                                        <Ionicons
                                            name="play"
                                            size={20}
                                            color="#FFFFFF"
                                        />
                                        <Text style={styles.buttonText}>
                                            Generate Audio
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {/* Generating State */}
                        {isGenerating && job && (
                            <View style={styles.generatingState}>
                                <LinearGradient
                                    colors={['#6366F1', '#8B5CF6']}
                                    style={styles.iconGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Ionicons
                                        name="musical-notes"
                                        size={48}
                                        color="#FFFFFF"
                                    />
                                </LinearGradient>

                                <Text style={styles.title}>
                                    Generating Your Audio...
                                </Text>
                                <Text style={styles.description}>
                                    This may take 5-15 seconds
                                </Text>

                                {/* Progress Bar */}
                                <View style={styles.progressContainer}>
                                    <View style={styles.progressBar}>
                                        <LinearGradient
                                            colors={['#6366F1', '#8B5CF6']}
                                            style={[
                                                styles.progressFill,
                                                { width: `${job.progress}%` },
                                            ]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        />
                                    </View>
                                    <Text style={styles.progressText}>
                                        {job.progress}%
                                    </Text>
                                </View>

                                {job.currentStep && (
                                    <Text style={styles.stepText}>
                                        {job.currentStep}
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* Completed State */}
                        {job?.status === 'completed' && (
                            <View style={styles.completedState}>
                                <View style={styles.successIcon}>
                                    <Ionicons
                                        name="checkmark-circle"
                                        size={64}
                                        color="#10B981"
                                    />
                                </View>

                                <Text style={styles.title}>
                                    Audio Ready! 🎉
                                </Text>
                                <Text style={styles.description}>
                                    Opening your audio...
                                </Text>

                                <ActivityIndicator
                                    size="small"
                                    color="#10B981"
                                    style={{ marginTop: 8 }}
                                />
                            </View>
                        )}

                        {/* Failed State */}
                        {job?.status === 'failed' && (
                            <View style={styles.failedState}>
                                <Ionicons
                                    name="alert-circle"
                                    size={64}
                                    color="#EF4444"
                                />

                                <Text style={[styles.title, { color: '#EF4444' }]}>
                                    Generation Failed
                                </Text>
                                <Text style={styles.description}>
                                    {job.error || 'An unknown error occurred'}
                                </Text>

                                <TouchableOpacity
                                    style={[
                                        styles.generateButton,
                                        { backgroundColor: '#6366F1', width: '100%' },
                                    ]}
                                    onPress={() => {
                                        reset();
                                        handleGenerate();
                                    }}
                                >
                                    <Ionicons
                                        name="refresh"
                                        size={20}
                                        color="#FFFFFF"
                                    />
                                    <Text style={styles.buttonText}>Try Again</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
    },
    idleState: {
        alignItems: 'center',
    },
    generatingState: {
        alignItems: 'center',
    },
    completedState: {
        alignItems: 'center',
    },
    failedState: {
        alignItems: 'center',
    },
    iconGradient: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    successIcon: {
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    errorText: {
        fontSize: 14,
        color: '#EF4444',
        textAlign: 'center',
        marginTop: 16,
    },
    generateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    progressContainer: {
        width: '100%',
        marginTop: 8,
    },
    progressBar: {
        width: '100%',
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6366F1',
        textAlign: 'center',
        marginTop: 8,
    },
    stepText: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 8,
    },
});
