import { Plus, Trash2, LayoutDashboard, Clock } from "lucide-react";
import type { Project } from "../types/project";

interface DashboardProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string) => void;
  onDeleteProject: (id: string) => void;
}

export default function Dashboard({ projects, onSelectProject, onCreateProject, onDeleteProject }: DashboardProps) {
  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("projectName") as string;
    if (name.trim()) {
      onCreateProject(name);
      e.currentTarget.reset();
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <LayoutDashboard className="w-8 h-8 text-indigo-600" />
        <h2 className="text-2xl font-bold text-slate-800">プロジェクト ダッシュボード</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 新規作成カード */}
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-6 flex flex-col items-center justify-center gap-4 hover:border-indigo-400 transition-colors group">
          <form onSubmit={handleCreateSubmit} className="w-full flex flex-col gap-3">
            <div className="flex items-center justify-center">
              <Plus className="w-10 h-10 text-slate-400 group-hover:text-indigo-500 transition-colors" />
            </div>
            <p className="text-center text-slate-600 font-medium">新しいプロジェクトを企画</p>
            <div className="flex gap-2 mt-2">
              <input
                name="projectName"
                type="text"
                className="flex-grow px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="プロジェクト名..."
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors"
              >
                追加
              </button>
            </div>
          </form>
        </div>

        {/* プロジェクト一覧 */}
        {projects.map((project) => {
          const roadmap = project.roadmap || [];
          const allTasks = roadmap.flatMap(item => item.tasks || []);
          const completedTasks = allTasks.filter(t => t.completed);

          return (
            <div
              key={project.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow flex flex-col justify-between group"
            >
              <div className="cursor-pointer" onClick={() => onSelectProject(project.id)}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {project.name}
                  </h3>
                  <div className="text-slate-400">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2 min-h-[2.5rem]">
                  {project.draft.concept || "（企画のコンセプトが設定されていません）"}
                </p>
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                  <div className="flex items-center gap-1">
                    <span>タスク:</span>
                    <span className="text-slate-700">{allTasks.length}件</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>完了:</span>
                    <span className="text-emerald-600">
                      {completedTasks.length}件
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t flex justify-end">
                <button
                  onClick={() => {
                    if (confirm(`「${project.name}」を削除してもよろしいですか？`)) {
                      onDeleteProject(project.id);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-20 bg-slate-50 rounded-2xl mt-8 border border-slate-200">
          <p className="text-slate-500">プロジェクトがありません。最初のプロジェクトを作成しましょう！</p>
        </div>
      )}
    </main>
  );
}
