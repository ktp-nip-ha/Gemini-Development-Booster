import { useState, useEffect } from "react";
import Header from "./components/Header";
import ProjectHeader from "./components/ProjectHeader";
import PromptGenerator from "./components/PromptGenerator";
import RoadmapTodo from "./components/RoadmapTodo";
import Dashboard from "./components/Dashboard";
import { StickyNote, Eraser } from "lucide-react";
// Firebaseを使うためのツールをインポート
import { db } from "./firebase";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from "firebase/firestore";
import type { Project, ProjectDraft, RoadmapItem } from "./types/project";

function App() {
  // データの保存先をFirestoreに変更するため、useStateで管理
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Firestoreからリアルタイムにデータを読み込む設定
  useEffect(() => {
    // projectsコレクションを参照（作成日時の降順で並び替え）
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    
    // データが変更されたら自動で実行される（リアルタイム同期）
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const projectsData: Project[] = [];
      querySnapshot.forEach((doc) => {
        projectsData.push({ id: doc.id, ...doc.data() } as Project);
      });
      setProjects(projectsData);
      setIsLoading(false); // 読み込み完了
    }, (error) => {
      console.error("Firestoreからの読み込みエラー:", error);
      setIsLoading(false);
    });

    // コンポーネントが消えるときに監視を止める
    return () => unsubscribe();
  }, []);

  // 既存のローカルストレージからの移行処理（一度だけ実行）
  useEffect(() => {
    const migrateData = async () => {
      const localData = localStorage.getItem("sidekick_projects");
      if (localData) {
        const localProjects: Project[] = JSON.parse(localData);
        // Firestoreにまだデータがない場合のみ移行
        if (projects.length === 0 && localProjects.length > 0) {
          console.log("ローカルデータをFirestoreに移行中...");
          for (const p of localProjects) {
            await setDoc(doc(db, "projects", p.id), p);
          }
          // 移行が終わったらローカルストレージをクリア（任意）
          // localStorage.removeItem("sidekick_projects");
        }
      }
    };
    
    if (!isLoading && projects.length === 0) {
      migrateData();
    }
  }, [isLoading, projects.length]);

  const currentProject = projects.find(p => p.id === currentProjectId);
  const currentRoadmap = currentProject?.roadmap || [];

  // プロジェクトを新規作成してFirestoreに保存
  const handleCreateProject = async (name: string) => {
    const id = Date.now().toString(); // IDを生成
    const newProject: Project = {
      id,
      name,
      draft: { title: "", concept: "", features: "", vibe: "", techStack: "" },
      roadmap: [],
      memo: "",
      createdAt: Date.now()
    };
    
    try {
      // projectsコレクションに新しいドキュメントを追加
      await setDoc(doc(db, "projects", id), newProject);
      setCurrentProjectId(id); // 作成したプロジェクトを開く
    } catch (error) {
      console.error("プロジェクトの作成に失敗しました:", error);
      alert("保存に失敗しました。Firebaseの設定を確認してください。");
    }
  };

  // プロジェクトをFirestoreから削除
  const handleDeleteProject = async (id: string) => {
    if (!window.confirm("このプロジェクトを削除してもよろしいですか？")) return;

    try {
      await deleteDoc(doc(db, "projects", id));
      if (currentProjectId === id) {
        setCurrentProjectId(null);
      }
    } catch (error) {
      console.error("プロジェクトの削除に失敗しました:", error);
    }
  };

  // プロジェクトの内容をFirestoreで更新
  const updateCurrentProject = async (updater: Partial<Project> | ((prev: Project) => Project)) => {
    if (!currentProjectId || !currentProject) return;

    let updatedProject: Project;
    if (typeof updater === 'function') {
      updatedProject = updater(currentProject);
    } else {
      updatedProject = { ...currentProject, ...updater };
    }

    try {
      // 特定のIDのドキュメントを更新
      await setDoc(doc(db, "projects", currentProjectId), updatedProject);
    } catch (error) {
      console.error("データの更新に失敗しました:", error);
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">データを読み込み中...</div>
      </div>
    );
  }

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
