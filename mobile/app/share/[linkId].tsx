import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { SharedNotePreview } from '@/components/notes';
import BackButton from '@/components/ui/BackButton';

export default function SharePreviewScreen() {
    const params = useLocalSearchParams<{ linkId: string; token?: string }>();
    const router = useRouter();

    // Validate required parameters
    if (!params.linkId || !params.token) {
        return (
            <LinearGradient
                colors={['#FFFFFF', '#f7f9ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}
            >
                <SafeAreaView style={styles.safeArea}>
                    <BackButton />
                    <View style={styles.errorContainer}>
                        <Feather name="alert-circle" size={64} color="#EF4444" />
                        <Text style={styles.errorTitle}>Invalid Share Link</Text>
                        <Text style={styles.errorText}>
                            This share link is invalid or incomplete. Please check the URL and try again.
                        </Text>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    return <SharedNotePreview linkId={params.linkId} token={params.token} />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '500',
        color: '#111827',
        marginTop: 16,
        marginBottom: 8,
    },
    errorText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
});
