export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'admin' | 'student' | 'instructor';
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  price: number;
  instructor_id: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'draft' | 'published' | 'archived';
  created_at: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  progress: number;
  completed: boolean;
  enrolled_at: string;
}
