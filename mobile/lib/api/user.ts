import apiClient, { handleApiResponse, handleApiError } from './client';
import { UserProfile, UpdateUserProfileRequest, UserCredits, UserPurchase, ApiResponse } from './types';

/**
 * User API Module
 * Handles user profile, credits, and purchases
 */

/**
 * Get user profile
 */
export const getUserProfile = async (): Promise<UserProfile> => {
  try {
    const response = await apiClient.get<ApiResponse<UserProfile>>('/user/profile');
    return handleApiResponse<UserProfile>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Update user profile
 * @param data - Updated profile data
 */
export const updateUserProfile = async (data: UpdateUserProfileRequest): Promise<UserProfile> => {
  try {
    const response = await apiClient.post<ApiResponse<UserProfile>>('/user/profile', data);
    return handleApiResponse<UserProfile>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Delete user account
 */
export const deleteUserAccount = async (): Promise<{ message: string }> => {
  try {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>('/user/delete');
    return handleApiResponse<{ message: string }>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get user credits
 */
export const getUserCredits = async (): Promise<UserCredits> => {
  try {
    const response = await apiClient.get<ApiResponse<UserCredits>>('/users/credits');
    return handleApiResponse<UserCredits>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get user purchases
 */
export const getUserPurchases = async (): Promise<UserPurchase[]> => {
  try {
    const response = await apiClient.get<ApiResponse<UserPurchase[]>>('/users/purchases');
    return handleApiResponse<UserPurchase[]>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export default {
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
  getUserCredits,
  getUserPurchases,
};
