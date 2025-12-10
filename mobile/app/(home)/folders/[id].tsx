import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { FolderDetailScreen } from '@/components/folders/FolderDetailScreen';

export default function FolderDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return <FolderDetailScreen folderId={id} />;
}
