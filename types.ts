export enum Priority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

export enum Category {
  Work = 'Work',
  Personal = 'Personal',
  Health = 'Health',
  Learning = 'Learning',
  General = 'General',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  category: Category;
  createdAt: number;
  subtasks: SubTask[];
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface AIPlanResponse {
  tasks: {
    title: string;
    description: string;
    priority: Priority;
    category: Category;
    subtasks: string[];
  }[];
}

export type FilterType = 'all' | 'active' | 'completed';
