import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    ScrollView,
    Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import { File, Directory, Paths } from 'expo-file-system';
import { podcastApi } from '@/lib/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;

export default function PodcastPlayerScreen() {
    const { id: noteId, podcastId } = useLocalSearchParams();
    const router = useRouter();

    const [podcast, setPodcast] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
    const [isDownloading, setIsDownloading] = useState(false);

    const soundRef = useRef<Audio.Sound | null>(null);

    useEffect(() => {
        loadPodcast();
        return () => {
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
        };
    }, [noteId, podcastId]);

    const loadPodcast = async () => {
        try {
            setLoading(true);
            const podcasts = await podcastApi.getPodcastsByNoteId(noteId as string);

            if (podcasts && podcasts.length > 0) {
                // If podcastId is provided, find that specific podcast
                // Otherwise, use the latest (first) podcast
                const selectedPodcast = podcastId
                    ? podcasts.find(p => p.id === podcastId)
                    : podcasts[0];

                if (selectedPodcast) {
                    setPodcast(selectedPodcast);

                    if (selectedPodcast.audioUrl) {
                        await setupAudio(selectedPodcast.audioUrl);
                    }
                } else if (podcastId) {
                    Alert.alert('Error', 'Podcast not found');
                }
            }
        } catch (error) {
            console.error('Error loading podcast:', error);
            Alert.alert('Error', 'Failed to load podcast');
        } finally {
            setLoading(false);
        }
    };

    const setupAudio = async (audioUrl: string) => {
        try {
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
                shouldDuckAndroid: true,
            });

            const { sound } = await Audio.Sound.createAsync(
                { uri: audioUrl },
                { shouldPlay: false },
                onPlaybackStatusUpdate
            );

            soundRef.current = sound;
        } catch (error) {
            console.error('Error setting up audio:', error);
            Alert.alert('Error', 'Failed to load audio');
        }
    };

    const onPlaybackStatusUpdate = (status: any) => {
        if (status.isLoaded) {
            setPosition(status.positionMillis);
            setDuration(status.durationMillis || 0);
            setIsPlaying(status.isPlaying);

            if (status.didJustFinish) {
                setIsPlaying(false);
                soundRef.current?.setPositionAsync(0);
            }
        }
    };

    const togglePlayPause = async () => {
        if (!soundRef.current) return;

        try {
            if (isPlaying) {
                await soundRef.current.pauseAsync();
            } else {
                await soundRef.current.playAsync();
            }
        } catch (error) {
            console.error('Error toggling playback:', error);
        }
    };

    const skipSeconds = async (seconds: number) => {
        if (!soundRef.current) return;

        try {
            const newPosition = Math.max(0, Math.min(duration, position + seconds * 1000));
            await soundRef.current.setPositionAsync(newPosition);
        } catch (error) {
            console.error('Error skipping:', error);
        }
    };

    const changePlaybackSpeed = async () => {
        const speeds = [1.0, 1.25, 1.5, 1.75, 2.0];
        const currentIndex = speeds.indexOf(playbackSpeed);
        const nextSpeed = speeds[(currentIndex + 1) % speeds.length];

        setPlaybackSpeed(nextSpeed);

        if (soundRef.current) {
            try {
                await soundRef.current.setRateAsync(nextSpeed, true);
            } catch (error) {
                console.error('Error changing speed:', error);
            }
        }
    };

    const handleDownload = async () => {
        if (!podcast?.audioUrl) return;

        try {
            setIsDownloading(true);

            // Create a directory for podcasts in the cache
            const podcastsDir = new Directory(Paths.cache, 'podcasts');
            podcastsDir.create();

            // Download the file using the new API
            const downloadedFile = await File.downloadFileAsync(
                podcast.audioUrl,
                podcastsDir
            );

            if (downloadedFile && downloadedFile.exists) {
                Alert.alert('Success', 'Podcast downloaded successfully');
            }
        } catch (error) {
            console.error('Error downloading:', error);
            Alert.alert('Error', 'Failed to download podcast');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleShare = async () => {
        if (!podcast?.audioUrl) return;

        try {
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(podcast.audioUrl);
            } else {
                Alert.alert('Error', 'Sharing is not available on this device');
            }
        } catch (error) {
            console.error('Error sharing:', error);
            Alert.alert('Error', 'Failed to share podcast');
        }
    };

    const formatTime = (millis: number) => {
        const totalSeconds = Math.floor(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const navigateToAllPodcasts = () => {
        router.push(`/notes/${noteId}/podcasts`);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading podcast...</Text>
            </View>
        );
    }

    if (!podcast) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="mic-off-outline" size={64} color="#9CA3AF" />
                <Text style={styles.emptyText}>No podcast available</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const progress = duration > 0 ? position / duration : 0;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Podcast</Text>

                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={handleDownload}
                        disabled={isDownloading}
                    >
                        {isDownloading ? (
                            <ActivityIndicator size="small" color="#1F2937" />
                        ) : (
                            <Ionicons name="download-outline" size={24} color="#1F2937" />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.headerButton, { marginLeft: 12 }]}
                        onPress={handleShare}
                    >
                        <Ionicons name="share-outline" size={24} color="#1F2937" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Main Card */}
                <View style={styles.card}>
                    {/* Card Header Controls */}
                    <View style={styles.cardHeader}>
                        <TouchableOpacity
                            style={styles.speedButton}
                            onPress={changePlaybackSpeed}
                        >
                            <Text style={styles.speedButtonText}>{playbackSpeed}x</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.viewAllButton}
                            onPress={navigateToAllPodcasts}
                        >
                            <Text style={styles.viewAllButtonText}>View All Podcasts</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Podcast Artwork */}
                    <View style={styles.artworkContainer}>
                        <LinearGradient
                            colors={['#E0E7FF', '#C7D2FE', '#A5B4FC']}
                            style={styles.artwork}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.waveformContainer}>
                                {[...Array(5)].map((_, i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.waveformBar,
                                            {
                                                height: 40 + Math.random() * 80,
                                                opacity: 0.3 + Math.random() * 0.4,
                                            },
                                        ]}
                                    />
                                ))}
                            </View>
                            <Ionicons
                                name="musical-notes"
                                size={64}
                                color="#6366F1"
                                style={styles.musicIcon}
                            />
                        </LinearGradient>
                    </View>

                    {/* Episode Metadata */}
                    <Text style={styles.episodeTitle} numberOfLines={2}>
                        {podcast.title || 'Untitled Podcast'}
                    </Text>

                    {/* Playback Timeline */}
                    <View style={styles.timelineContainer}>
                        <Text style={styles.timeText}>{formatTime(position)}</Text>

                        <View style={styles.progressBarContainer}>
                            <View style={styles.progressBarBackground}>
                                <View
                                    style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
                                />
                            </View>
                        </View>

                        <Text style={styles.timeText}>{formatTime(duration)}</Text>
                    </View>

                    {/* Playback Controls */}
                    <View style={styles.controlsContainer}>
                        <TouchableOpacity
                            style={styles.secondaryControl}
                            onPress={() => skipSeconds(-10)}
                        >
                            <Ionicons name="play-back" size={28} color="#6B7280" />
                            <Text style={styles.skipText}>10</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.primaryControl}
                            onPress={togglePlayPause}
                        >
                            <Ionicons
                                name={isPlaying ? 'pause' : 'play'}
                                size={36}
                                color="#FFFFFF"
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryControl}
                            onPress={() => skipSeconds(10)}
                        >
                            <Ionicons name="play-forward" size={28} color="#6B7280" />
                            <Text style={styles.skipText}>10</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Transcript Section (if available) */}
                {podcast.transcript && podcast.transcript.length > 0 && (
                    <View style={styles.transcriptContainer}>
                        <Text style={styles.transcriptTitle}>Transcript</Text>
                        {podcast.transcript.map((item: any, index: number) => (
                            <View key={index} style={styles.transcriptItem}>
                                <Text style={styles.transcriptSpeaker}>{item.speaker}:</Text>
                                <Text style={styles.transcriptText}>{item.text}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 24,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 18,
        color: '#6B7280',
        textAlign: 'center',
    },
    backButton: {
        marginTop: 24,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#3B82F6',
        borderRadius: 8,
    },
    backButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    headerActions: {
        flexDirection: 'row',
    },
    scrollContent: {
        paddingVertical: 24,
        alignItems: 'center',
    },
    card: {
        width: CARD_WIDTH,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    speedButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
    },
    speedButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    viewAllButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#EEF2FF',
        borderRadius: 20,
    },
    viewAllButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6366F1',
    },
    artworkContainer: {
        width: '100%',
        aspectRatio: 1,
        marginBottom: 24,
    },
    artwork: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    waveformContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        position: 'absolute',
    },
    waveformBar: {
        width: 6,
        backgroundColor: '#6366F1',
        borderRadius: 3,
    },
    musicIcon: {
        opacity: 0.6,
    },
    episodeTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 28,
    },
    timelineContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
    },
    timeText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    progressBarContainer: {
        flex: 1,
        marginHorizontal: 12,
    },
    progressBarBackground: {
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#6366F1',
        borderRadius: 2,
    },
    controlsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 48,
    },
    secondaryControl: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        position: 'relative',
    },
    skipText: {
        position: 'absolute',
        fontSize: 10,
        fontWeight: '700',
        color: '#6B7280',
        bottom: 8,
    },
    primaryControl: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#1F2937',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    transcriptContainer: {
        width: CARD_WIDTH,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    transcriptTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 16,
    },
    transcriptItem: {
        marginBottom: 12,
    },
    transcriptSpeaker: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6366F1',
        marginBottom: 4,
    },
    transcriptText: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
    },
});
