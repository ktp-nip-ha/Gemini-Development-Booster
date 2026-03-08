export type TaskAssignee = "human" | "ai";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  assignee: TaskAssignee;
}

export interface ProjectDraft {
  title: string;
  concept: string;
  features: string;
  vibe: string;
  techStack: string;
}

export interface RoadmapItem {
  id: string;
  title: string;
  tasks: Task[];
  expanded?: boolean;
}

export interface Project {
  id: string;
  name: string;
  draft: ProjectDraft;
  roadmap: RoadmapItem[];
  createdAt: number;
}
