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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { podcastApi } from '@/lib/api';
import { LinearGradient } from 'expo-linear-gradient';

export default function AllPodcastsScreen() {
    const { id: noteId } = useLocalSearchParams();
    const router = useRouter();

    const [podcasts, setPodcasts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPodcasts();
    }, [noteId]);

    const loadPodcasts = async () => {
        try {
            setLoading(true);
            const data = await podcastApi.getPodcastsByNoteId(noteId as string);
            setPodcasts(data || []);
        } catch (error) {
            console.error('Error loading podcasts:', error);
            Alert.alert('Error', 'Failed to load podcasts');
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
        router.push(`/notes/${noteId}/podcast`);
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
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>All Podcasts</Text>

                <View style={styles.headerButton} />
            </View>

            {podcasts.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="mic-off-outline" size={64} color="#9CA3AF" />
                    <Text style={styles.emptyText}>No podcasts yet</Text>
                    <Text style={styles.emptySubtext}>
                        Generate a podcast from your note to get started
                    </Text>
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
    },
});
