import { useState } from "react";
import { ListTodo, Check, Plus, Trash2, User, Bot, ChevronDown, ChevronRight, Download, MessageSquare, Camera } from "lucide-react";
import type { RoadmapItem } from "../types/project";

interface RoadmapTodoProps {
  roadmap: RoadmapItem[];
  onChange: (roadmap: RoadmapItem[]) => void;
  projectName?: string;
  scratchPad?: string;
}

export default function RoadmapTodo({ roadmap = [], onChange, projectName = "不明なプロジェクト", scratchPad = "" }: RoadmapTodoProps) {
  const [newRoadmapTitle, setNewRoadmapTitle] = useState("");
  const [markdownInput, setMarkdownInput] = useState("");
  const [includeScratchPad, setIncludeScratchPad] = useState(true);

  const safeRoadmap = roadmap || [];

  const addRoadmapItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoadmapTitle.trim()) return;
    
    onChange([
      ...safeRoadmap,
      { id: Date.now().toString(), title: newRoadmapTitle, tasks: [], expanded: true }
    ]);
    setNewRoadmapTitle("");
  };

  const addTask = (roadmapId: string) => {
    const title = window.prompt("タスクを入力してください");
    if (!title?.trim()) return;

    onChange(safeRoadmap.map(item => {
      if (item.id === roadmapId) {
        return {
          ...item,
          tasks: [
            ...(item.tasks || []),
            { id: Date.now().toString(), title, completed: false, assignee: "human" }
          ]
        };
      }
      return item;
    }));
  };

  const toggleRoadmapExpanded = (id: string) => {
    onChange(safeRoadmap.map(item => 
      item.id === id ? { ...item, expanded: !item.expanded } : item
    ));
  };

  const deleteRoadmapItem = (id: string) => {
    if (window.confirm("このセクションを削除しますか？")) {
      onChange(safeRoadmap.filter(item => item.id !== id));
    }
  };

  const toggleTask = (roadmapId: string, taskId: string) => {
    onChange(safeRoadmap.map(item => {
      if (item.id === roadmapId) {
        return {
          ...item,
          tasks: (item.tasks || []).map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
        };
      }
      return item;
    }));
  };

  const toggleAssignee = (roadmapId: string, taskId: string) => {
    onChange(safeRoadmap.map(item => {
      if (item.id === roadmapId) {
        return {
          ...item,
          tasks: (item.tasks || []).map(t => {
            if (t.id === taskId) {
              return { ...t, assignee: t.assignee === "human" ? "ai" : "human" };
            }
            return t;
          })
        };
      }
      return item;
    }));
  };

  const deleteTask = (roadmapId: string, taskId: string) => {
    onChange(safeRoadmap.map(item => {
      if (item.id === roadmapId) {
        return {
          ...item,
          tasks: (item.tasks || []).filter(t => t.id !== taskId)
        };
      }
      return item;
    }));
  };

  const handleStrategyMeeting = (item: RoadmapItem) => {
    const taskList = (item.tasks || [])
      .map(t => `- [${t.completed ? "x" : " "}] ${t.title} (担当: ${t.assignee === "human" ? "人間" : "AI"})`)
      .join("\n");

    const prompt = `以下のフェーズについての作戦会議をお願いします。

## フェーズ: ${item.title}

### 現在のToDoリスト:
${taskList || "（タスクなし）"}

### 相談内容:
1. このフェーズをどう進めるべきか
2. AIと人間の役割分担の提案
3. 最初にCursorに投げるべき指示（プロンプト）の作成

上記3点について、具体的なアドバイスをお願いします。`;

    navigator.clipboard.writeText(prompt).then(() => {
      alert("作戦会議用のプロンプトをクリップボードにコピーしました。Geminiに貼り付けて相談してください。");
    }).catch(err => {
      console.error("Failed to copy: ", err);
      alert("コピーに失敗しました。");
    });
  };

  const handleImportMarkdown = () => {
    if (!markdownInput.trim()) return;

    const lines = markdownInput.split("\n");
    const newRoadmap: RoadmapItem[] = [...safeRoadmap];
    let currentItem: RoadmapItem | null = null;

    lines.forEach(line => {
      // 追加：もし行が ``` で始まっていたら、その行は無視して次に進む
      if (line.trim().startsWith('```')) return;
      const roadmapMatch = line.match(/^###\s+(.+)$/);
      const taskMatch = line.match(/^[*-]\s+\[([ xX]?)\]\s+(.+)$/);

      if (roadmapMatch) {
        currentItem = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          title: roadmapMatch[1].trim(),
          tasks: [],
          expanded: true
        };
        newRoadmap.push(currentItem);
      } else if (taskMatch && currentItem) {
        currentItem.tasks.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          title: taskMatch[2].trim(),
          completed: taskMatch[1].toLowerCase() === "x",
          assignee: "human"
        });
      }
    });

    onChange(newRoadmap);
    setMarkdownInput("");
    alert("Markdownを取り込みました");
  };

  const handleSnapshot = () => {
    const summary = safeRoadmap.map(item => {
      const tasks = item.tasks || [];
      const completedCount = tasks.filter(t => t.completed).length;
      const incompleteTasks = tasks.filter(t => !t.completed);
      
      return {
        title: item.title,
        completedCount,
        incompleteTasks
      };
    });

    const completedSummary = summary
      .filter(s => s.completedCount > 0)
      .map(s => `・${s.title}：${s.completedCount}件のタスクを完了`)
      .join("\n");

    const incompleteList = summary
      .flatMap(s => s.incompleteTasks.map(t => `- [ ] ${t.title} (${s.title})`))
      .join("\n");

    let prompt = `## **【現在の開発状況スナップショット】**
アプリ名：${projectName}
**完了済み（要約）：**
${completedSummary || "なし"}

**未完了（次に取り組むこと）：**
${incompleteList || "なし（すべてのタスクが完了しています！）"}`;

    if (includeScratchPad && scratchPad.trim()) {
      prompt += `\n\n【一時メモの内容】\n${scratchPad}`;
    }

    prompt += `\n\n## **【Geminiへの依頼】**
現在の進捗は上記の通りです。これらを踏まえて、次に着手すべき機能の実装方針や、注意点を教えてください。`;

    navigator.clipboard.writeText(prompt).then(() => {
      alert("開発状況のスナップショットをクリップボードにコピーしました。Geminiに貼り付けて相談してください。");
    }).catch(err => {
      console.error("Failed to copy snapshot: ", err);
      alert("コピーに失敗しました。");
    });
  };

  // 全体の進捗計算
  const allTasks = safeRoadmap.flatMap(item => item.tasks || []);
  const totalCompletedCount = allTasks.filter(t => t.completed).length;
  const totalProgressPercent = allTasks.length === 0 ? 0 : Math.round((totalCompletedCount / allTasks.length) * 100);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-semibold text-slate-800">ロードマップ ＆ ToDo</h2>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer hover:text-slate-700 transition-colors">
            <input 
              type="checkbox" 
              checked={includeScratchPad} 
              onChange={(e) => setIncludeScratchPad(e.target.checked)}
              className="rounded text-indigo-500 focus:ring-indigo-500"
            />
            メモを含める
          </label>
          <button
            onClick={handleSnapshot}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm hover:shadow-md active:scale-95"
            title="現在の進捗状況をプロンプトとしてコピー"
          >
            <Camera className="w-3.5 h-3.5" />
            作業状況をスナップショット
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm text-slate-600 font-medium">
          <span>全体の進捗率</span>
          <span>{totalProgressPercent}%</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${totalProgressPercent}%` }}
          />
        </div>
      </div>

      {/* Roadmap Input */}
      <form onSubmit={addRoadmapItem} className="flex gap-2">
        <input
          type="text"
          className="flex-grow px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-sm"
          placeholder="新しいロードマップ（親）を追加..."
          value={newRoadmapTitle}
          onChange={(e) => setNewRoadmapTitle(e.target.value)}
        />
        <button 
          type="submit"
          className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-1 text-sm whitespace-nowrap"
          disabled={!newRoadmapTitle.trim()}
        >
          <Plus className="w-4 h-4" />
          親追加
        </button>
      </form>

      {/* Markdown Import Area */}
      <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-lg border border-dashed border-slate-300">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">コピペ成形ツール (Markdown)</label>
        <textarea
          className="w-full h-20 px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="### 親項目&#10;- [ ] 子タスク1&#10;- [ ] 子タスク2"
          value={markdownInput}
          onChange={(e) => setMarkdownInput(e.target.value)}
        />
        <button
          onClick={handleImportMarkdown}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md text-sm font-medium transition-colors"
          disabled={!markdownInput.trim()}
        >
          <Download className="w-4 h-4" />
          Markdownから一括登録
        </button>
      </div>

      {/* Roadmap List */}
      <div className="flex flex-col gap-4 pr-1">
        {safeRoadmap.map(item => {
          const itemTasks = item.tasks || [];
          const itemCompletedCount = itemTasks.filter(t => t.completed).length;
          const itemProgressPercent = itemTasks.length === 0 ? 0 : Math.round((itemCompletedCount / itemTasks.length) * 100);

          return (
            <div key={item.id} className="border rounded-lg overflow-hidden">
              {/* Parent Header */}
              <div 
                className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                  itemProgressPercent === 100 
                    ? "bg-emerald-50 border-emerald-200"
                    : item.expanded ? "bg-slate-50 border-b" : "bg-white hover:bg-slate-50"
                }`}
                onClick={() => toggleRoadmapExpanded(item.id)}
