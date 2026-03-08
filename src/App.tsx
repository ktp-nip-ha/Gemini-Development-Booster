import { useState, useEffect, useCallback, useMemo } from "react";
import Header from "./components/Header";
import ProjectHeader from "./components/ProjectHeader";
import PromptGenerator from "./components/PromptGenerator";
import RoadmapTodo from "./components/RoadmapTodo";
import Dashboard from "./components/Dashboard";
import { StickyNote, Eraser, Save, CheckCircle, Loader2 } from "lucide-react";
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
  // --- 状態管理 (States) ---
  
  // Firestoreから取得したプロジェクト一覧
  const [projects, setProjects] = useState<Project[]>([]);
  // 現在選択中のプロジェクトID
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  // 読み込み中フラグ（キャッシュ活用により、一瞬で消えるようになります）
  const [isLoading, setIsLoading] = useState(true);
  
  // 【爆速化の鍵】編集中のデータを一時的に保持するステート（DBへの即時書き込みを避ける）
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  // 保存ボタンの状態管理
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'done'>('idle');

  // --- データの読み込み (Data Fetching) ---

  // Firestoreからリアルタイムにデータを読み込む設定
  useEffect(() => {
    // projectsコレクションを参照（作成日時の降順で並び替え）
    // IndexedDBを有効にしているため、まず端末のキャッシュからデータが返されます
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (querySnapshot) => {
      const projectsData: Project[] = [];
      querySnapshot.forEach((doc) => {
        projectsData.push({ id: doc.id, ...doc.data() } as Project);
      });
      setProjects(projectsData);
      setIsLoading(false);
      
      // キャッシュからの読み込みか、サーバーからの最新データかを判別可能
      const source = querySnapshot.metadata.fromCache ? "local cache" : "server";
      console.log(`Data fetched from ${source}`);
    }, (error) => {
      console.error("Firestoreからの読み込みエラー:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 選択中のプロジェクトが変更されたら、編集用ステートを更新
  useEffect(() => {
    const project = projects.find(p => p.id === currentProjectId);
    if (project) {
      // DBから取得した最新のプロジェクト情報を編集用ステートにセット
      setEditingProject(project);
    } else {
      setEditingProject(null);
    }
  }, [currentProjectId, projects]);

  // --- 保存処理 (Saving) ---

  // Firestoreへ保存するメインの関数（ボタンが押された時だけ実行）
  const handleSave = useCallback(async () => {
    if (!currentProjectId || !editingProject) return;

    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      // 特定のIDのドキュメントを編集内容で上書き保存
      await setDoc(doc(db, "projects", currentProjectId), editingProject);
      
      // 保存完了時の視覚フィードバック
      setSaveStatus('done');
      setTimeout(() => setSaveStatus('idle'), 2000); // 2秒後に元の状態に戻す
    } catch (error) {
      console.error("データの更新に失敗しました:", error);
      alert("保存に失敗しました。ネット接続を確認してください。");
      setSaveStatus('idle');
    } finally {
      setIsSaving(false);
    }
  }, [currentProjectId, editingProject]);

  // --- 各種操作ハンドラ (Event Handlers) ---

  // プロジェクトを新規作成
  const handleCreateProject = async (name: string) => {
    const id = Date.now().toString();
    const newProject: Project = {
      id,
      name,
      draft: { title: "", concept: "", features: "", vibe: "", techStack: "" },
      roadmap: [],
      memo: "",
      createdAt: Date.now()
    };
    
    try {
      await setDoc(doc(db, "projects", id), newProject);
      setCurrentProjectId(id);
    } catch (error) {
      console.error("プロジェクトの作成に失敗しました:", error);
    }
  };

  // プロジェクトを削除
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

  // 【最適化】ステートのみを更新し、DBへの保存は行わない（レンダリング負荷を軽減）
  const updateLocalState = useCallback((updater: Partial<Project> | ((prev: Project) => Project)) => {
    setEditingProject(prev => {
      if (!prev) return null;
      if (typeof updater === 'function') {
        return updater(prev);
      }
      return { ...prev, ...updater };
    });
  }, []);

  const handleDraftChange = useCallback((draftOrUpdater: ProjectDraft | ((prev: ProjectDraft) => ProjectDraft)) => {
    updateLocalState(prev => ({
      ...prev,
      draft: typeof draftOrUpdater === 'function' ? draftOrUpdater(prev.draft) : draftOrUpdater
    }));
  }, [updateLocalState]);

  const handleRoadmapChange = useCallback((roadmapOrUpdater: RoadmapItem[] | ((prev: RoadmapItem[]) => RoadmapItem[])) => {
    updateLocalState(prev => ({
      ...prev,
      roadmap: typeof roadmapOrUpdater === 'function' ? roadmapOrUpdater(prev.roadmap) : roadmapOrUpdater
    }));
  }, [updateLocalState]);

  const handleMemoChange = useCallback((memo: string) => {
    updateLocalState({ memo });
  }, [updateLocalState]);

  // --- UI (Components) ---

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <div>データを読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header 
        currentProjectName={editingProject?.name} 
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
          {editingProject && <ProjectHeader project={editingProject} />}
          <main className="flex-grow container mx-auto px-4 py-8 grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in duration-300">
            <div className="flex flex-col gap-8 xl:col-span-2">
              <div className="flex flex-col gap-8">
                {editingProject && (
                  <PromptGenerator 
                    draft={editingProject.draft} 
                    onChange={handleDraftChange} 
                  />
                )}
                
                <div className="grid grid-cols-1 gap-8">
                  <div className="flex flex-col gap-8">
                    {editingProject && (
                      <RoadmapTodo 
                        roadmap={editingProject.roadmap} 
                        onChange={handleRoadmapChange}
                        projectName={editingProject.name}
                        scratchPad={editingProject.memo || ""}
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
                  value={editingProject?.memo || ""}
                  onChange={(e) => handleMemoChange(e.target.value)}
                />
                <p className="text-[10px] text-slate-400 text-right italic">
                  ※「保存」ボタンを押すまで確定されません
                </p>
              </div>
            </div>
          </main>

          {/* フローティング保存ボタン */}
          <div className="fixed bottom-8 right-8 z-50">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`
                flex items-center gap-2 px-6 py-4 rounded-full shadow-2xl transition-all active:scale-95
                ${saveStatus === 'done' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'}
                ${isSaving ? 'opacity-90 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-bold">保存中...</span>
                </>
              ) : saveStatus === 'done' ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-bold">保存完了！</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span className="font-bold">保存する</span>
                </>
              )}
            </button>
          </div>
        </>
      )}
      
      <footer className="py-6 text-center text-sm text-slate-400 border-t bg-white mt-auto">
        &copy; 2026 Sidekick Project
      </footer>
    </div>
  );
}

export default App;
