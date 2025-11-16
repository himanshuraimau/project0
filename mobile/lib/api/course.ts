import apiClient, { handleApiResponse, handleApiError } from './client';
import {
  Course,
  CreateCourseRequest,
  GenerateUnitsRequest,
  GenerateChaptersRequest,
  UserCourseProgress,
  ApiResponse,
} from './types';

/**
 * Course API Module
 * Handles course creation, management, and progress tracking
 */

/**
 * Get all courses for the authenticated user
 */
export const getCourses = async (): Promise<Course[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Course[]>>('/course');
    return handleApiResponse<Course[]>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get a specific course by ID
 * @param courseId - Course ID
 */
export const getCourseById = async (courseId: string): Promise<Course> => {
  try {
    const response = await apiClient.get<ApiResponse<Course>>(`/course/${courseId}`);
    return handleApiResponse<Course>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Create a new course
 * @param courseId - Course ID
 * @param data - Course creation data
 */
export const createCourse = async (courseId: string, data: CreateCourseRequest): Promise<Course> => {
  try {
    const response = await apiClient.post<ApiResponse<Course>>(
      `/course/${courseId}/create-course`,
      data
    );
    return handleApiResponse<Course>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Generate units for a course
 * @param courseId - Course ID
 * @param data - Unit generation parameters
 */
export const generateUnits = async (
  courseId: string,
  data: GenerateUnitsRequest
): Promise<any> => {
  try {
    const response = await apiClient.post<ApiResponse<any>>(
      `/course/${courseId}/generate-units`,
      data
    );
    return handleApiResponse<any>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Generate chapters for a unit
 * @param courseId - Course ID
 * @param data - Chapter generation parameters
 */
export const generateChapters = async (
  courseId: string,
  data: GenerateChaptersRequest
): Promise<any> => {
  try {
    const response = await apiClient.post<ApiResponse<any>>(
      `/course/${courseId}/generate-chapters`,
      data
    );
    return handleApiResponse<any>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Generate chapters in batch
 * @param courseId - Course ID
 * @param data - Batch chapter generation parameters
 */
export const generateChaptersBatch = async (courseId: string, data: any): Promise<any> => {
  try {
    const response = await apiClient.post<ApiResponse<any>>(
      `/course/${courseId}/generate-chapters-batch`,
      data
    );
    return handleApiResponse<any>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Generate chapter content in batch
 * @param courseId - Course ID
 * @param data - Batch content generation parameters
 */
export const generateChapterContentBatch = async (courseId: string, data: any): Promise<any> => {
  try {
    const response = await apiClient.post<ApiResponse<any>>(
      `/course/${courseId}/generate-chapter-content-batch`,
      data
    );
    return handleApiResponse<any>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Create chapters for a course
 * @param courseId - Course ID
 * @param data - Chapters data
 */
export const createChapters = async (courseId: string, data: any): Promise<any> => {
  try {
    const response = await apiClient.post<ApiResponse<any>>(
      `/course/${courseId}/createChapters`,
      data
    );
    return handleApiResponse<any>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get course progress for the authenticated user
 * @param courseId - Course ID
 */
export const getCourseProgress = async (courseId: string): Promise<UserCourseProgress> => {
  try {
    const response = await apiClient.get<ApiResponse<UserCourseProgress>>(
      `/course/${courseId}/progress`
    );
    return handleApiResponse<UserCourseProgress>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export default {
  getCourses,
  getCourseById,
  createCourse,
  generateUnits,
  generateChapters,
  generateChaptersBatch,
  generateChapterContentBatch,
  createChapters,
  getCourseProgress,
};
