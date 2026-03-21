import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Dimensions,
    ActivityIndicator,
    ScrollView,
    Alert,
    Animated,
    Easing,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import Svg, { Path } from 'react-native-svg';
import { podcastApi, Podcast } from '@/lib/api';
import { useTheme } from '@/lib/hooks/useTheme';
import { neutral } from '@/lib/design-system';

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
const PodcastWaveform = ({
    isPlaying,
    barColor,
    edgeBarColor,
    containerBg,
    borderColor,
}: {
    isPlaying: boolean;
    barColor: string;
    edgeBarColor: string;
    containerBg: string;
    borderColor: string;
}) => {
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
        <View style={[waveformStyles.container, {
            backgroundColor: containerBg,
            borderColor: borderColor,
        }]}>
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

                    // Color logic: Center is themed, Edges are muted
                    const color = isCenter ? barColor : edgeBarColor;

                    return (
                        <Animated.View
                            key={index}
                            style={[
                                waveformStyles.bar,
                                {
                                    height,
                                    backgroundColor: color,
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
    const { theme, mode } = useTheme();
    const c = theme.colors;
    const isDark = mode === 'dark';

    const pageBg = isDark ? neutral[950] : '#f0f0f0';
    const cardBg = isDark ? neutral[900] : '#fff';
    const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

    const [podcast, setPodcast] = useState<Podcast | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    const soundRef = useRef<Audio.Sound | null>(null);
    const playbackSpeedRef = useRef(1.0);
    const positionRef = useRef(0);
    const isPlayingRef = useRef(false);
    const durationRef = useRef(0);
    const animationFrameRef = useRef<number | null>(null);
    const lastUpdateTimeRef = useRef<number>(0);
    const ignoreNextCallbackRef = useRef(false); // Flag to ignore stale callbacks after seek

    useEffect(() => {
        loadPodcast();
        return () => {
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
            stopPositionAnimation();
        };
    }, [noteId, podcastId]);

    // Smooth position animation using requestAnimationFrame
    const startPositionAnimation = () => {
        lastUpdateTimeRef.current = Date.now();

        const animate = () => {
            if (!isPlayingRef.current) return;

            const now = Date.now();
            const deltaTime = now - lastUpdateTimeRef.current;
            lastUpdateTimeRef.current = now;

            // Calculate new position based on elapsed time and playback speed
            const increment = deltaTime * playbackSpeedRef.current;
            const newPosition = Math.min(positionRef.current + increment, durationRef.current);

            positionRef.current = newPosition;
            setPosition(newPosition);

            // Continue animation if still playing
            if (isPlayingRef.current && newPosition < durationRef.current) {
                animationFrameRef.current = requestAnimationFrame(animate);
            }
        };

        animationFrameRef.current = requestAnimationFrame(animate);
    };

    const stopPositionAnimation = () => {
        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
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
                {
                    shouldPlay: false,
                    progressUpdateIntervalMillis: 500, // Sync every 500ms for accuracy
                },
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
            // Update duration
            if (status.durationMillis) {
                setDuration(status.durationMillis);
                durationRef.current = status.durationMillis;
            }

            // Sync position from actual playback (source of truth)
            // But skip if we just did a seek operation to avoid jumping back
            if (status.positionMillis !== undefined && !ignoreNextCallbackRef.current) {
                positionRef.current = status.positionMillis;
                setPosition(status.positionMillis);
                lastUpdateTimeRef.current = Date.now();
            }

            // Reset the ignore flag after processing
            if (ignoreNextCallbackRef.current) {
                ignoreNextCallbackRef.current = false;
            }

            // Handle play state changes
            if (status.isPlaying !== isPlayingRef.current) {
                isPlayingRef.current = status.isPlaying;
                setIsPlaying(status.isPlaying);

                if (status.isPlaying) {
                    lastUpdateTimeRef.current = Date.now();
                    startPositionAnimation();
                } else {
                    stopPositionAnimation();
                }
            }

            // Handle playback completion
            if (status.didJustFinish) {
                isPlayingRef.current = false;
                setIsPlaying(false);
                stopPositionAnimation();
                positionRef.current = 0;
                setPosition(0);
                soundRef.current?.setPositionAsync(0);
            }
        }
    };

    const loadPodcast = async (retryCount = 0) => {
        const MAX_RETRIES = 3;
        const RETRY_DELAY = 2000; // 2 seconds

        try {
            setLoading(true);
            const podcasts = await podcastApi.getPodcastsByNoteId(noteId);

            if (podcasts && podcasts.length > 0) {
                // If podcastId is provided, find that specific podcast
                // Check both 'id' and 'jobId' since navigation might use either
                // Otherwise, use the latest (first) podcast that has audio available
                let selectedPodcast = podcastId
                    ? podcasts.find(p => p.id === podcastId || p.jobId === podcastId)
                    : podcasts.find(p => p.status === 'COMPLETED' && p.audioUrl) || podcasts[0];

                // If we're looking for a specific podcast by jobId and didn't find it,
                // it might still be syncing - retry a few times
                if (!selectedPodcast && podcastId && retryCount < MAX_RETRIES) {
                    setTimeout(() => {
                        loadPodcast(retryCount + 1);
                    }, RETRY_DELAY);
                    return;
                }

                if (selectedPodcast) {
                    const status = selectedPodcast.status as string;

                    // Check if podcast is completed but audio is not yet available
                    if (status === 'COMPLETED' && !selectedPodcast.audioUrl) {
                        Alert.alert(
                            'Processing',
                            'Your podcast is being finalized. Please wait a moment and try again.',
                            [{ text: 'OK', onPress: () => router.back() }]
                        );
                        return;
                    }

                    // Check if podcast is still generating
                    if (status === 'GENERATING' || status === 'IN_PROGRESS') {
                        Alert.alert(
                            'Still Generating',
                            'Your podcast is still being generated. Please check back in a few minutes.',
                            [{ text: 'OK', onPress: () => router.back() }]
                        );
                        return;
                    }

                    // Check if podcast failed
                    if (status === 'FAILED') {
                        Alert.alert(
                            'Generation Failed',
                            'This podcast failed to generate. Please try generating a new one.',
                            [{ text: 'OK', onPress: () => router.back() }]
                        );
                        return;
                    }

                    // Check if podcast is superseded
                    if (status === 'SUPERSEDED') {
                        Alert.alert(
                            'Outdated Podcast',
                            'This podcast has been replaced by a newer version.',
                            [{ text: 'OK', onPress: () => router.back() }]
                        );
                        return;
                    }

                    setPodcast(selectedPodcast);

                    if (selectedPodcast.audioUrl) {
                        await setupAudio(selectedPodcast.audioUrl);
                    } else {
                        Alert.alert(
                            'Audio Not Available',
                            'The podcast audio is not yet available. Please try again in a moment.',
                            [{ text: 'OK', onPress: () => router.back() }]
                        );
                    }
                } else if (podcastId) {
                    Alert.alert('Error', 'Podcast not found');
                }
            } else if (podcastId && retryCount < MAX_RETRIES) {
                // Podcasts list is empty but we're looking for a specific one
                // It might still be syncing - retry
                setTimeout(() => {
                    loadPodcast(retryCount + 1);
                }, RETRY_DELAY);
                return;
            }
        } catch (error) {
            console.error('Error loading podcast:', error);
            Alert.alert('Error', 'Failed to load podcast');
        } finally {
            setLoading(false);
        }
    };

    const togglePlayPause = async () => {
        if (!soundRef.current) return;

        try {
            if (isPlaying) {
                stopPositionAnimation();
                await soundRef.current.pauseAsync();
            } else {
                lastUpdateTimeRef.current = Date.now();
                await soundRef.current.playAsync();
                // Animation will start via onPlaybackStatusUpdate callback
            }
        } catch (error) {
            console.error('Error toggling playback:', error);
        }
    };

    const skipSeconds = async (seconds: number) => {
        if (!soundRef.current) return;

        try {
            // Calculate new position
            const newPosition = Math.max(0, Math.min(durationRef.current, positionRef.current + seconds * 1000));

            // Update local state immediately for responsive UI
            positionRef.current = newPosition;
            setPosition(newPosition);
            lastUpdateTimeRef.current = Date.now();

            // Set flag to ignore the next callback (which will have stale position)
            ignoreNextCallbackRef.current = true;

            // Seek the audio
            await soundRef.current.setPositionAsync(newPosition);
        } catch (error) {
            console.error('Error skipping:', error);
            ignoreNextCallbackRef.current = false;
        }
    };

    const changePlaybackSpeed = async () => {
        const speeds = [1.0, 1.25, 1.5, 1.75, 2.0];
        const currentIndex = speeds.indexOf(playbackSpeed);
        const nextSpeed = speeds[(currentIndex + 1) % speeds.length];

        // Update speed in state and ref immediately
        setPlaybackSpeed(nextSpeed);
        playbackSpeedRef.current = nextSpeed;

        // Reset timing to prevent jumps when speed changes
        lastUpdateTimeRef.current = Date.now();

        if (soundRef.current) {
            try {
                // Set flag to ignore stale callback
                ignoreNextCallbackRef.current = true;
                await soundRef.current.setRateAsync(nextSpeed, true);
            } catch (error) {
                console.error('Error changing speed:', error);
                ignoreNextCallbackRef.current = false;
            }
        }
    };

    const handleDownload = async () => {
        if (!podcast?.audioUrl) return;

        try {
            setIsDownloading(true);

            // Generate filename
            const fileName = `${podcast.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_podcast.mp3`;
            const fileUri = `${FileSystem.documentDirectory}${fileName}`;

            // Download the file
            const downloadResult = await FileSystem.downloadAsync(
                podcast.audioUrl,
                fileUri
            );

            if (downloadResult.status === 200) {
                // For Android 11+, use Storage Access Framework
                if (FileSystem.StorageAccessFramework) {
                    try {
                        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

                        if (permissions.granted) {
                            const uri = await FileSystem.StorageAccessFramework.createFileAsync(
                                permissions.directoryUri,
                                fileName,
                                'audio/mpeg'
                            );

                            const content = await FileSystem.readAsStringAsync(downloadResult.uri, {
                                encoding: FileSystem.EncodingType.Base64,
                            });

                            await FileSystem.writeAsStringAsync(uri, content, {
                                encoding: FileSystem.EncodingType.Base64,
                            });

                            Alert.alert('Success', 'Podcast downloaded successfully to your selected folder!');
                        } else {
                            Alert.alert('Info', `Podcast saved to app folder: ${fileName}`);
                        }
                    } catch (safError) {
                        console.error('SAF error:', safError);
                        Alert.alert('Info', `Podcast saved to app folder: ${fileName}`);
                    }
                } else {
                    // For iOS or older Android, file is already in documentDirectory
                    Alert.alert('Success', `Podcast downloaded successfully: ${fileName}`);
                }
            } else {
                throw new Error('Download failed');
            }
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
            setIsSharing(true);

            const isAvailable = await Sharing.isAvailableAsync();
            if (!isAvailable) {
                Alert.alert('Error', 'Sharing is not available on this device');
                return;
            }

            // Download the file to a temporary location first
            const fileName = `${podcast.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_podcast.mp3`;
            const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

            const downloadResult = await FileSystem.downloadAsync(
                podcast.audioUrl,
                fileUri
            );

            if (downloadResult.status === 200) {
                // Share the local file
                await Sharing.shareAsync(downloadResult.uri, {
                    mimeType: 'audio/mpeg',
                    dialogTitle: 'Share Podcast',
                    UTI: 'public.audio'
                });
            } else {
                throw new Error('Failed to prepare file for sharing');
            }
        } catch (error) {
            console.error('Error sharing:', error);
            Alert.alert('Error', 'Failed to share podcast. Please try again.');
        } finally {
            setIsSharing(false);
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

    // --- Dynamic styles that depend on theme ---
    const styles = makeStyles(c, isDark, pageBg, cardBg, cardBorder);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <ActivityIndicator size="large" color={c.primary} />
                <Text style={styles.loadingText}>Loading podcast...</Text>
            </View>
        );
    }

    if (!podcast) {
        return (
            <View style={styles.emptyContainer}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <Ionicons name="mic-off-outline" size={64} color={c.mutedForeground} />
                <Text style={styles.emptyText}>No podcast available</Text>
                <Pressable
                    style={({ pressed }) => [
                        styles.goBackButton,
                        { opacity: pressed ? 0.8 : 1 },
                    ]}
                    onPress={() => router.back()}
                >
                    <Text style={styles.goBackButtonText}>Go Back</Text>
                </Pressable>
            </View>
        );
    }

    const progress = duration > 0 ? position / duration : 0;

    return (
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: pageBg }}>
            <View style={styles.container}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

                {/* Header */}
                <View style={styles.header}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.headerButton,
                            { opacity: pressed ? 0.7 : 1 },
                        ]}
                        onPress={() => router.back()}
                    >
                        <Feather name="arrow-left" size={20} color={c.foreground} />
                    </Pressable>

                    <Text style={styles.headerTitle}>Podcast</Text>

                    <View style={styles.headerActions}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.headerButton,
                                { opacity: pressed ? 0.7 : 1 },
                            ]}
                            onPress={handleDownload}
                            disabled={isDownloading}
                        >
                            {isDownloading ? (
                                <ActivityIndicator size="small" color={c.foreground} />
                            ) : (
                                <Ionicons name="download-outline" size={20} color={c.foreground} />
                            )}
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [
                                styles.headerButton,
                                { marginLeft: 10, opacity: pressed ? 0.7 : 1 },
                            ]}
                            onPress={handleShare}
                            disabled={isSharing}
                        >
                            {isSharing ? (
                                <ActivityIndicator size="small" color={c.foreground} />
                            ) : (
                                <Ionicons name="share-outline" size={20} color={c.foreground} />
                            )}
                        </Pressable>
                    </View>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Main Card */}
                    <View style={styles.mainCard}>
                        {/* Card Header Controls */}
                        <View style={styles.cardHeader}>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.speedButton,
                                    { opacity: pressed ? 0.7 : 1 },
                                ]}
                                onPress={changePlaybackSpeed}
                            >
                                <Text style={styles.speedButtonText}>{playbackSpeed}x</Text>
                            </Pressable>

                            <Pressable
                                style={({ pressed }) => [
                                    styles.viewAllButton,
                                    { opacity: pressed ? 0.7 : 1 },
                                ]}
                                onPress={navigateToAllPodcasts}
                            >
                                <Text style={styles.viewAllButtonText}>View All Podcasts</Text>
                            </Pressable>
                        </View>

                        {/* Podcast Artwork */}
                        <View style={styles.artworkContainer}>
                            <PodcastWaveform
                                isPlaying={isPlaying}
                                barColor={isDark ? c.ring : '#d7dcff'}
                                edgeBarColor={c.mutedForeground}
                                containerBg={c.foreground}
                                borderColor={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}
                            />
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
                            <Pressable
                                style={({ pressed }) => [
                                    styles.secondaryControl,
                                    { opacity: pressed ? 0.7 : 1 },
                                ]}
                                onPress={() => skipSeconds(-10)}
                            >
                                <Replay10Icon size={30} color={c.mutedForeground} />
                            </Pressable>

                            <Pressable
                                style={({ pressed }) => [
                                    styles.primaryControl,
                                    { opacity: pressed ? 0.85 : 1 },
                                ]}
                                onPress={togglePlayPause}
                            >
                                <Ionicons
                                    name={isPlaying ? 'pause' : 'play'}
                                    size={40}
                                    color={c.background}
                                    style={!isPlaying ? { marginLeft: 4 } : {}}
                                />
                            </Pressable>

                            <Pressable
                                style={({ pressed }) => [
                                    styles.secondaryControl,
                                    { opacity: pressed ? 0.7 : 1 },
                                ]}
                                onPress={() => skipSeconds(10)}
                            >
                                <Forward10Icon size={30} color={c.mutedForeground} />
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

