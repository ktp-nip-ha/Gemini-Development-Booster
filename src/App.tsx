import { useState, useEffect } from "react";
import Header from "./components/Header";
import ProjectHeader from "./components/ProjectHeader";
import PromptGenerator from "./components/PromptGenerator";
import RoadmapTodo from "./components/RoadmapTodo";
import CodeExtractor from "./components/CodeExtractor";
import Dashboard from "./components/Dashboard";
import { useLocalStorage } from "./hooks/useLocalStorage";
import type { Project, ProjectDraft, RoadmapItem } from "./types/project";

function App() {
  const [projects, setProjects] = useLocalStorage<Project[]>("devBuddy_projects", []);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  // 既存データの移行処理（初回のみ）
  useEffect(() => {
    if (projects.length === 0) {
      const oldTasks = localStorage.getItem("devBuddy_tasks");
      const oldFocus = localStorage.getItem("devBuddy_focus");
      const oldContext = localStorage.getItem("devBuddy_context");

      if (oldTasks || oldFocus || oldContext) {
        const tasks: any[] = oldTasks ? JSON.parse(oldTasks) : [];
        const defaultProject: Project = {
          id: "default",
          name: "既存プロジェクト",
          draft: {
            title: "",
            concept: oldFocus ? JSON.parse(oldFocus) : "",
            features: oldContext ? JSON.parse(oldContext) : "",
            vibe: "",
            techStack: ""
          },
          roadmap: tasks.length > 0 ? [{ id: "legacy", title: "既存タスク", tasks, expanded: true }] : [],
          createdAt: Date.now()
        };
        setProjects([defaultProject]);
      }
    }
  }, []);

  const currentProject = projects.find(p => p.id === currentProjectId);
  const currentRoadmap = currentProject?.roadmap || [];

  const handleCreateProject = (name: string) => {
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      draft: { title: "", concept: "", features: "", vibe: "", techStack: "" },
      roadmap: [],
      createdAt: Date.now()
    };
    setProjects([...projects, newProject]);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
    if (currentProjectId === id) {
      setCurrentProjectId(null);
    }
  };

  const updateCurrentProject = (updates: Partial<Project>) => {
    if (!currentProjectId) return;
    setProjects(projects.map(p => 
      p.id === currentProjectId ? { ...p, ...updates } : p
    ));
  };

  const handleDraftChange = (draft: ProjectDraft) => {
    updateCurrentProject({ draft });
  };

  const handleRoadmapChange = (roadmap: RoadmapItem[]) => {
    updateCurrentProject({ roadmap });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header 
        currentProjectName={currentProject?.name} 
        onBackToDashboard={currentProjectId ? () => setCurrentProjectId(null) : undefined}
      />
      
      {!currentProjectId ? (
        <Dashboard 
          projects={projects}
          onSelectProject={setCurrentProjectId}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
        />
      ) : (
        <>
          {currentProject && <ProjectHeader project={currentProject} />}
          <main className="flex-grow container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
          <div className="flex flex-col gap-8">
            {currentProject && (
              <PromptGenerator 
                draft={currentProject.draft} 
                onChange={handleDraftChange} 
              />
            )}
            <CodeExtractor />
          </div>
          
          <div className="flex flex-col gap-8">
            {currentProject && (
              <RoadmapTodo 
                roadmap={currentRoadmap} 
                onChange={handleRoadmapChange} 
              />
            )}
          </div>
        </main>
      </>
    )}
      
      <footer className="py-6 text-center text-sm text-slate-400 border-t bg-white mt-auto">
        &copy; 2026 Gemini Development Booster
      </footer>
    </div>
  );
}

export default App;
