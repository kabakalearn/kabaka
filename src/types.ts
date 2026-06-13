export interface StudentProfile {
  id: string;
  name: string;
  parent_email: string;
  parent_phone: string;
  onboarding_completed: boolean;
  preferred_study_time?: string; // 'morning' | 'afternoon' | 'evening'
  hours_per_day?: number;
  focus_level?: 'low' | 'medium' | 'high';
  learning_style?: string; // 'short' | 'long' | 'flexible'
  streak?: number;
  study_hours?: number;
  consistency_score?: number;
  created_at: string;
  updated_at: string;
  owner_id: string;
  // Phase 4 - System Progression & personalization
  xp?: number;
  level?: number;
  badges?: string[];
  milestones?: string[];
  difficulty_preference?: 'easy' | 'medium' | 'hard';
  ai_behavior_mode?: 'sovereign' | 'encouraging' | 'rigorous';
  enable_alerts?: boolean;
  enable_emails?: boolean;
  layout_density?: 'comfortable' | 'compact' | 'extended';
  font_scaling?: 'small' | 'medium' | 'large';
}

export interface Unit {
  id: string;
  title: string;
  lessons: string[];
}

export interface Subject {
  id: string;
  owner_id: string;
  name: string;
  color: string; // Tailwind bg- class or raw HEX
  book_name?: string;
  book_size?: number;
  book_type?: string;
  book_url?: string;
  book_status?: 'uploaded' | 'processing' | 'analyzed' | null;
  units_count?: number;
  lessons_count?: number;
  progress?: number;
  units?: Unit[];
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  subject_id: string;
  subject_name?: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  priority?: 'High' | 'Medium' | 'Low';
  duration?: number; // suggested duration in minutes
  due_date?: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
}

export interface FocusSession {
  id: string;
  owner_id: string;
  task_id: string;
  task_title: string;
  subject_id: string;
  subject_name: string;
  duration: number; // minutes elapsed or completed in this session
  completed_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface QuizQuestion {
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[]; // only for multiple_choice
  correct_answer: string;
  explanation: string;
}

export interface Quiz {
  id: string;
  owner_id: string;
  subject_id: string;
  subject_name: string;
  type: 'lesson' | 'unit' | 'subject' | 'full_exam';
  difficulty: 'easy' | 'medium' | 'hard';
  questions: QuizQuestion[];
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  owner_id: string;
  quiz_id: string;
  subject_id: string;
  subject_name: string;
  score: number;
  total_questions: number;
  time_taken: number; // seconds
  answers: string[]; // parallel to questions
  mistakes: Mistake[];
  created_at: string;
}

export interface Mistake {
  id: string;
  owner_id: string;
  subject_id: string;
  subject_name: string;
  question: string;
  student_answer: string;
  correct_answer: string;
  topic: string;
  weakness_score: number; // e.g. increments on repeat mistakes
  created_at: string;
}

export interface Flashcard {
  id: string;
  owner_id: string;
  subject_id: string;
  subject_name: string;
  front: string;
  back: string;
  source: 'lessons' | 'books' | 'mistakes' | 'ai_summaries';
  created_at: string;
}

export interface AIInsights {
  id: string; // matches userId
  owner_id: string;
  best_study_time: string;
  weakest_subject: string;
  strongest_subject: string;
  difficult_topics: string[];
  revision_schedule: string;
  updated_at: string;
}

// Phase 4 Entities
export interface PDFDocument {
  id: string;
  owner_id: string;
  subject_id: string;
  subject_name: string;
  filename: string;
  file_size: number; // KB
  pages_count: number;
  chapters?: string[];
  uploaded_at: string;
}

export interface Note {
  id: string;
  owner_id: string;
  subject_id: string;
  subject_name: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Whiteboard {
  id: string;
  owner_id: string;
  subject_id: string;
  subject_name: string;
  title: string;
  canvas_data: string; // Serialized strokes / JSON
  created_at: string;
}

export interface CalculatorLog {
  id: string;
  owner_id: string;
  expression: string;
  result: string;
  created_at: string;
}

export interface Notification {
  id: string;
  owner_id: string;
  type: 'task_reminder' | 'ai_suggestion' | 'quiz_result' | 'achievement_unlocked' | 'mistake_alert' | 'study_plan_update';
  title: string;
  content: string;
  read: boolean;
  created_at: string;
}

