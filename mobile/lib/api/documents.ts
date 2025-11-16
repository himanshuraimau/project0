import apiClient, { handleApiResponse, handleApiError } from './client';
import { Document, CreateDocumentRequest, UpdateDocumentRequest, ApiResponse } from './types';

/**
 * Documents API Module
 * Handles document management operations
 */

/**
 * Get all documents for the authenticated user
 */
export const getDocuments = async (): Promise<Document[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Document[]>>('/documents');
    return handleApiResponse<Document[]>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get a specific document by ID
 * @param id - Document ID
 */
export const getDocumentById = async (id: string): Promise<Document> => {
  try {
    const response = await apiClient.get<ApiResponse<Document>>(`/documents/${id}`);
    return handleApiResponse<Document>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Create a new document
 * @param data - Document creation data
 */
export const createDocument = async (data: CreateDocumentRequest): Promise<Document> => {
  try {
    const response = await apiClient.post<ApiResponse<Document>>('/documents', data);
    return handleApiResponse<Document>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Update a document
 * @param id - Document ID
 * @param data - Updated document data
 */
export const updateDocument = async (id: string, data: UpdateDocumentRequest): Promise<Document> => {
  try {
    const response = await apiClient.put<ApiResponse<Document>>(`/documents/${id}`, data);
    return handleApiResponse<Document>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Delete a document
 * @param id - Document ID
 */
export const deleteDocument = async (id: string): Promise<{ message: string }> => {
  try {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/documents/${id}`
    );
    return handleApiResponse<{ message: string }>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export default {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
};
