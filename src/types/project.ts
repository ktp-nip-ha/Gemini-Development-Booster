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
  coreExperience: string;
  mvpFeatures: string;
  extraFeatures: string;
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
  memo?: string;
  createdAt: number;
}
