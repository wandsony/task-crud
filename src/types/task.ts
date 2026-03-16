export type TaskStatus = "TODO" | "DOING" | "DONE";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  due_date: string | null;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
}

export interface TaskLabel {
  id: string;
  task_id: string;
  label_id: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  position: number;
  created_at: string;
}
