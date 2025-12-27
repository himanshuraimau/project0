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
    Animated,
    Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Sharing from 'expo-sharing';
import Svg, { Path } from 'react-native-svg';
import { podcastApi } from '@/lib/api';
import BackButton from '@/components/ui/BackButton';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;

// Custom Replay 10 seconds icon component
const Replay10Icon = ({ size = 28, color = "#6B7280" }) => (
    <Svg 
        width={size} 
        height={size} 
        viewBox="0 -960 960 960" 
        fill={color}
    >
        <Path d="M480-80q-75 0-140.5-28.5t-114-77q-48.5-48.5-77-114T120-440h80q0 117 81.5 198.5T480-160q117 0 198.5-81.5T760-440q0-117-81.5-198.5T480-720h-6l62 62-56 58-160-160 160-160 56 58-62 62h6q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-440q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-80ZM360-320v-180h-60v-60h120v240h-60Zm140 0q-17 0-28.5-11.5T460-360v-160q0-17 11.5-28.5T500-560h80q17 0 28.5 11.5T620-520v160q0 17-11.5 28.5T580-320h-80Zm20-60h40v-120h-40v120Z" />
    </Svg>
);

// Custom Forward 10 seconds icon component
const Forward10Icon = ({ size = 28, color = "#6B7280" }) => (
    <Svg 
        width={size} 
        height={size} 
        viewBox="0 -960 960 960" 
        fill={color}
    >
        <Path d="M360-320v-180h-60v-60h120v240h-60Zm140 0q-17 0-28.5-11.5T460-360v-160q0-17 11.5-28.5T500-560h80q17 0 28.5 11.5T620-520v160q0 17-11.5 28.5T580-320h-80Zm20-60h40v-120h-40v120ZM480-80q-75 0-140.5-28.5t-114-77q-48.5-48.5-77-114T120-440q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480-800h6l-62-62 56-58 160 160-160 160-56-58 62-62h-6q-117 0-198.5 81.5T200-440q0 117 81.5 198.5T480-160q117 0 198.5-81.5T760-440h80q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-80Z" />
    </Svg>
);

const NUM_BARS = 20; // Number of bars to render

// Custom PodcastWaveform component
const PodcastWaveform = ({ isPlaying }: { isPlaying: boolean }) => {
    // 1. Create an array of Animated Values, one for each bar
    const animations = useRef([...Array(NUM_BARS)].map(() => new Animated.Value(0))).current;
    const animationRefs = useRef<Animated.CompositeAnimation[]>([]).current;

    useEffect(() => {
        const animateBar = (index: number) => {
            // Logic to make center bars taller and faster, edge bars shorter and slower
            const isCenter = index > NUM_BARS / 3 && index < (NUM_BARS * 2) / 3;
            const baseDuration = isCenter ? 400 : 700;
            
            // Random variation to simulate natural voice
            const randomDuration = baseDuration + Math.random() * 300; 
            const randomHeight = isCenter 
                ? 40 + Math.random() * 60  // Center bars go tall (40-100%)
                : 10 + Math.random() * 30; // Edge bars stay short (10-40%)

            const animation = Animated.sequence([
                Animated.timing(animations[index], {
                    toValue: 1, // Go up
                    duration: randomDuration,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false, // false because we animate height/layout
                }),
                Animated.timing(animations[index], {
                    toValue: 0, // Go down
                    duration: randomDuration,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                })
            ]);

            animationRefs[index] = animation;
            animation.start(() => {
                if (isPlaying) {
                    animateBar(index); // Loop recursively only if playing
                }
            });
        };

        if (isPlaying) {
            // Start all animations with a slight stagger
            animations.forEach((_, i) => {
                setTimeout(() => animateBar(i), i * 50);
            });
        } else {
            // Stop all animations and reset to base state
            animationRefs.forEach(animation => {
                if (animation) {
                    animation.stop();
                }
            });
            
            // Reset all bars to their minimum height with a slower, smoother transition
            animations.forEach((anim, index) => {
                const isCenter = index > NUM_BARS / 3 && index < (NUM_BARS * 2) / 3;
                const targetValue = isCenter ? 0.3 : 0.1; // Small base height
                
                Animated.timing(anim, {
                    toValue: targetValue,
                    duration: 800, // Slower duration for smoother pause transition
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: false,
                }).start();
            });
        }

        return () => {
            // Cleanup on unmount
            animationRefs.forEach(animation => {
                if (animation) {
                    animation.stop();
                }
            });
        };
    }, [isPlaying]);

    return (
        <View style={waveformStyles.container}>
            <View style={waveformStyles.visualizerContainer}>
                {animations.map((anim, index) => {
                    // Interpolate 0-1 to pixel heights
                    const isCenter = index > NUM_BARS / 3 && index < (NUM_BARS * 2) / 3;
                    const minHeight = isCenter ? 20 : 8;
                    const maxHeight = isCenter ? 90 : 30;

                    const height = anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [minHeight, maxHeight]
                    });

                    // Color logic: Center is Light Purple, Edges are Gray
                    const barColor = isCenter ? '#E9D5FF' : '#52525b'; 

                    return (
                        <Animated.View
                            key={index}
                            style={[
                                waveformStyles.bar,
                                { 
                                    height,
                                    backgroundColor: barColor,
                                    // Slight opacity change for "breathing" effect
                                    opacity: anim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.5, 1]
                                    })
                                }
                            ]}
                        />
                    );
                })}
            </View>
        </View>
    );
};

