import { useState } from "react";
import { ListTodo, Check, Plus, Trash2, User, Bot } from "lucide-react";
import { useLocalStorage } from "../hooks/useLocalStorage";

type TaskAssignee = "human" | "ai";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  assignee: TaskAssignee;
}

export default function RoadmapTodo() {
  const [tasks, setTasks] = useLocalStorage<Task[]>("devBuddy_tasks", [
    { id: "1", title: "プロジェクトの初期化", completed: true, assignee: "human" },
    { id: "2", title: "コンポーネントの作成", completed: false, assignee: "ai" },
    { id: "3", title: "状態管理の実装", completed: false, assignee: "human" }
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    setTasks([
      ...tasks,
      { id: Date.now().toString(), title: newTaskTitle, completed: false, assignee: "human" }
    ]);
    setNewTaskTitle("");
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const toggleAssignee = (id: string) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        return { ...t, assignee: t.assignee === "human" ? "ai" : "human" };
      }
      return t;
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col gap-5 h-full">
      <div className="flex items-center gap-2 border-b pb-4">
        <ListTodo className="w-5 h-5 text-indigo-500" />
        <h2 className="text-lg font-semibold text-slate-800">ロードマップ ＆ ToDo</h2>
      </div>

      {/* Progress Bar */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm text-slate-600 font-medium">
          <span>進捗率</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Task Input */}
      <form onSubmit={addTask} className="flex gap-2">
        <input
          type="text"
          className="flex-grow px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
          placeholder="新しいタスクを追加..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
        />
        <button 
          type="submit"
          className="bg-slate-800 hover:bg-slate-900 text-white p-2.5 rounded-lg transition-colors"
          disabled={!newTaskTitle.trim()}
        >
          <Plus className="w-5 h-5" />
        </button>
      </form>

      {/* Task List */}
      <div className="flex flex-col gap-2 overflow-y-auto max-h-[400px] pr-1">
        {tasks.map(task => (
          <div 
            key={task.id} 
            className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
              task.completed ? "bg-slate-50 border-slate-200" : "bg-white border-slate-200 hover:border-indigo-300"
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <button 
                onClick={() => toggleTask(task.id)}
                className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                  task.completed ? "bg-indigo-500 border-indigo-500 text-white" : "border-slate-300 hover:border-indigo-500"
                }`}
              >
                {task.completed && <Check className="w-4 h-4" />}
              </button>
              <span className={`truncate text-sm font-medium ${task.completed ? "text-slate-400 line-through" : "text-slate-700"}`}>
                {task.title}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <button
                onClick={() => toggleAssignee(task.id)}
                className={`flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-md border transition-colors ${
                  task.assignee === "human" 
                    ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" 
                    : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                }`}
                title="クリックで担当を切り替え"
              >
                {task.assignee === "human" ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                {task.assignee === "human" ? "人間" : "AI"}
              </button>
              
              <button 
                onClick={() => deleteTask(task.id)}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            タスクがありません。新しいタスクを追加してください。
          </div>
        )}
      </div>
    </div>
  );
}
