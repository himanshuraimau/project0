import React, { useState } from 'react';
import { FoldersList } from '@/components/folders/FoldersList';
import { CreateFolderModal } from '@/components/folders/CreateFolderModal';

export default function FoldersScreen() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      <FoldersList onCreatePress={() => setShowCreateModal(true)} />
      <CreateFolderModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
}
