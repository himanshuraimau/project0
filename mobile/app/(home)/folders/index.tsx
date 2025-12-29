import React, { useState } from 'react';
import { FoldersList } from '@/components/folders/FoldersList';
import { CreateFolderModal } from '@/components/folders/CreateFolderModal';

export default function FoldersScreen() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshCallback, setRefreshCallback] = useState<(() => void) | null>(null);

  return (
    <>
      <FoldersList onCreatePress={(onSuccess) => {
        setShowCreateModal(true);
        setRefreshCallback(() => onSuccess);
      }} />
      <CreateFolderModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          // Call the refresh callback if it exists
          if (refreshCallback) {
            refreshCallback();
            setRefreshCallback(null);
          }
        }}
      />
    </>
  );
}
