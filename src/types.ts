export type TaskCategory = 'Assignment' | 'Exam' | 'Meeting' | 'Interview' | 'Bill Payment' | 'General';
export type TaskPriority = 'High' | 'Medium' | 'Low' | 'Unranked';
export type TaskStatus = 'Pending' | 'Complete';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  deadline: string; // ISO format
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface ScheduleSlot {
  startTime: string;
  endTime: string;
  taskName: string;
  note: string;
}

export interface RecommendationItem {
  order: number;
  taskTitle: string;
  timeAllocationMinutes: number;
  tip: string;
}

export interface RecommendationsResponse {
  summary: string;
  recommendations: RecommendationItem[];
}

export interface RescueStep {
  stepNumber: number;
  title: string;
  durationMinutes: number;
  description: string;
}

export interface RescuePlan {
  totalEstimatedMinutes: number;
  verdict: 'achievable' | 'not achievable';
  verdictReason: string;
  steps: RescueStep[];
}
