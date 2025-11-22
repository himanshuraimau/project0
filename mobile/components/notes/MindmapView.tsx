import React, { useState, useEffect } from 'react';
import {
    StatusBar,
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Edit, ZoomIn, ZoomOut, Download, Share2 } from 'lucide-react-native';
import WebView from 'react-native-webview';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { notesApi } from '@/lib/api';
import { setClerkTokenGetter } from '@/lib/api/client';
import { getMindMapByNoteId, generateMindMap, deleteMindMap } from '@/lib/api/mindmap';
import type { Note, MindMap } from '@/lib/api/types';
import { getTranslatedNote } from '@/lib/utils/translation';
import BackButton from '@/components/ui/BackButton';

interface MindmapViewProps {
    noteId: string;
}

const MindmapView = ({ noteId }: MindmapViewProps) => {
    const router = useRouter();
    const { getToken } = useAuth();
    const [note, setNote] = useState<Note | null>(null);
    const [mindmap, setMindmap] = useState<MindMap | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Set up Clerk token getter on mount
    useEffect(() => {
        setClerkTokenGetter(getToken);
    }, [getToken]);

    // Fetch note and mindmap data on mount
    useEffect(() => {
        if (noteId) {
            fetchNoteAndMindmap();
        }
    }, [noteId]);

    const fetchNoteAndMindmap = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch note data
            const fetchedNote = await notesApi.getNoteById(noteId);
            setNote(fetchedNote);

            // Try to fetch existing mindmap
            try {
                const fetchedMindmap = await getMindMapByNoteId(noteId);
                console.log('Fetched mindmap:', fetchedMindmap);
                setMindmap(fetchedMindmap);
            } catch (mindmapError: any) {
                // If mindmap doesn't exist (404), generate a new one
                if (mindmapError.message?.includes('404') || mindmapError.message?.includes('not found')) {
                    console.log('No existing mindmap found, generating new one...');
                    await handleGenerateMindmap();
                } else {
                    throw mindmapError;
                }
            }
        } catch (err: any) {
            console.error('Failed to fetch note or mindmap:', err);
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateMindmap = async () => {
        try {
            setIsGenerating(true);
            setError(null);
            const generatedMindmap = await generateMindMap({ noteId });
            console.log('Generated mindmap:', generatedMindmap);
            setMindmap(generatedMindmap);
        } catch (err: any) {
            console.error('Failed to generate mindmap:', err);
            setError(err.message || 'Failed to generate mindmap');
        } finally {
            setIsGenerating(false);
        }
    };

    // Get translated content based on current language
    const getDisplayContent = () => {
        if (!note) return { title: '', content: '' };
        return getTranslatedNote(note);
    };

    const { title: displayTitle, content: displayContent } = getDisplayContent();

    // Format date to readable format
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Calculate estimated read time based on content length
    const calculateReadTime = (content: string) => {
        const wordsPerMinute = 200;
        const wordCount = content.split(/\s+/).length;
        const minutes = Math.ceil(wordCount / wordsPerMinute);
        return `${minutes} min read`;
    };

    // Generate HTML for Markmap rendering
    const generateMarkmapHTML = (markdownContent: string) => {
        // Escape special characters for embedding in JavaScript
        const escapedMarkdown = markdownContent
            .replace(/\\/g, '\\\\')
            .replace(/`/g, '\\`')
            .replace(/\$/g, '\\$');

        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes, maximum-scale=5.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; overflow: hidden; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; }
        #mindmap { width: 100%; height: 100%; }
        .status { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; padding: 20px; font-size: 14px; color: #7C3AED; }
        .error { color: #EF4444; }
    </style>
</head>
<body>
    <div class="status" id="status">Loading...</div>
    <svg id="mindmap"></svg>
    
    <script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
    <script src="https://cdn.jsdelivr.net/npm/markmap-view@0.15.4"></script>
    <script src="https://cdn.jsdelivr.net/npm/markmap-lib@0.15.4/dist/browser/index.js"></script>
    
    <script>
        const markdown = \`${escapedMarkdown}\`;
        let loadedScripts = 0;
        
        function log(msg) {
            console.log(msg);
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'log', message: msg }));
            }
        }
        
        function updateStatus(msg, isError = false) {
            const el = document.getElementById('status');
            if (el) {
                el.textContent = msg;
                el.className = isError ? 'status error' : 'status';
            }
        }
        
        function init() {
            try {
                log('Initializing Markmap...');
                updateStatus('Rendering...');
                
                if (!window.markmap) {
                    throw new Error('Markmap library not loaded');
                }
                
                const { Transformer, Markmap } = window.markmap;
                
                if (!Transformer) {
                    throw new Error('Transformer not available');
                }
                
                log('Transforming markdown...');
                const transformer = new Transformer();
                const { root } = transformer.transform(markdown);
                
                log('Creating Markmap instance...');
                const svg = document.getElementById('mindmap');
                const mm = Markmap.create(svg, {
                    duration: 500,
                    maxWidth: 300,
                    paddingX: 20,
                    spacingHorizontal: 80,
                    spacingVertical: 15,
                    pan: true,
                    zoom: true,
                    initialExpandLevel: 2,
                    color: (node) => {
                        const colors = ['#7C3AED', '#FF6B00', '#00B4D8', '#4A90E2', '#F03E89'];
                        return colors[node.depth % colors.length];
                    }
                }, root);
                
                log('Markmap created successfully');
                document.getElementById('status').style.display = 'none';
                
                setTimeout(() => {
                    mm.fit();
                    // Apply initial zoom after fit
                    const currentState = mm.state;
                    mm.setData(root, { ...currentState, zoom: (currentState.zoom || 1) * 1.3 });
                }, 100);
                
            } catch (error) {
                log('Error: ' + error.message);
                updateStatus('Error: ' + error.message, true);
            }
        }
        
        // Wait for all scripts to load
        window.addEventListener('load', () => {
            log('Window loaded');
            setTimeout(() => {
                if (window.markmap && window.markmap.Transformer) {
                    init();
                } else {
                    updateStatus('Libraries not loaded', true);
                }
            }, 300);
        });
    </script>
</body>
</html>`;
    };

    const handleBack = () => {
        router.back();
    };

    const handleDeleteMindmap = async () => {
        if (isDeleting || !mindmap) return;

        // Confirm deletion with native alert
        Alert.alert(
            'Delete Mindmap',
            'Are you sure you want to delete this mindmap? This action cannot be undone.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            await deleteMindMap(noteId);
                            // Reset state to show empty state with generate button
                            setMindmap(null);
                        } catch (err: any) {
                            console.error('Failed to delete mindmap:', err);
                            setError(err.message || 'Failed to delete mindmap');
                        } finally {
                            setIsDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    const handleZoomIn = () => {
        console.log('Zoom in');
    };

    const handleZoomOut = () => {
        console.log('Zoom out');
    };

    const handleSaveAsImage = () => {
        console.log('Save as image');
    };

    const handleShare = async () => {
        if (!mindmap) return;

        try {
            await Share.share({
                message: mindmap.mermaidCode,
                title: `Mindmap: ${displayTitle}`,
            });
        } catch (error: any) {
            console.error('Error sharing mindmap:', error);
            Alert.alert('Error', 'Failed to share mindmap');
        }
    };

    const handleCreateNew = () => {
        handleGenerateMindmap();
    };


    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.container}>
                    <View style={styles.header}>
                        <BackButton />
                        <View style={styles.titleContainer}>
                            <Text style={styles.title}>MindMap</Text>
                        </View>
                        <View style={styles.headerSpacer} />
                    </View>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#7C3AED" />
                        <Text style={styles.loadingText}>Loading...</Text>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    // Show error state
    if (error || !note) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.container}>
                    <View style={styles.header}>
                        <BackButton />
                        <View style={styles.titleContainer}>
                            <Text style={styles.title}>MindMap</Text>
                        </View>
                        <View style={styles.headerSpacer} />
                    </View>
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error || 'Failed to load note'}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={fetchNoteAndMindmap}>
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <BackButton />
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>MindMap</Text>
                    </View>
                    <TouchableOpacity
                        onPress={handleDeleteMindmap}
                        style={[styles.headerButton, isDeleting && styles.headerButtonDisabled]}
                        disabled={isDeleting || !mindmap}
                    >
                        {isDeleting ? (
                            <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                            <Feather name="trash-2" size={24} color={mindmap ? "#EF4444" : "#D1D5DB"} />
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    {/* Main Card */}
                    <View style={styles.card}>
                        {/* Title and Metadata */}
                        <View style={styles.titleSection}>
                            <Text style={styles.cardTitle}>{displayTitle}</Text>
                            <View style={styles.metadataRow}>
                                <Text style={styles.metadataText}>{formatDate(note.createdAt)}</Text>
                                <View style={styles.metadataDot} />
                                <Text style={styles.metadataText}>{calculateReadTime(displayContent)}</Text>
                            </View>
                        </View>

                        {/* Show generating state */}
                        {isGenerating ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#7C3AED" />
                                <Text style={styles.loadingText}>Generating mindmap...</Text>
                            </View>
                        ) : !mindmap ? (
                            <View style={styles.emptyStateContainer}>
                                <Feather name="help-circle" size={64} color="#7C3AED" />
                                <Text style={styles.emptyStateTitle}>No Mindmap Available</Text>
                                <Text style={styles.emptyStateSubtitle}>
                                    Generate a mindmap from this note to visualize key concepts
                                </Text>
                                <TouchableOpacity
                                    style={styles.generateButton}
                                    onPress={handleGenerateMindmap}
                                    disabled={isGenerating}
                                >
                                    {isGenerating ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <>
                                            <Feather name="zap" size={20} color="#FFFFFF" />
                                            <Text style={styles.generateButtonText}>Generate Mindmap</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                {/* Mindmap WebView Container */}
                                <View style={styles.mindMapWebViewContainer}>
                                    <WebView
                                        source={{ html: generateMarkmapHTML(mindmap.mermaidCode) }}
                                        style={styles.webView}
                                        scrollEnabled={true}
                                        scalesPageToFit={true}
                                        bounces={false}
                                        javaScriptEnabled={true}
                                        domStorageEnabled={true}
                                        startInLoadingState={true}
                                        onMessage={(event) => {
                                            try {
                                                const data = JSON.parse(event.nativeEvent.data);
                                                console.log(`[WebView ${data.type}]:`, data.message);
                                            } catch (e) {
                                                console.log('WebView message:', event.nativeEvent.data);
                                            }
                                        }}
                                        onError={(syntheticEvent) => {
                                            const { nativeEvent } = syntheticEvent;
                                            console.error('WebView error:', nativeEvent);
                                            setError('Failed to load mindmap visualization');
                                        }}
                                        onLoadEnd={() => {
                                            console.log('WebView loaded successfully');
                                        }}
                                        renderLoading={() => (
                                            <View style={styles.webViewLoading}>
                                                <ActivityIndicator size="large" color="#7C3AED" />
                                                <Text style={styles.loadingText}>Loading visualization...</Text>
                                            </View>
                                        )}
                                    />
                                </View>
                            </>
                        )}
                    </View>

                    {/* Footer Actions */}
                    {mindmap && (
                        <View style={styles.footer}>
                            {/* Save as Image Button */}
                            <TouchableOpacity onPress={handleSaveAsImage} style={styles.saveButton}>
                                <Download size={20} color="#FFF" />
                                <Text style={styles.saveButtonText}>Save as Image</Text>
                            </TouchableOpacity>

                            {/* Share and Create New Buttons */}
                            <View style={styles.actionRow}>
                                <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
                                    <Share2 size={20} color="#000" />
                                    <Text style={styles.shareButtonText}>Share</Text>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={handleCreateNew} style={styles.createButton}>
                                    <Text style={styles.createButtonText}>Regenerate</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerSpacer: {
        width: 48,
    },
    headerButton: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerButtonDisabled: {
        opacity: 0.5,
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
    },
    titleSection: {
        marginBottom: 24,
    },
    metadataRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metadataText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    metadataDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#6B7280',
        marginHorizontal: 8,
    },
    mindMapContainer: {
        minHeight: 500,
        paddingVertical: 20,
    },
    mindMapWebViewContainer: {
        height: 335,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    webView: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    webViewLoading: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    footer: {
        gap: 12,
    },
    saveButton: {
        backgroundColor: '#7C3AED',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    shareButton: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 8,
    },
    shareButtonText: {
        color: '#111827',
        fontSize: 16,
        fontWeight: '600',
    },
    createButton: {
        flex: 1,
        backgroundColor: '#7C3AED',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 40,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 16,
        textAlign: 'center',
        fontWeight: '600',
        marginBottom: 20,
    },
    retryButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: '#7C3AED',
        borderRadius: 12,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyStateTitle: {
        marginTop: 24,
        color: '#111827',
        fontSize: 24,
        textAlign: 'center',
        fontWeight: '700',
    },
    emptyStateSubtitle: {
        marginTop: 12,
        color: '#6B7280',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    generateButton: {
        marginTop: 32,
        paddingVertical: 16,
        paddingHorizontal: 32,
        backgroundColor: '#7C3AED',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minWidth: 200,
        justifyContent: 'center',
    },
    generateButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default MindmapView;