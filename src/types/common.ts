// Course interface for representing course data
export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: {
    id: string;
    name: string;
    avatar?: string;
  };
  thumbnail: string;
  duration: number; // in hours
  level: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  enrolledCount: number;
  price: number;
  isEnrolled?: boolean;
  progress?: number; // percentage completed (0-100)
}

// Pagination parameters interface for API requests
export interface PaginationParams {
  page: number;
  limit: number;
  total?: number;
}

// API response interface for consistent handling of responses
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// Error interface for consistent error handling
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

