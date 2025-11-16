import { prisma } from "./prisma";
import { Folder } from "@prisma/client";

export interface FolderWithCount extends Folder {
  noteCount: number;
}

export interface CreateFolderData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  userId: string;
}

export interface UpdateFolderData {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

export class FolderService {
  /**
   * Get all folders for a user with note counts
   */
  async getFoldersByUser(userId: string): Promise<FolderWithCount[]> {
    const folders = await prisma.folder.findMany({
      where: { userId },
      include: {
        _count: {
          select: { notes: true },
        },
      },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    });

    return folders.map((folder) => ({
      ...folder,
      noteCount: folder._count.notes,
    }));
  }

  /**
   * Get a specific folder with its notes
   */
  async getFolderById(
    folderId: string,
    userId: string,
    includeNotes = true
  ) {
    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId,
      },
      include: {
        notes: includeNotes
          ? {
              include: {
                transcript: true,
              },
              orderBy: { updatedAt: "desc" },
            }
          : false,
        _count: {
          select: { notes: true },
        },
      },
    });

    if (!folder) {
      throw new Error("Folder not found");
    }

    return {
      ...folder,
      noteCount: folder._count.notes,
    };
  }

  /**
   * Create a new folder
   */
  async createFolder(data: CreateFolderData): Promise<Folder> {
    // Check if folder with same name exists for this user
    const existingFolder = await prisma.folder.findFirst({
      where: {
        userId: data.userId,
        name: {
          equals: data.name,
          mode: "insensitive",
        },
      },
    });

    if (existingFolder) {
      throw new Error("A folder with this name already exists");
    }

    // Get the highest position for this user
    const maxPosition = await prisma.folder.findFirst({
      where: { userId: data.userId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    return await prisma.folder.create({
      data: {
        ...data,
        position: (maxPosition?.position ?? -1) + 1,
      },
    });
  }

  /**
   * Update folder details
   */
  async updateFolder(
    folderId: string,
    userId: string,
    data: UpdateFolderData
  ): Promise<Folder> {
    // Verify folder exists and belongs to user
    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId,
      },
    });

    if (!folder) {
      throw new Error("Folder not found");
    }

    // If updating name, check for duplicates
    if (data.name && data.name !== folder.name) {
      const existingFolder = await prisma.folder.findFirst({
        where: {
          userId,
          name: {
            equals: data.name,
            mode: "insensitive",
          },
          id: {
            not: folderId,
          },
        },
      });

      if (existingFolder) {
        throw new Error("A folder with this name already exists");
      }
    }

    return await prisma.folder.update({
      where: {
        id: folderId,
      },
      data,
    });
  }

  /**
   * Delete folder (notes become uncategorized)
   */
  async deleteFolder(folderId: string, userId: string): Promise<Folder> {
    // Verify folder exists and belongs to user
    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId,
      },
    });

    if (!folder) {
      throw new Error("Folder not found");
    }

    // First, remove folder association from all notes
    await prisma.note.updateMany({
      where: { folderId },
      data: { folderId: null },
    });

    // Then delete the folder
    return await prisma.folder.delete({
      where: {
        id: folderId,
      },
    });
  }

  /**
   * Add notes to a folder
   */
  async addNotesToFolder(
    folderId: string,
    noteIds: string[],
    userId: string
  ) {
    // Verify folder belongs to user
    await this.getFolderById(folderId, userId, false);

    return await prisma.note.updateMany({
      where: {
        id: { in: noteIds },
        userId,
      },
      data: { folderId },
    });
  }

  /**
   * Remove note from folder
   */
  async removeNoteFromFolder(noteId: string, userId: string) {
    return await prisma.note.update({
      where: {
        id: noteId,
        userId,
      },
      data: { folderId: null },
    });
  }

  /**
   * Move note to different folder
   */
  async moveNoteToFolder(
    noteId: string,
    folderId: string | null,
    userId: string
  ) {
    if (folderId) {
      // Verify folder exists and belongs to user
      await this.getFolderById(folderId, userId, false);
    }

    return await prisma.note.update({
      where: {
        id: noteId,
        userId,
      },
      data: { folderId },
    });
  }

  /**
   * Get notes count by folder
   */
  async getFolderNotesCount(folderId: string, userId: string): Promise<number> {
    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId,
      },
      include: {
        _count: {
          select: { notes: true },
        },
      },
    });

    if (!folder) {
      throw new Error("Folder not found");
    }

    return folder._count.notes;
  }
}
