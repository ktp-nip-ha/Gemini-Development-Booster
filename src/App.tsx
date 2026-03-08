import { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import ProjectHeader from "./components/ProjectHeader";
import PromptGenerator from "./components/PromptGenerator";
import RoadmapTodo from "./components/RoadmapTodo";
import Dashboard from "./components/Dashboard";
import { StickyNote, Eraser, Save, Loader2 } from "lucide-react";
// 自前サーバー通信用の関数をインポート
import { saveData, loadData } from "./api";
import type { Project, ProjectDraft, RoadmapItem } from "./types/project";

function App() {
  // --- 状態管理 (States) ---
  
  // アプリ全体のプロジェクト一覧を保持する
  const [projects, setProjects] = useState<Project[]>([]);
  // 現在開いているプロジェクトのIDを管理する
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  // 最初に1回だけ読み込むためのフラグ
  const [isLoading, setIsLoading] = useState(true);
  // 通信中かどうかを判定するフラグ
  const [isSaving, setIsSaving] = useState(false);

  // --- データの読み込み (一度だけ実行) ---

  // 起動時に1回だけ、データを取得してくる関数
  useEffect(() => {
    const fetchData = async () => {
      try {
        const loadedProjects = await loadData();
        setProjects(loadedProjects);
      } catch (error) {
        console.error("読み込みエラー:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // 現在選択されているプロジェクトを計算して取得する
  const currentProject = projects.find(p => p.id === currentProjectId);

  // --- 保存処理 (上書き) ---

  // ボタンが押されたとき、現在の全データを1つのJSONとしてサーバーに保存する関数
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // サーバーとlocalStorageの両方に保存
      await saveData(projects);
      alert("保存しました！");
    } catch (error) {
      console.error("保存エラー:", error);
      alert("保存に失敗しました。サーバー設定を確認してください。");
    } finally {
      setIsSaving(false);
    }
  };

  // --- 各種操作ハンドラ ---

  // 新しいプロジェクトをメモリ上のリストに追加する関数
  const handleCreateProject = (name: string) => {
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      draft: { title: "", concept: "", features: "", vibe: "", techStack: "" },
      roadmap: [],
      memo: "",
      createdAt: Date.now()
    };
    setProjects(prev => [newProject, ...prev]);
    setCurrentProjectId(newProject.id);
  };

  // 指定したプロジェクトをメモリ上のリストから削除する関数
  const handleDeleteProject = (id: string) => {
    if (!window.confirm("削除しますか？")) return;
    setProjects(prev => prev.filter(p => p.id !== id));
    if (currentProjectId === id) setCurrentProjectId(null);
  };

  // 特定のプロジェクトの内容を更新する共通の関数
  const updateProjectInList = useCallback((updater: (p: Project) => Project) => {
    setProjects(prev => prev.map(p => p.id === currentProjectId ? updater(p) : p));
  }, [currentProjectId]);

  // 企画素案の内容を変更する関数
  const handleDraftChange = useCallback((draftOrUpdater: ProjectDraft | ((prev: ProjectDraft) => ProjectDraft)) => {
    updateProjectInList(p => ({
      ...p,
      draft: typeof draftOrUpdater === 'function' ? draftOrUpdater(p.draft) : draftOrUpdater
    }));
  }, [updateProjectInList]);

  // ロードマップの内容を変更する関数
  const handleRoadmapChange = useCallback((roadmapOrUpdater: RoadmapItem[] | ((prev: RoadmapItem[]) => RoadmapItem[])) => {
    updateProjectInList(p => ({
      ...p,
      roadmap: typeof roadmapOrUpdater === 'function' ? roadmapOrUpdater(p.roadmap) : roadmapOrUpdater
    }));
  }, [updateProjectInList]);

  // メモの内容を変更する関数
  const handleMemoChange = useCallback((memo: string) => {
    updateProjectInList(p => ({ ...p, memo }));
  }, [updateProjectInList]);

  // --- UI (画面の表示) ---

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 font-bold">データを準備中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 pb-24">
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
          <main className="flex-grow container mx-auto px-4 py-8 grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="flex flex-col gap-8 xl:col-span-2">
              {currentProject && (
                <PromptGenerator 
                  draft={currentProject.draft} 
                  onChange={handleDraftChange} 
                />
              )}
              {currentProject && (
                <RoadmapTodo 
                  roadmap={currentProject.roadmap} 
                  onChange={handleRoadmapChange}
                  projectName={currentProject.name}
                  scratchPad={currentProject.memo || ""}
                />
              )}
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col gap-4 h-[calc(100vh-250px)] sticky top-8">
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-2 font-bold">
                    <StickyNote className="w-5 h-5 text-amber-500" />
                    一時メモ
                  </div>
                  <button onClick={() => handleMemoChange("")} className="text-slate-400 hover:text-red-500">
                    <Eraser className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  className="flex-grow w-full p-4 text-sm bg-amber-50/30 rounded-lg outline-none resize-none"
                  placeholder="メモをここに入力..."
                  value={currentProject?.memo || ""}
                  onChange={(e) => handleMemoChange(e.target.value)}
                />
              </div>
            </div>
          </main>
        </>
      )}

      {/* フローティング保存ボタン */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl transition-all disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-bold">通信中...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span className="font-bold">保存</span>
            </>
          )}
        </button>
      </div>

      <footer className="py-6 text-center text-sm text-slate-400 border-t bg-white mt-auto">
        &copy; 2026 Sidekick Project
      </footer>
    </div>
  );
}

export default App;
