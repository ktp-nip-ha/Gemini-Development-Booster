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
  const [projects, setProjects] = useLocalStorage<Project[]>("sidekick_projects", []);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  // 既存データの移行処理 & チュートリアルデータの初期化
  useEffect(() => {
    // 一時メモのマイグレーション用データを取得
    const legacyScratchPad = localStorage.getItem("sidekick_scratchpad") || localStorage.getItem("devBuddy_scratchpad");
    
    // 完全に空の場合（新規ユーザー）
    const isFirstTime = localStorage.getItem("sidekick_projects") === null && localStorage.getItem("devBuddy_projects") === null;
    
    if (isFirstTime) {
      const tutorialProject: Project = {
        id: "tutorial-project",
        name: "Sidekickへようこそ！",
        draft: {
          title: "Sidekickを使いこなすための第一歩",
          concept: "Sidekick（開発の相棒）は、あなたの開発をAIと一緒に加速させるためのツールです。\nこのプロジェクトは使い方のヒントをまとめたチュートリアルです。",
          features: "・企画素案の作成\n・ロードマップとタスク管理\n・AI（Gemini）へのプロンプト生成\n・一時的なメモ（ScratchPad）の活用",
          vibe: "ワクワクする・スムーズな開発・効率的",
          techStack: "React, Tailwind CSS, Lucide Icons, Vite"
        },
        roadmap: [
          {
            id: "step-1",
            title: "STEP 1: 企画を練る",
            tasks: [
              { id: "t1", title: "「企画素案」の各項目を埋めてみる", completed: false, assignee: "human" },
              { id: "t2", title: "「プロンプトをコピー」してAIに相談する", completed: false, assignee: "human" }
            ],
            expanded: true
          },
          {
            id: "step-2",
            title: "STEP 2: ロードマップを作成する",
            tasks: [
              { id: "t3", title: "AIが提案したタスクを「ロードマップ」に追加する", completed: false, assignee: "ai" },
              { id: "t4", title: "タスクの担当（人間 or AI）を決める", completed: false, assignee: "human" }
            ],
            expanded: true
          },
          {
            id: "step-3",
            title: "STEP 3: 開発を進める",
            tasks: [
              { id: "t5", title: "完了したタスクにチェックを入れる", completed: false, assignee: "human" },
              { id: "t6", title: "一時メモを使いながら実装を進める", completed: false, assignee: "human" }
            ],
            expanded: true
          }
        ],
        memo: legacyScratchPad ? JSON.parse(legacyScratchPad) : "",
        createdAt: Date.now()
      };
      setProjects([tutorialProject]);
      if (legacyScratchPad) {
        localStorage.removeItem("sidekick_scratchpad");
        localStorage.removeItem("devBuddy_scratchpad");
      }
    } else if (projects.length > 0 && legacyScratchPad) {
      // 既存プロジェクトがある場合、最初のプロジェクトにメモを引き継ぐ
      const memoContent = JSON.parse(legacyScratchPad);
      if (memoContent) {
        setProjects(prev => prev.map((p, idx) => 
          idx === 0 ? { ...p, memo: p.memo || memoContent } : p
        ));
      }
      localStorage.removeItem("sidekick_scratchpad");
      localStorage.removeItem("devBuddy_scratchpad");
    } else if (projects.length === 0) {
      // 既存データの移行処理
      const oldTasks = localStorage.getItem("sidekick_tasks") || localStorage.getItem("devBuddy_tasks");
      const oldFocus = localStorage.getItem("sidekick_focus") || localStorage.getItem("devBuddy_focus");
      const oldContext = localStorage.getItem("sidekick_context") || localStorage.getItem("devBuddy_context");

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
        
        // 移行後に古いデータを削除（任意）
        localStorage.removeItem("sidekick_tasks");
        localStorage.removeItem("devBuddy_tasks");
        localStorage.removeItem("sidekick_focus");
        localStorage.removeItem("devBuddy_focus");
        localStorage.removeItem("sidekick_context");
        localStorage.removeItem("devBuddy_context");
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
      memo: "",
      createdAt: Date.now()
    };
    setProjects(prev => [...prev, newProject]);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (currentProjectId === id) {
      setCurrentProjectId(null);
    }
  };

  const updateCurrentProject = (updater: Partial<Project> | ((prev: Project) => Project)) => {
    if (!currentProjectId) return;
    setProjects(prev => prev.map(p => {
      if (p.id === currentProjectId) {
        if (typeof updater === 'function') {
          return updater(p);
        }
        return { ...p, ...updater };
      }
      return p;
    }));
  };

  const handleDraftChange = (draftOrUpdater: ProjectDraft | ((prev: ProjectDraft) => ProjectDraft)) => {
    if (typeof draftOrUpdater === 'function') {
      updateCurrentProject(prev => ({
        ...prev,
        draft: draftOrUpdater(prev.draft)
      }));
    } else {
      updateCurrentProject({ draft: draftOrUpdater });
    }
  };

  const handleRoadmapChange = (roadmapOrUpdater: RoadmapItem[] | ((prev: RoadmapItem[]) => RoadmapItem[])) => {
    if (typeof roadmapOrUpdater === 'function') {
      updateCurrentProject(prev => ({
        ...prev,
        roadmap: roadmapOrUpdater(prev.roadmap)
      }));
    } else {
      updateCurrentProject({ roadmap: roadmapOrUpdater });
    }
  };

  const handleMemoChange = (memo: string) => {
    updateCurrentProject({ memo });
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
                        projectName={currentProject?.name}
                        scratchPad={currentProject?.memo || ""}
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
                    onClick={() => handleMemoChange("")}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="メモをクリア"
                  >
                    <Eraser className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  className="flex-grow w-full p-4 text-sm border-none bg-amber-50/30 rounded-lg focus:ring-2 focus:ring-amber-200 outline-none resize-none font-mono leading-relaxed"
                  placeholder="Geminiからの指示や、一時的なメモをここに貼り付けてください..."
                  value={currentProject?.memo || ""}
                  onChange={(e) => handleMemoChange(e.target.value)}
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
        &copy; 2026 Sidekick Project
      </footer>
    </div>
  );
}

export default App;
