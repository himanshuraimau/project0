import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import EditView from '@/components/notes/EditView';

export default function EditNoteRoute() {
    const { id } = useLocalSearchParams<{ id: string }>();

    // Pass the ID to the EditView component
    return <EditView noteId={id} />;
}
