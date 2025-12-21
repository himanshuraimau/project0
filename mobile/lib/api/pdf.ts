import apiClient, { handleApiResponse, handleApiError } from './client';
import { PDFFile, ApiResponse } from './types';

/**
 * PDF API Module
 * Handles PDF parsing, processing, and AI interactions
 */

/**
 * Parse a PDF file
 * @param file - PDF file as FormData
 */
export const parsePDF = async (file: FormData): Promise<any> => {
  try {
    const response = await apiClient.post<ApiResponse<any>>('/pdf/parse', file, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return handleApiResponse<any>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Process a PDF file (extract text, create transcript, generate notes)
 * @param file - PDF file as FormData
 */
export const processPDF = async (file: FormData): Promise<any> => {
  try {
    const response = await apiClient.post<ApiResponse<any>>('/pdf/process', file, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 2 minutes timeout for PDF processing
    });
    return handleApiResponse<any>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Ask AI questions about a PDF
 * @param pdfId - PDF ID
 * @param question - Question to ask
 */
export const askPDFAI = async (pdfId: string, question: string): Promise<any> => {
  try {
    const response = await apiClient.post<ApiResponse<any>>('/pdf/ai', {
      pdfId,
      question,
    });
    return handleApiResponse<any>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get all PDF files for the authenticated user
 */
export const getPDFFiles = async (): Promise<PDFFile[]> => {
  try {
    const response = await apiClient.get<ApiResponse<PDFFile[]>>('/pdf/files');
    return handleApiResponse<PDFFile[]>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Delete a PDF file
 * @param id - PDF file ID
 */
export const deletePDFFile = async (id: string): Promise<{ message: string }> => {
  try {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/pdf/files`, {
      params: { id },
    });
    return handleApiResponse<{ message: string }>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export default {
  parsePDF,
  processPDF,
  askPDFAI,
  getPDFFiles,
  deletePDFFile,
};