interface PodcastPlayerViewProps {
    noteId: string;
    podcastId?: string;
}

export default function PodcastPlayerView({ noteId, podcastId }: PodcastPlayerViewProps) {
    const router = useRouter();

    const [podcast, setPodcast] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
    const [isDownloading, setIsDownloading] = useState(false);

    const soundRef = useRef<Audio.Sound | null>(null);
    const positionIntervalRef = useRef<any>(null);
    const isUpdatingPositionRef = useRef(false);
    const isPlayingRef = useRef(false);
    const playbackSpeedRef = useRef(1.0);
    const durationRef = useRef(0);

    useEffect(() => {
        loadPodcast();
        return () => {
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
            stopPositionUpdates();
        };
    }, [noteId, podcastId]);

    const startPositionUpdates = () => {
        if (positionIntervalRef.current) {
            clearInterval(positionIntervalRef.current);
        }
        
        positionIntervalRef.current = setInterval(() => {
            setPosition(prev => {
                // Use refs to get current values to avoid stale closure
                if (isPlayingRef.current && prev < durationRef.current) {
                    // Account for playback speed in position updates
                    const increment = 100 * playbackSpeedRef.current; // 100ms * current speed
                    return Math.min(prev + increment, durationRef.current);
                }
                return prev;
            });
        }, 100);
    };

    const stopPositionUpdates = () => {
        if (positionIntervalRef.current) {
            clearInterval(positionIntervalRef.current);
            positionIntervalRef.current = null;
        }
    };

    const loadPodcast = async () => {
        try {
            setLoading(true);
            const podcasts = await podcastApi.getPodcastsByNoteId(noteId);

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
            // Always update duration
            setDuration(status.durationMillis || 0);
            durationRef.current = status.durationMillis || 0;
            
            // Only update position if we're not actively playing or if there's a significant difference
            if (!isPlaying || !isUpdatingPositionRef.current) {
                setPosition(status.positionMillis);
            }
            
            // Only update isPlaying if it's different to avoid conflicts
            if (status.isPlaying !== isPlaying) {
                setIsPlaying(status.isPlaying);
                isPlayingRef.current = status.isPlaying;
            }

            if (status.didJustFinish) {
                setIsPlaying(false);
                isPlayingRef.current = false;
                stopPositionUpdates();
                soundRef.current?.setPositionAsync(0);
                setPosition(0);
            }
        }
    };

    const togglePlayPause = async () => {
        if (!soundRef.current) return;

        try {
            const wasPlaying = isPlaying;
            const newPlayingState = !isPlaying;
            
            // Update UI immediately for responsive feedback
            setIsPlaying(newPlayingState);
            isPlayingRef.current = newPlayingState;
            
            if (wasPlaying) {
                // Pausing
                await soundRef.current.pauseAsync();
                stopPositionUpdates();
                isUpdatingPositionRef.current = false;
            } else {
                // Playing
                await soundRef.current.playAsync();
                startPositionUpdates();
                isUpdatingPositionRef.current = true;
            }
        } catch (error) {
            console.error('Error toggling playback:', error);
            // Revert the state if there's an error
            setIsPlaying(isPlaying);
            isPlayingRef.current = isPlaying;
            stopPositionUpdates();
            isUpdatingPositionRef.current = false;
        }
    };

    const skipSeconds = async (seconds: number) => {
        if (!soundRef.current) return;

        try {
            const newPosition = Math.max(0, Math.min(duration, position + seconds * 1000));
            
            // Update position immediately for responsive UI
            setPosition(newPosition);
            
            await soundRef.current.setPositionAsync(newPosition);
            
            // If we're playing, restart the position updates from the new position
            if (isPlaying) {
                startPositionUpdates();
            }
        } catch (error) {
            console.error('Error skipping:', error);
            // The onPlaybackStatusUpdate will correct the position if there's an error
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
            
            // For now, just show a message that the feature is coming soon
            Alert.alert(
                'Download Feature',
                'Download functionality is coming soon! You can still play the podcast online.',
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('Error downloading:', error);
            Alert.alert('Error', 'Failed to download podcast. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleShare = async () => {
        if (!podcast?.audioUrl) return;

        try {
            const isAvailable = await Sharing.isAvailableAsync();
            if (!isAvailable) {
                Alert.alert('Error', 'Sharing is not available on this device');
                return;
            }

            // For now, just share the URL
            await Sharing.shareAsync(podcast.audioUrl, {
                mimeType: 'audio/mpeg',
                dialogTitle: 'Share Podcast',
                UTI: 'public.audio'
            });
        } catch (error) {
            console.error('Error sharing:', error);
            Alert.alert('Error', 'Failed to share podcast. Please try again.');
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
                <BackButton iconColor="#1F2937" />

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
                        <PodcastWaveform isPlaying={isPlaying} />
                    </View>

                    {/* Episode Metadata */}
                    <Text style={styles.episodeTitle}>
                        {podcast.title || 'Untitled Podcast'}
                    </Text>

                    {/* Playback Timeline */}
                    <View style={styles.timelineContainer}>
                        <View style={styles.timeRow}>
                            <Text style={styles.timeText}>{formatTime(position)}</Text>
                            <Text style={styles.timeText}>{formatTime(duration)}</Text>
                        </View>

                        <View style={styles.progressBarContainer}>
                            <View style={styles.progressBarBackground}>
                                <View
                                    style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Playback Controls */}
                    <View style={styles.controlsContainer}>
                        <TouchableOpacity
                            style={styles.secondaryControl}
                            onPress={() => skipSeconds(-10)}
                        >
                            <Replay10Icon size={30} color="#6B7280" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.primaryControl}
                            onPress={togglePlayPause}
                        >
                            <Ionicons
                                name={isPlaying ? 'pause' : 'play'}
                                size={40}
                                color="#FFFFFF"
                                style={!isPlaying ? { marginLeft: 4 } : {}}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryControl}
                            onPress={() => skipSeconds(10)}
                        >
                            <Forward10Icon size={30} color="#6B7280" />
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
        backgroundColor: '#F5F5F5',
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
        paddingVertical: 10,
        backgroundColor: '#E5E7EB',
        borderRadius: 30,
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
        marginBottom: 12,
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
        marginBottom: 32,
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    timeText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    progressBarContainer: {
        width: '100%',
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
        backgroundColor: '#000',
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
        marginTop: 32,
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

const waveformStyles = StyleSheet.create({
    container: {
        width: '100%', 
        height: 280,
        backgroundColor: '#000000', // Pure Black
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#27272a', // Subtle Zinc/Gray border
        shadowColor: "#E9D5FF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
    },
    visualizerContainer: {
        flexDirection: 'row',
        alignItems: 'center', // Centers bars vertically
        justifyContent: 'center',
        height: 140,
        gap: 4, // Space between bars (Use marginLeft if gap not supported)
    },
    bar: {
        width: 8, // Thickness of bars
        borderRadius: 50, // Fully rounded tips
    }
});