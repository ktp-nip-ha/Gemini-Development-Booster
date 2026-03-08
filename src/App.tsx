import { useState, useEffect } from "react";
import Header from "./components/Header";
import ProjectHeader from "./components/ProjectHeader";
import PromptGenerator from "./components/PromptGenerator";
import RoadmapTodo from "./components/RoadmapTodo";
import Dashboard from "./components/Dashboard";
import { StickyNote, Eraser } from "lucide-react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import type { Project, ProjectDraft, RoadmapItem } from "./types/project";

function App() {
  const [projects, setProjects] = useLocalStorage<Project[]>("devBuddy_projects", []);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [scratchPad, setScratchPad] = useLocalStorage("devBuddy_scratchpad", "");

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
          <main className="flex-grow container mx-auto px-4 py-8 grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in duration-300">
            <div className="flex flex-col gap-8 xl:col-span-2">
              <div className="flex flex-col gap-8">
                {currentProject && (
                  <PromptGenerator 
                    draft={currentProject.draft} 
                    onChange={handleDraftChange} 
                  />
                )}
                
                <div className="grid grid-cols-1 gap-8">
                  <div className="flex flex-col gap-8">
                    {currentProject && (
                      <RoadmapTodo 
                        roadmap={currentRoadmap} 
                        onChange={handleRoadmapChange}
                        projectName={currentProject.name}
                        scratchPad={scratchPad}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col gap-4 h-[calc(100vh-250px)] sticky top-8">
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-2">
                    <StickyNote className="w-5 h-5 text-amber-500" />
                    <h2 className="text-lg font-semibold text-slate-800">一時メモ (ScratchPad)</h2>
                  </div>
                  <button 
                    onClick={() => setScratchPad("")}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="メモをクリア"
                  >
                    <Eraser className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  className="flex-grow w-full p-4 text-sm border-none bg-amber-50/30 rounded-lg focus:ring-2 focus:ring-amber-200 outline-none resize-none font-mono leading-relaxed"
                  placeholder="Geminiからの指示や、一時的なメモをここに貼り付けてください..."
                  value={scratchPad}
                  onChange={(e) => setScratchPad(e.target.value)}
                />
                <p className="text-[10px] text-slate-400 text-right italic">
                  ※入力内容は自動保存されます
                </p>
              </div>
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