// --- Factory function for theme-aware styles ---
const makeStyles = (
    c: ReturnType<typeof useTheme>['theme']['colors'],
    isDark: boolean,
    pageBg: string,
    cardBg: string,
    cardBorder: string,
) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: pageBg,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: pageBg,
        },
        loadingText: {
            marginTop: 16,
            fontSize: 16,
            color: c.mutedForeground,
        },
        emptyContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: pageBg,
            padding: 24,
        },
        emptyText: {
            marginTop: 16,
            fontSize: 18,
            color: c.mutedForeground,
            textAlign: 'center',
        },
        goBackButton: {
            marginTop: 24,
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: c.primary,
            borderRadius: 14,
        },
        goBackButtonText: {
            color: c.primaryForeground,
            fontSize: 16,
            fontWeight: '600',
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
        },
        headerButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : cardBg,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 0.5,
            borderColor: cardBorder,
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: c.foreground,
        },
        headerActions: {
            flexDirection: 'row',
        },
        scrollContent: {
            paddingVertical: 10,
            alignItems: 'center',
        },
        mainCard: {
            width: CARD_WIDTH,
            borderRadius: 24,
            backgroundColor: cardBg,
            borderWidth: 1,
            borderColor: cardBorder,
            padding: 20,
            overflow: 'hidden',
        },
        cardHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 12,
        },
        speedButton: {
            paddingHorizontal: 16,
            paddingVertical: 10,
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : neutral[100],
            borderRadius: 30,
            borderWidth: 0.5,
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : neutral[200],
        },
        speedButtonText: {
            fontSize: 14,
            fontWeight: '600',
            color: c.foreground,
        },
        viewAllButton: {
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : `${c.primary}14`,
            borderRadius: 20,
        },
        viewAllButtonText: {
            fontSize: 14,
            fontWeight: '600',
            color: c.primary,
        },
        artworkContainer: {
            width: '100%',
            aspectRatio: 1,
            marginBottom: 8,
        },
        episodeTitle: {
            fontSize: 20,
            fontWeight: '600',
            color: c.foreground,
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
            color: c.mutedForeground,
            fontWeight: '500',
        },
        progressBarContainer: {
            width: '100%',
        },
        progressBarBackground: {
            height: 4,
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : neutral[200],
            borderRadius: 2,
            overflow: 'hidden',
        },
        progressBarFill: {
            height: '100%',
            backgroundColor: c.primary,
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
            borderWidth: 0.5,
            borderColor: cardBorder,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : neutral[50],
            position: 'relative',
        },
        primaryControl: {
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: c.foreground,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: c.foreground,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 8,
        },
    });

// --- Static waveform styles (no theme dependency for layout) ---
const waveformStyles = StyleSheet.create({
    container: {
        width: '100%',
        height: 280,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
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
        gap: 4, // Space between bars
    },
    bar: {
        width: 8, // Thickness of bars
        borderRadius: 50, // Fully rounded tips
    }
});
