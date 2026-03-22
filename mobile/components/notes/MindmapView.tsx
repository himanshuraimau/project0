import React, { useState, useEffect, useRef } from 'react';
import {
    StatusBar,
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import WebView from 'react-native-webview';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { notesApi } from '@/lib/api';
import { getMindMapByNoteId, generateMindMap, deleteMindMap } from '@/lib/api/mindmap';
import type { Note, MindMap } from '@/lib/api/types';
import { getTranslatedNote } from '@/lib/utils/translation';
import { useAlert } from '@/lib/contexts/AlertContext';
import { useTheme } from '@/lib/hooks/useTheme';
import { neutral } from '@/lib/design-system';

interface MindmapViewProps {
    noteId: string;
}

const MindmapView = ({ noteId }: MindmapViewProps) => {
    const router = useRouter();
    const { showAlert } = useAlert();
    const { theme, mode } = useTheme();
    const c = theme.colors;
    const isDark = mode === 'dark';
    const pageBg = isDark ? neutral[950] : '#f0f0f0';
    const cardBg = isDark ? neutral[900] : '#fff';
    const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
    const webViewRef = useRef<WebView>(null);
    const [note, setNote] = useState<Note | null>(null);
    const [mindmap, setMindmap] = useState<MindMap | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [markdownInput, setMarkdownInput] = useState('');
    const viewShotRef = useRef(null);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const captureResolveRef = useRef<((uri: string | null) => void) | null>(null);

    // Fetch note and mindmap data on mount
    useEffect(() => {
        if (noteId) {
            fetchNoteAndMindmap();
        }
    }, [noteId]);

    // Sync markdown input with mindmap data
    useEffect(() => {
        if (mindmap) {
            setMarkdownInput(mindmap.mermaidCode);
        }
    }, [mindmap]);

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
                    console.log('No existing mindmap found, waiting for user to generate...');
                    // Do nothing, let the UI show the generate button
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

    const handleMarkdownChange = (text: string) => {
        setMarkdownInput(text);

        // Debounce updates to the visualization (optional if we want to update mindmap object)
        // For local preview, we use markdownInput directly in generateMarkmapHTML
    };

    const toggleEditMode = () => {
        setIsEditing(!isEditing);
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

        const bgColor = isDark ? '#0a0a0a' : '#ffffff';
        const textColor = isDark ? '#f5f5f5' : '#111827';
        const statusColor = isDark ? '#858dff' : '#4f3be7';
        const errorColor = isDark ? '#f14d4c' : '#EF4444';

        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes, maximum-scale=5.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; overflow: hidden; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: ${bgColor}; color: ${textColor}; }
        #mindmap { width: 100%; height: 100%; }
        .status { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; padding: 20px; font-size: 14px; color: ${statusColor}; }
        .error { color: ${errorColor}; }
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
                    initialExpandLevel: -1,
                    color: (node) => {
                        const colors = ['#4f3be7', '#FF6B00', '#00B4D8', '#4A90E2', '#F03E89'];
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
        showAlert(
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

    const captureMindmapImage = async () => {
        if (!webViewRef.current) {
            console.error('WebView ref not available');
            return null;
        }

        return new Promise<string | null>((resolve) => {
            // Store the resolve function so handleWebViewMessage can call it
            captureResolveRef.current = resolve;

            // Set timeout for capture
            const timeout = setTimeout(() => {
                console.error('Capture timeout reached');
                if (captureResolveRef.current) {
                    captureResolveRef.current(null);
                    captureResolveRef.current = null;
                }
            }, 15000);

            // Store timeout ID for cleanup
            const originalResolve = resolve;
            captureResolveRef.current = (uri: string | null) => {
                clearTimeout(timeout);
                originalResolve(uri);
            };

            // Inject JavaScript to capture the full SVG
            const captureScript = `
                (function() {
                    try {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'log',
                            message: 'Starting capture...'
                        }));

                        const svg = document.querySelector('svg');
                        if (!svg) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'capture_error',
                                message: 'No SVG found'
                            }));
                            return;
                        }

                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'log',
                            message: 'SVG found, getting bbox...'
                        }));

                        // Get the actual bounding box of all SVG content
                        const bbox = svg.getBBox();

                        // Add padding around the content (increased for better visibility)
                        const padding = 80;
                        const width = bbox.width + (padding * 2);
                        const height = bbox.height + (padding * 2);

                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'log',
                            message: 'Size: ' + width + 'x' + height
                        }));

                        // Clone the SVG
                        const svgClone = svg.cloneNode(true);

                        // Set proper dimensions and viewBox to capture all content
                        svgClone.setAttribute('width', width);
                        svgClone.setAttribute('height', height);
                        svgClone.setAttribute('viewBox',
                            (bbox.x - padding) + ' ' +
                            (bbox.y - padding) + ' ' +
                            width + ' ' +
                            height
                        );

                        // Serialize the SVG
                        const svgData = new XMLSerializer().serializeToString(svgClone);

                        // Create a canvas to convert SVG to PNG
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');

                        // Set canvas size (scale up for maximum quality - 8x resolution for ultra-sharp output)
                        const scale = 10;
                        canvas.width = width * scale;
                        canvas.height = height * scale;

                        // Create an image
                        const img = new Image();

                        img.onload = function() {
                            try {
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'log',
                                    message: 'Image loaded, drawing to canvas...'
                                }));

                                // Enable maximum quality rendering
                                ctx.imageSmoothingEnabled = true;
                                ctx.imageSmoothingQuality = 'high';

                                // Use better compositing for sharper output
                                ctx.globalCompositeOperation = 'source-over';

                                // Fill white background
                                ctx.fillStyle = '#ffffff';
                                ctx.fillRect(0, 0, canvas.width, canvas.height);

                                // Scale context for high-quality rendering
                                ctx.scale(scale, scale);

                                // Draw the image with explicit dimensions for sharpest output
                                ctx.drawImage(img, 0, 0, width, height);

                                // Convert to PNG data URL with maximum quality
                                const dataUrl = canvas.toDataURL('image/png', 1.0);

                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'log',
                                    message: 'Canvas converted to PNG, size: ' + dataUrl.length
                                }));

                                // Send to React Native
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'capture_image',
                                    data: dataUrl
                                }));
                            } catch (drawErr) {
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'capture_error',
                                    message: 'Error drawing: ' + drawErr.toString()
                                }));
                            }
                        };

                        img.onerror = function(err) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'capture_error',
                                message: 'Failed to load SVG as image'
                            }));
                        };

                        // Convert SVG to base64 data URL (works in React Native WebView)
                        const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
                        const svgDataUrl = 'data:image/svg+xml;base64,' + svgBase64;

                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'log',
                            message: 'Loading SVG into image...'
                        }));

                        img.src = svgDataUrl;

                    } catch (err) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'capture_error',
                            message: err.toString()
                        }));
                    }
                })();
                true;
            `;

            // Inject the script
            webViewRef.current?.injectJavaScript(captureScript);
        });
    };

    const handleSaveAsImage = async () => {
        if (isSaving) return;

        setIsSaving(true);

        try {
            // Request media library permissions
            const { status } = await MediaLibrary.requestPermissionsAsync(true);
            if (status !== 'granted') {
                showAlert('Permission Required', 'Please grant permission to save images to your photo library.');
                return;
            }

            const uri = await captureMindmapImage();
            if (!uri) {
                throw new Error('Failed to capture mindmap image');
            }

            // Save to media library
            const asset = await MediaLibrary.createAssetAsync(uri);
            await MediaLibrary.createAlbumAsync('Mindmaps', asset, false);

            // Show success alert
            showAlert('Mindmap Saved', 'Your mindmap has been saved to your photo library.');

        } catch (err: any) {
            console.error('Failed to save image:', err);
            showAlert('Error', 'Failed to save image: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleWebViewMessage = async (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.type === 'capture_image') {
                // Handle capture for download
                const base64Data = data.data.replace(/^data:image\/png;base64,/, '');

                // Create file path
                const filename = `mindmap_${Date.now()}.png`;
                const cacheDir = FileSystem.cacheDirectory;
                if (!cacheDir) {
                    console.error('Cache directory not available');
                    if (captureResolveRef.current) {
                        captureResolveRef.current(null);
                        captureResolveRef.current = null;
                    }
                    return;
                }
                const fileUri = cacheDir + filename;

                // Write base64 to file
                await FileSystem.writeAsStringAsync(fileUri, base64Data, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                // Resolve the promise with the file URI
                if (captureResolveRef.current) {
                    captureResolveRef.current(fileUri);
                    captureResolveRef.current = null;
                }
            } else if (data.type === 'capture_error') {
                console.error('Capture error:', data.message);
                if (captureResolveRef.current) {
                    captureResolveRef.current(null);
                    captureResolveRef.current = null;
                }
            } else if (data.type === 'log') {
                console.log(`[WebView]:`, data.message);
            }
        } catch (err: any) {
            console.error('Failed to process WebView message:', err);
            if (captureResolveRef.current) {
                captureResolveRef.current(null);
                captureResolveRef.current = null;
            }
        }
    };

    const handleCreateNew = () => {
        handleGenerateMindmap();
    };

    const styles = StyleSheet.create({
        safeArea: {
            flex: 1,
            backgroundColor: pageBg,
        },
        container: {
            flex: 1,
            backgroundColor: pageBg,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 10,
            backgroundColor: pageBg,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: cardBorder,
        },
        headerBackBtn: {
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        titleContainer: {
            flex: 1,
            alignItems: 'center',
        },
        title: {
            fontSize: 17,
            fontWeight: '600',
            color: c.foreground,
            textAlign: 'center',
        },
        headerButtons: {
            flexDirection: 'row',
            gap: 8,
        },
        headerIconBtn: {
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        headerButtonDisabled: {
            opacity: 0.5,
        },
        scrollView: {
            flex: 1,
            backgroundColor: pageBg,
        },
        scrollContent: {
            paddingHorizontal: 20,
            paddingVertical: 20,
        },
        card: {
            backgroundColor: cardBg,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: cardBorder,
            paddingHorizontal: 10,
            paddingVertical: 20,
            marginBottom: 16,
        },
        cardTitle: {
            fontSize: 20,
            fontWeight: '500',
            color: c.foreground,
            marginBottom: 12,
        },
        mindMapWebViewContainer: {
            height: 335,
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: pageBg,
            borderWidth: 1,
            borderColor: cardBorder,
        },
        markdownInput: {
            flex: 1,
            padding: 15,
            fontSize: 14,
            fontFamily: 'monospace',
            color: c.foreground,
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            borderRadius: 12,
        },
        webView: {
            flex: 1,
            backgroundColor: pageBg,
        },
        webViewLoading: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: pageBg,
        },
        footer: {
            gap: 12,
            marginTop: 20,
        },
        saveButton: {
            backgroundColor: c.foreground,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: 54,
            borderRadius: 16,
            gap: 8,
        },
        saveButtonDisabled: {
            opacity: 0.6,
        },
        saveButtonText: {
            color: c.background,
            fontSize: 16,
            fontWeight: '600',
        },
        createButton: {
            backgroundColor: c.primary,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: 54,
            borderRadius: 16,
            width: '100%',
        },
        createButtonText: {
            color: c.primaryForeground,
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
            color: c.mutedForeground,
            fontWeight: '500',
        },
        errorContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 40,
            paddingHorizontal: 40,
        },
        errorIconCircle: {
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: 'rgba(255,59,48,0.12)',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
        },
        errorText: {
            color: c.destructive,
            fontSize: 16,
            textAlign: 'center',
            fontWeight: '600',
            marginBottom: 20,
        },
        retryButton: {
            height: 48,
            paddingHorizontal: 32,
            backgroundColor: c.primary,
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
        },
        retryButtonText: {
            color: c.primaryForeground,
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
        emptyIconCircle: {
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: isDark ? 'rgba(79,59,231,0.15)' : 'rgba(79,59,231,0.1)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        emptyStateTitle: {
            marginTop: 20,
            color: c.foreground,
            fontSize: 22,
            textAlign: 'center',
            fontWeight: '600',
        },
        emptyStateSubtitle: {
            marginTop: 8,
            color: c.mutedForeground,
            fontSize: 15,
            textAlign: 'center',
            lineHeight: 22,
        },
        generateButton: {
            marginTop: 28,
            height: 52,
            paddingHorizontal: 32,
            backgroundColor: c.primary,
            borderRadius: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            minWidth: 200,
            justifyContent: 'center',
        },
        generateButtonText: {
            color: c.primaryForeground,
            fontSize: 16,
            fontWeight: '600',
            marginLeft: 4,
        },
        backButtonError: {
            marginTop: 12,
            paddingVertical: 12,
            paddingHorizontal: 24,
        },
        backButtonErrorText: {
            color: c.mutedForeground,
            fontSize: 16,
            fontWeight: '600',
        },
    });

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <View style={styles.container}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={c.primary} />
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
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <View style={styles.container}>
                    {/* Error header with back arrow */}
                    <View style={styles.header}>
                        <Pressable
                            onPress={() => router.back()}
                            style={({ pressed }) => [styles.headerBackBtn, { opacity: pressed ? 0.7 : 1 }]}
                        >
                            <Feather name="arrow-left" size={20} color={c.foreground} />
                        </Pressable>
                        <View style={styles.titleContainer}>
                            <Text style={styles.title}>Mind Map</Text>
                        </View>
                        <View style={{ width: 34 }} />
                    </View>
                    <View style={styles.errorContainer}>
                        <View style={styles.errorIconCircle}>
                            <Feather name="alert-circle" size={32} color="#FF3B30" />
                        </View>
                        <Text style={styles.errorText}>{error || 'Failed to load note'}</Text>
                        <Pressable
                            style={({ pressed }) => [styles.retryButton, { opacity: pressed ? 0.7 : 1 }]}
                            onPress={fetchNoteAndMindmap}
                        >
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </Pressable>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    // Show generating state
    if (isGenerating) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <View style={styles.container}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={c.primary} />
                        <Text style={styles.loadingText}>Generating mindmap...</Text>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    // Show empty state without header
    if (!mindmap) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <View style={styles.container}>
                    <View style={styles.emptyStateContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="git-network" size={34} color={c.primary} />
                        </View>
                        <Text style={styles.emptyStateTitle}>No Mind Map Yet</Text>
                        <Text style={styles.emptyStateSubtitle}>
                            Generate a mind map from this note to visualize key concepts
                        </Text>
                        <Pressable
                            style={({ pressed }) => [styles.generateButton, { opacity: pressed ? 0.7 : 1 }]}
                            onPress={handleGenerateMindmap}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <ActivityIndicator size="small" color={c.primaryForeground} />
                            ) : (
                                <>
                                    <Ionicons name="flash" size={20} color={c.primaryForeground} />
                                    <Text style={styles.generateButtonText}>Generate Mind Map</Text>
                                </>
                            )}
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [styles.backButtonError, { opacity: pressed ? 0.7 : 1 }]}
                            onPress={() => router.back()}
                        >
                            <Text style={styles.backButtonErrorText}>Go Back</Text>
                        </Pressable>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable
                        onPress={handleBack}
                        style={({ pressed }) => [styles.headerBackBtn, { opacity: pressed ? 0.7 : 1 }]}
                    >
                        <Feather name="arrow-left" size={20} color={c.foreground} />
                    </Pressable>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>Mind Map</Text>
                    </View>
                    <View style={styles.headerButtons}>
                        <Pressable
                            onPress={toggleEditMode}
                            style={({ pressed }) => [styles.headerIconBtn, { opacity: pressed ? 0.7 : 1 }]}
                            disabled={!mindmap}
                        >
                            {isEditing ? (
                                <Feather name="eye" size={18} color={c.primary} />
                            ) : (
                                <Feather name="edit-2" size={18} color={c.primary} />
                            )}
                        </Pressable>
                        <Pressable
                            onPress={handleDeleteMindmap}
                            style={({ pressed }) => [
                                styles.headerIconBtn,
                                isDeleting && styles.headerButtonDisabled,
                                { opacity: pressed ? 0.7 : 1 },
                            ]}
                            disabled={isDeleting || !mindmap}
                        >
                            {isDeleting ? (
                                <ActivityIndicator size="small" color="#FF3B30" />
                            ) : (
                                <Feather name="trash-2" size={18} color={mindmap ? '#FF3B30' : c.border} />
                            )}
                        </Pressable>
                    </View>
                </View>

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    {/* Main Card */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>{displayTitle}</Text>
                        {/* Mindmap WebView Container */}
                        <View
                            style={styles.mindMapWebViewContainer}
                            ref={viewShotRef}
                            collapsable={false}
                        >
                            {isEditing ? (
                                <TextInput
                                    style={styles.markdownInput}
                                    multiline
                                    value={markdownInput}
                                    onChangeText={handleMarkdownChange}
                                    placeholder="# Enter markdown here..."
                                    placeholderTextColor={c.mutedForeground}
                                    textAlignVertical="top"
                                />
                            ) : (
                                <WebView
                                    ref={webViewRef}
                                    source={{ html: generateMarkmapHTML(markdownInput || (mindmap?.mermaidCode || '')) }}
                                    style={styles.webView}
                                    scrollEnabled={true}
                                    scalesPageToFit={true}
                                    bounces={false}
                                    javaScriptEnabled={true}
                                    domStorageEnabled={true}
                                    startInLoadingState={true}
                                    onMessage={handleWebViewMessage}
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
                                            <ActivityIndicator size="large" color={c.primary} />
                                            <Text style={styles.loadingText}>Loading visualization...</Text>
                                        </View>
                                    )}
                                />
                            )}
                        </View>
                    </View>

                    {/* Footer Actions */}
                    {mindmap && (
                        <View style={styles.footer}>
                            {/* Save as Image Button */}
                            <Pressable
                                onPress={handleSaveAsImage}
                                style={({ pressed }) => [
                                    styles.saveButton,
                                    isSaving && styles.saveButtonDisabled,
                                    { opacity: pressed ? 0.7 : 1 },
                                ]}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <ActivityIndicator size="small" color={c.background} />
                                        <Text style={styles.saveButtonText}>Saving...</Text>
                                    </>
                                ) : (
                                    <>
                                        <Feather name="download" size={20} color={c.background} />
                                        <Text style={styles.saveButtonText}>Save as Image</Text>
                                    </>
                                )}
                            </Pressable>

                            <Pressable
                                onPress={handleCreateNew}
                                style={({ pressed }) => [styles.createButton, { opacity: pressed ? 0.7 : 1 }]}
                            >
                                <Text style={styles.createButtonText}>Regenerate</Text>
                            </Pressable>
                        </View>
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

export default MindmapView;
