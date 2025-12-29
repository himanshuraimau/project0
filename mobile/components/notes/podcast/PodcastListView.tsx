import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { podcastApi, notesApi } from '@/lib/api';
import { LinearGradient } from 'expo-linear-gradient';
import PodcastGenerationModal from '@/components/podcast/PodcastGenerationModal';
import BackButton from '@/components/ui/BackButton';

interface PodcastListViewProps {
    noteId: string;
}

export default function PodcastListView({ noteId }: PodcastListViewProps) {
    const router = useRouter();

    const [podcasts, setPodcasts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
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
            setHasPodcast((data || []).length > 0);
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

    const handlePodcastPress = (podcast: any) => {
        // Navigate to player with podcast ID
        router.push(`/notes/${noteId}/podcast?podcastId=${podcast.id}`);
    };

    const handleGenerationComplete = async (podcast: any) => {
        // Refresh the podcasts list
        await loadPodcasts();
        // Navigate to the player
        router.push(`/notes/${noteId}/podcast?podcastId=${podcast.jobId}`);
    };

    const handleAddButtonPress = () => {
        if (hasPodcast) {
            Alert.alert(
                'Podcast Already Exists',
                'You can only generate one podcast per note. A podcast has already been created for this note.',
                [{ text: 'OK', style: 'default' }]
            );
        } else {
            setShowGenerationModal(true);
        }
    };

    const renderPodcastItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.podcastCard}
            onPress={() => handlePodcastPress(item)}
            activeOpacity={0.7}
        >
            <LinearGradient
                colors={['#E0E7FF', '#C7D2FE']}
                style={styles.podcastArtwork}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Ionicons name="musical-notes" size={32} color="#6366F1" />
            </LinearGradient>

            <View style={styles.podcastInfo}>
                <Text style={styles.podcastTitle} numberOfLines={2}>
                    {item.title || 'Untitled Podcast'}
                </Text>
                <View style={styles.podcastMeta}>
                    <Text style={styles.podcastMetaText}>
                        {formatDate(item.createdAt)}
                    </Text>
                    {item.duration && (
                        <>
                            <Text style={styles.podcastMetaDot}>•</Text>
                            <Text style={styles.podcastMetaText}>
                                {formatDuration(item.duration)}
                            </Text>
                        </>
                    )}
                </View>
                <View style={styles.statusBadge}>
                    <View
                        style={[
                            styles.statusDot,
                            {
                                backgroundColor:
                                    item.status === 'COMPLETED'
                                        ? '#10B981'
                                        : item.status === 'GENERATING'
                                            ? '#F59E0B'
                                            : '#EF4444',
                            },
                        ]}
                    />
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading podcasts...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <BackButton iconColor="#1F2937" />
        
                <Text style={styles.headerTitle}>Podcasts</Text>

                <TouchableOpacity
                    style={[
                        styles.addButton,
                        hasPodcast && styles.disabledButton
                    ]}
                    onPress={handleAddButtonPress}
                    disabled={hasPodcast}
                >
                    <Ionicons 
                        name="add" 
                        size={24} 
                        color={hasPodcast ? "#9CA3AF" : "#6366F1"} 
                    />
                </TouchableOpacity>
            </View>

            {podcasts.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="mic-off-outline" size={64} color="#9CA3AF" />
                    <Text style={styles.emptyText}>No podcasts yet</Text>
                    <Text style={styles.emptySubtext}>
                        Generate a podcast from your note to get started
                    </Text>
                    <TouchableOpacity
                        style={[
                            styles.generateButton,
                            hasPodcast && styles.disabledGenerateButton
                        ]}
                        onPress={handleAddButtonPress}
                        disabled={hasPodcast}
                    >
                        <Ionicons 
                            name="add-circle" 
                            size={20} 
                            color={hasPodcast ? "#9CA3AF" : "#FFFFFF"} 
                        />
                        <Text style={[
                            styles.generateButtonText,
                            hasPodcast && styles.disabledGenerateButtonText
                        ]}>
                            {hasPodcast ? "Podcast Limit Reached" : "Generate Podcast"}
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={podcasts}
                    renderItem={renderPodcastItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Generation Modal */}
            <PodcastGenerationModal
                visible={showGenerationModal}
                onClose={() => setShowGenerationModal(false)}
                noteId={noteId}
                noteContent={noteContent}
                onComplete={handleGenerationComplete}
            />
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
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#F3F4F6',
        opacity: 0.6,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    listContent: {
        padding: 16,
    },
    podcastCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    podcastArtwork: {
        width: 64,
        height: 64,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    podcastInfo: {
        flex: 1,
    },
    podcastTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 6,
    },
    podcastMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    podcastMetaText: {
        fontSize: 13,
        color: '#6B7280',
    },
    podcastMetaDot: {
        fontSize: 13,
        color: '#6B7280',
        marginHorizontal: 6,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '600',
        color: '#6B7280',
        textAlign: 'center',
    },
    emptySubtext: {
        marginTop: 8,
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        marginBottom: 24,
    },
    generateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6366F1',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
    },
    disabledGenerateButton: {
        backgroundColor: '#9CA3AF',
        opacity: 0.6,
    },
    generateButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    disabledGenerateButtonText: {
        color: '#6B7280',
    },
});