>
                <div className="flex items-center gap-2 overflow-hidden flex-grow">
                  {item.expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span className="font-bold text-slate-700 truncate">{item.title}</span>
                  <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold">
                    {itemProgressPercent}%
                  </span>
                </div>
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={() => handleStrategyMeeting(item)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    title="作戦会議（プロンプトをコピー）"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => addTask(item.id)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    title="子タスクを追加"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => deleteRoadmapItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Children Tasks */}
              {item.expanded && (
                <div className="p-2 flex flex-col gap-2 bg-white">
                  {itemTasks.map(task => (
                    <div 
                      key={task.id} 
                      className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                        task.completed ? "bg-slate-50 border-slate-100" : "bg-white border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <button 
                          onClick={() => toggleTask(item.id, task.id)}
                          className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                            task.completed ? "bg-indigo-500 border-indigo-500 text-white" : "border-slate-300 hover:border-indigo-500"
                          }`}
                        >
                          {task.completed && <Check className="w-3 h-3" />}
                        </button>
                        <span className={`truncate text-xs font-medium ${task.completed ? "text-slate-400 line-through" : "text-slate-700"}`}>
                          {task.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        <button
                          onClick={() => toggleAssignee(item.id, task.id)}
                          className={`flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded border transition-colors ${
                            task.assignee === "human" 
                              ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" 
                              : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          }`}
                        >
                          {task.assignee === "human" ? <User className="w-2.5 h-2.5" /> : <Bot className="w-2.5 h-2.5" />}
                          {task.assignee === "human" ? "人間" : "AI"}
                        </button>
                        <button 
                          onClick={() => deleteTask(item.id, task.id)}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {itemTasks.length === 0 && (
                    <div className="text-center py-4 text-slate-400 text-xs italic">
                      タスクがありません
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {safeRoadmap.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            ロードマップがありません。新しいセクションを追加するか、Markdownからインポートしてください。
          </div>
        )}
      </div>
    </div>
  );
}
