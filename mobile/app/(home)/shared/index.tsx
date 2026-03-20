import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { notesApi } from '@/lib/api';
import type { Note } from '@/lib/api/types';
import { getTranslatedNote } from '@/lib/utils/translation';
import BackButton from '@/components/ui/BackButton';

export default function SharedNotesScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSharedNotes();
    }, []);

    const fetchSharedNotes = async () => {
        try {
            setLoading(true);
            setError(null);
            const allNotes = await notesApi.getNotes();
            // Filter only cloned notes
            const sharedNotes = allNotes.filter(note => note.isCloned === true);
            setNotes(sharedNotes);
        } catch (err: any) {
            console.error('Failed to fetch shared notes:', err);
            setError(err.message || 'Failed to load shared notes');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchSharedNotes();
        setRefreshing(false);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const handleNotePress = (note: Note) => {
        router.push(`/notes/${note.id}`);
    };

    return (
        <LinearGradient
            colors={['#FFFFFF', '#f7f9ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <BackButton />
                    <Text style={styles.title}>{t('share.sharedWithMe')}</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Content */}
                <ScrollView
                    style={styles.content}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    {loading && !refreshing ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#4f3be7" />
                            <Text style={styles.loadingText}>{t('home.loadingNotes')}</Text>
                        </View>
                    ) : error ? (
                        <View style={styles.errorContainer}>
                            <Feather name="alert-circle" size={48} color="#EF4444" />
                            <Text style={styles.errorText}>{error}</Text>
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={fetchSharedNotes}
                            >
                                <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
                            </TouchableOpacity>
                        </View>
                    ) : notes.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Feather name="users" size={64} color="#D1D5DB" />
                            <Text style={styles.emptyTitle}>{t('share.noSharedNotes')}</Text>
                            <Text style={styles.emptySubtitle}>
                                {t('share.noSharedNotesMessage')}
                            </Text>
                        </View>
                    ) : (
                        notes.map((note) => {
                            const { title } = getTranslatedNote(note);
                            return (
                                <View key={note.id} style={styles.noteCardContainer}>
                                    <Pressable
                                        style={styles.noteCard}
                                        onPress={() => handleNotePress(note)}
                                    >
                                        <View style={styles.noteLeftIcon}>
                                            <Feather name="file-text" size={20} color="#6B7280" />
                                        </View>
                                        <View style={styles.noteBody}>
                                            <Text numberOfLines={2} style={styles.noteTitle}>
                                                {title}
                                            </Text>
                                            <View style={styles.noteFooter}>
                                                <Text style={styles.noteDate}>
                                                    {formatDate(note.createdAt)}
                                                </Text>
                                                <View style={styles.sharedBadge}>
                                                    <Feather name="users" size={10} color="#4f3be7" />
                                                    <Text style={styles.sharedBadgeText}>
                                                        {t('share.sharedWithMe')}
                                                    </Text>
                                                </View>
                                            </View>
                                            {note.originalAuthor && (
                                                <Text style={styles.authorText}>
                                                    {t('share.sharedBy', { name: note.originalAuthor })}
                                                </Text>
                                            )}
                                        </View>
                                        <View style={styles.noteActions}>
                                            <Feather name="chevron-right" size={20} color="#9CA3AF" />
                                        </View>
                                    </Pressable>
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '500',
        color: '#111827',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 12,
        color: '#6B7280',
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    errorText: {
        marginTop: 16,
        color: '#EF4444',
        fontSize: 16,
        textAlign: 'center',
        fontWeight: '600',
    },
    retryButton: {
        marginTop: 20,
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: '#4f3be7',
        borderRadius: 12,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        marginTop: 20,
        color: '#111827',
        fontSize: 20,
        fontWeight: '500',
        textAlign: 'center',
    },
    emptySubtitle: {
        marginTop: 8,
        color: '#6B7280',
        fontSize: 15,
        textAlign: 'center',
    },
    noteCardContainer: {
        marginBottom: 12,
    },
    noteCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    noteLeftIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#F9FAFB',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    noteBody: {
        flex: 1,
    },
    noteTitle: {
        color: '#111827',
        fontWeight: '500',
        fontSize: 16,
        marginBottom: 6,
    },
    noteFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    noteDate: {
        color: '#6B7280',
        fontSize: 13,
    },
    sharedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#ebeeff',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    sharedBadgeText: {
        color: '#4f3be7',
        fontSize: 10,
        fontWeight: '600',
    },
    authorText: {
        color: '#9CA3AF',
        fontSize: 12,
        fontStyle: 'italic',
    },
    noteActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
});
