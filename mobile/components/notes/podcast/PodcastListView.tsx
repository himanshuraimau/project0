import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    ActivityIndicator,
    Alert,
    Modal,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { podcastApi, notesApi, Podcast } from '@/lib/api';
import PodcastGenerationModal from '@/components/podcast/PodcastGenerationModal';
import { useTheme } from '@/lib/hooks/useTheme';
import { neutral } from '@/lib/design-system';

const { width: SCREEN_W } = Dimensions.get('window');

interface PodcastListViewProps {
    noteId: string;
}

export default function PodcastListView({ noteId }: PodcastListViewProps) {
    const router = useRouter();
    const { theme, mode } = useTheme();
    const c = theme.colors;
    const isDark = mode === 'dark';

    const pageBg = isDark ? neutral[950] : '#f0f0f0';
    const cardBg = isDark ? neutral[900] : '#fff';
    const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

    const [podcasts, setPodcasts] = useState<Podcast[]>([]);
    const [loading, setLoading] = useState(true);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [showGenerationModal, setShowGenerationModal] = useState(false);
    const [noteContent, setNoteContent] = useState('');
    const [hasPodcast, setHasPodcast] = useState(false);

    useEffect(() => {
        loadPodcasts();
        loadNoteContent();
    }, [noteId]);

    const loadNoteContent = async () => {
        try {
            const note = await notesApi.getNoteById(noteId);
            setNoteContent(note.content || '');
        } catch (error) {
            console.error('Error loading note content:', error);
        }
    };

    const loadPodcasts = async () => {
        try {
            setLoading(true);
            const data = await podcastApi.getPodcastsByNoteId(noteId);
            setPodcasts(data || []);
            // Check if there's at least one completed podcast
            const hasCompletedPodcast = (data || []).some(p => p.status === 'COMPLETED');
            setHasPodcast(hasCompletedPodcast);
        } catch (error) {
            console.error('Error loading podcasts:', error);
            // Don't show alert for 404 - just means no podcasts yet
            if (error && (error as any).statusCode !== 404) {
                Alert.alert('Error', 'Failed to load podcasts');
            }
            setHasPodcast(false);
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const handlePodcastPress = (podcast: Podcast) => {
        // Navigate to player with podcast ID
        router.push(`/notes/${noteId}/podcast?podcastId=${podcast.id}`);
    };

    const handleGenerationComplete = async (podcast: any) => {
        // Refresh the podcasts list
        await loadPodcasts();
        // Navigate to the player - use jobId if available, otherwise id
        const podcastId = podcast.jobId || podcast.id;
        router.push(`/notes/${noteId}/podcast?podcastId=${podcastId}`);
    };

    const handleAddButtonPress = () => {
        if (hasPodcast) {
            Alert.alert(
                'Podcast Already Exists',
                'You can only generate one podcast per note. A podcast has already been created for this note.',
                [{ text: 'OK', style: 'default' }]
            );
        } else {
            setShowConfirmationModal(true);
        }
    };

    const handleConfirmGeneration = () => {
        setShowConfirmationModal(false);
        setShowGenerationModal(true);
    };

    const getStatusColor = (status: string) => {
        if (status === 'COMPLETED') return '#34C759';
        if (status === 'GENERATING') return '#FF9500';
        return '#FF3B30';
    };

    const renderPodcastItem = ({ item }: { item: Podcast }) => (
        <Pressable
            style={({ pressed }) => [
                {
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: cardBg,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: cardBorder,
                    opacity: pressed ? 0.7 : 1,
                },
            ]}
            onPress={() => handlePodcastPress(item)}
        >
            <View
                style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : c.accent,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 14,
                }}
            >
                <Ionicons name="headset" size={26} color={c.primary} />
            </View>

            <View style={{ flex: 1 }}>
                <Text
                    style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: c.foreground,
                        marginBottom: 6,
                    }}
                    numberOfLines={2}
                >
                    {item.title || 'Untitled Podcast'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ fontSize: 13, color: c.mutedForeground }}>
                        {formatDate(item.createdAt)}
                    </Text>
                    {item.duration && (
                        <>
                            <Text style={{ fontSize: 13, color: c.mutedForeground, marginHorizontal: 6 }}>
                                {'\u2022'}
                            </Text>
                            <Text style={{ fontSize: 13, color: c.mutedForeground }}>
                                {formatDuration(item.duration)}
                            </Text>
                        </>
                    )}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            marginRight: 6,
                            backgroundColor: getStatusColor(item.status),
                        }}
                    />
                    <Text
                        style={{
                            fontSize: 12,
                            color: c.mutedForeground,
                            fontWeight: '500',
                        }}
                    >
                        {item.status}
                    </Text>
                </View>
            </View>

            <Ionicons name="chevron-forward" size={20} color={c.mutedForeground} />
        </Pressable>
    );

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: pageBg }]}>
                <ActivityIndicator size="large" color={c.primary} />
                <Text style={[styles.loadingText, { color: c.mutedForeground }]}>
                    Loading podcasts...
                </Text>
            </View>
        );
    }

    const modalCardBg = isDark ? neutral[800] : '#fff';

    return (
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: pageBg }}>
            <View style={{ flex: 1, backgroundColor: pageBg }}>
                {/* Header */}
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                    }}
                >
                    <Pressable
                        style={({ pressed }) => ({
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : cardBg,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 0.5,
                            borderColor: cardBorder,
                            opacity: pressed ? 0.7 : 1,
                        })}
                        onPress={() => router.back()}
                    >
                        <Feather name="arrow-left" size={20} color={c.foreground} />
                    </Pressable>

                    <Text
                        style={{
                            fontSize: 18,
                            fontWeight: '600',
                            color: c.foreground,
                        }}
                    >
                        Podcasts
                    </Text>

                    <Pressable
                        style={({ pressed }) => ({
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: isDark
                                ? 'rgba(255,255,255,0.06)'
                                : `${c.primary}14`,
                            justifyContent: 'center',
                            alignItems: 'center',
                            opacity: hasPodcast ? 0.4 : pressed ? 0.7 : 1,
                        })}
                        onPress={handleAddButtonPress}
                        disabled={hasPodcast}
                    >
                        <Ionicons
                            name="add"
                            size={24}
                            color={hasPodcast ? c.mutedForeground : c.primary}
                        />
                    </Pressable>
                </View>

                {podcasts.length === 0 ? (
                    <View style={styles.centered}>
                        <View
                            style={{
                                width: 80,
                                height: 80,
                                borderRadius: 40,
                                backgroundColor: isDark
                                    ? 'rgba(255,255,255,0.06)'
                                    : `${c.primary}14`,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginBottom: 16,
                            }}
                        >
                            <Ionicons name="mic-off-outline" size={36} color={c.primary} />
                        </View>
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: '600',
                                color: c.foreground,
                                textAlign: 'center',
                            }}
                        >
                            No podcasts yet
                        </Text>
                        <Text
                            style={{
                                marginTop: 8,
                                fontSize: 14,
                                color: c.mutedForeground,
                                textAlign: 'center',
                                marginBottom: 24,
                            }}
                        >
                            Generate one podcast from your note to get started
                        </Text>
                        <Pressable
                            style={({ pressed }) => ({
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: hasPodcast ? c.muted : c.primary,
                                paddingVertical: 14,
                                paddingHorizontal: 24,
                                borderRadius: 14,
                                gap: 8,
                                opacity: hasPodcast ? 0.6 : pressed ? 0.8 : 1,
                            })}
                            onPress={handleAddButtonPress}
                            disabled={hasPodcast}
                        >
                            <Ionicons
                                name="add-circle"
                                size={20}
                                color={hasPodcast ? c.mutedForeground : c.primaryForeground}
                            />
                            <Text
                                style={{
                                    fontSize: 16,
                                    fontWeight: '600',
                                    color: hasPodcast ? c.mutedForeground : c.primaryForeground,
                                }}
                            >
                                {hasPodcast ? 'Podcast Limit Reached' : 'Generate Podcast'}
                            </Text>
                        </Pressable>
                    </View>
                ) : (
                    <FlatList
                        data={podcasts}
                        renderItem={renderPodcastItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ padding: 16 }}
                        showsVerticalScrollIndicator={false}
                    />
                )}

                {/* Confirmation Modal */}
                <Modal
                    visible={showConfirmationModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowConfirmationModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View
                            style={[
                                styles.modalCard,
                                { backgroundColor: modalCardBg },
                            ]}
                        >
                            <View style={{ alignItems: 'center', marginBottom: 16 }}>
                                <View
                                    style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 14,
                                        backgroundColor: isDark
                                            ? 'rgba(255,255,255,0.06)'
                                            : `${c.primary}14`,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginBottom: 12,
                                    }}
                                >
                                    <Ionicons name="information-circle" size={28} color={c.primary} />
                                </View>
                                <Text
                                    style={{
                                        fontSize: 18,
                                        fontWeight: '700',
                                        color: c.foreground,
                                        textAlign: 'center',
                                        letterSpacing: -0.3,
                                    }}
                                >
                                    Generate Podcast?
                                </Text>
                            </View>
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: c.mutedForeground,
                                    textAlign: 'center',
                                    marginBottom: 4,
                                    lineHeight: 20,
                                }}
                            >
                                This will convert your note into AI-generated audio narration. You can only generate one podcast per note. The process may take a few moments.
                            </Text>
                            <View style={{ width: '100%', marginTop: 20 }}>
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <Pressable
                                        style={({ pressed }) => ({
                                            flex: 1,
                                            height: 48,
                                            borderRadius: 14,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: isDark
                                                ? 'rgba(255,255,255,0.06)'
                                                : 'rgba(0,0,0,0.04)',
                                            opacity: pressed ? 0.8 : 1,
                                        })}
                                        onPress={() => setShowConfirmationModal(false)}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 16,
                                                fontWeight: '600',
                                                color: c.foreground,
                                                letterSpacing: -0.2,
                                            }}
                                        >
                                            Cancel
                                        </Text>
                                    </Pressable>
                                    <Pressable
                                        style={({ pressed }) => ({
                                            flex: 1,
                                            height: 48,
                                            borderRadius: 14,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: c.primary,
                                            opacity: pressed ? 0.8 : 1,
                                        })}
                                        onPress={handleConfirmGeneration}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 16,
                                                fontWeight: '600',
                                                color: c.primaryForeground,
                                                letterSpacing: -0.2,
                                            }}
                                        >
                                            OK
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Generation Modal */}
                <PodcastGenerationModal
                    visible={showGenerationModal}
                    onClose={() => setShowGenerationModal(false)}
                    noteId={noteId}
                    noteContent={noteContent}
                    onComplete={handleGenerationComplete}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    modalCard: {
        width: Math.min(SCREEN_W - 80, 320),
        borderRadius: 20,
        paddingTop: 28,
        paddingHorizontal: 24,
        paddingBottom: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,
    },
});
