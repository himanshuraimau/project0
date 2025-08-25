// Types for course progress functionality

export interface CourseProgress {
  isCompleted: boolean;
  completedAt: string | null;
  completedChapters: number;
  totalChapters: number;
  completionPercentage: number;
}

export interface CourseProgressResponse {
  success?: boolean;
  isCompleted: boolean;
  completedAt: string | null;
  completedChapters: number;
  totalChapters: number;
  completionPercentage: number;
  error?: string;
}

export interface UseCourseProgressReturn {
  progress: CourseProgress;
  loading: boolean;
  updating: boolean;
  markAsComplete: () => Promise<void>;
  markAsIncomplete: () => Promise<void>;
  toggleCompletion: () => Promise<void>;
}

// Extended course type with progress
export interface CourseWithProgress {
  id: string;
  name: string;
  image: string;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
  progress?: CourseProgress;
}