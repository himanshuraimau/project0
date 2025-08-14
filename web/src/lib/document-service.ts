import { prisma } from './prisma';
import { DocumentData } from './types/documents.types';

export class DocumentService {
  /**
   * Save document content to database
   */
  async saveDocument(data: DocumentData) {
    try {
      const document = await prisma.transcript.create({
        data: {
          fileName: data.fileName,
          originalName: data.originalName,
          content: data.content,
          cleanContent: data.cleanContent,
          pages: data.pages,
          metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
          userId: data.userId,
        },
      });

      return document;
    } catch (error) {
      console.error('Error saving document to database:', error);
      throw new Error('Failed to save document to database');
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(id: string) {
    try {
      return await prisma.transcript.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error('Error retrieving document:', error);
      throw new Error('Failed to retrieve document');
    }
  }

  /**
   * Get documents by user ID
   */
  async getDocumentsByUser(userId: string) {
    try {
      return await prisma.transcript.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fileName: true,
          originalName: true,
          pages: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      console.error('Error retrieving user documents:', error);
      throw new Error('Failed to retrieve user documents');
    }
  }

  /**
   * Delete document by ID
   */
  async deleteDocument(id: string) {
    try {
      return await prisma.transcript.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      throw new Error('Failed to delete document');
    }
  }

  /**
   * Get all documents (admin function)
   */
  async getAllDocuments() {
    try {
      return await prisma.transcript.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fileName: true,
          originalName: true,
          pages: true,
          userId: true,
          createdAt: true,
        },
      });
    } catch (error) {
      console.error('Error retrieving all documents:', error);
      throw new Error('Failed to retrieve documents');
    }
  }
}
