import { FileText, Check, MessageSquare, Map, ChevronUp, Edit3 } from "lucide-react";
import { useState } from "react";
import type { ProjectDraft } from "../types/project";

interface PromptGeneratorProps {
  draft: ProjectDraft;
  onChange: (draft: ProjectDraft | ((prev: ProjectDraft) => ProjectDraft)) => void;
}

export default function PromptGenerator({ draft, onChange }: PromptGeneratorProps) {
  const [copiedType, setCopiedType] = useState<"polish" | "roadmap" | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const updateDraft = (field: keyof ProjectDraft, value: string) => {
    onChange(prev => ({ ...prev, [field]: value }));
  };

  const getFormattedDraft = () => {
    return `【タイトル】
${draft.title || "（未定）"}

【一言コンセプト】
${draft.concept || "（未定）"}

【主要機能】
${draft.features || "（未定）"}

【こだわり/Vibe】
${draft.vibe || "（未定）"}

【技術スタック】
${draft.techStack || "（未定）"}`;
  };

  const generatePolishPrompt = () => {
    return `${getFormattedDraft()}

私は今、このようなアプリを考えています。空欄の部分や、より良くするためのアイデアを提案してください。`;
  };

  const generateRoadmapPrompt = () => {
    return `あなたは優秀な開発アシスタントです。
以下の【企画案】をもとに、開発の「ロードマップ」と「詳細ToDoリスト」を作成してください。
その際、私のWebアプリ側で自動解析を行うため、**必ず以下のフォーマットを厳守**してください。

## 厳守ルール（非常に重要）
1. 挨拶、前置き、結びの言葉、注釈は、一文字たりとも出力しないでください。
2. ロードマップ（親）は必ず \`### \` (ハッシュ3つと半角スペース) で始めてください。
3. ToDo（子）は必ず \`- [ ] \` (ハイフン、半角スペース、半角ブラケット、半角スペース、半角ブラケット、半角スペース) で始めてください。
   ※ \`*\`（アスタリスク）は絶対に使わないでください。必ず \`-\`（ハイフン）を使用してください。
4. Markdownのコードブロック（\`\`\`）は使用しないでください。

## 正しい出力形式の例（この通りに作成してください）
### フェーズ名
- [ ] タスク名1
- [ ] タスク名2

【企画案】
${getFormattedDraft()}`;
  };

  const handleCopy = (type: "polish" | "roadmap") => {
    const prompt = type === "polish" ? generatePolishPrompt() : generateRoadmapPrompt();
    navigator.clipboard.writeText(prompt);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const isDraftEmpty = !draft.title && !draft.concept && !draft.features && !draft.vibe && !draft.techStack;

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-300">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-semibold text-slate-800">
            企画素案: <span className="text-indigo-600 ml-1">{draft.title || "（未設定）"}</span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-2 hover:bg-indigo-50 rounded-full transition-colors text-indigo-600"
            title={isExpanded ? "閉じる" : "編集する"}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 pt-0 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col gap-4 border-t pt-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                タイトル（アプリ名）
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                placeholder="例：Sidekick"
                value={draft.title}
                onChange={(e) => updateDraft("title", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                一言コンセプト
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                placeholder="例：AI時代の個人開発を加速させるダッシュボード"
                value={draft.concept}
                onChange={(e) => updateDraft("concept", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                主要機能
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg h-24 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                placeholder="・プロンプト生成&#10;・ToDo管理&#10;・コード抽出機能"
                value={draft.features}
                onChange={(e) => updateDraft("features", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                こだわり/Vibe
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg h-20 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                placeholder="サイバーパンクなUI、徹底したキーボード操作性など"
                value={draft.vibe}
                onChange={(e) => updateDraft("vibe", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                技術スタック
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                placeholder="React, TypeScript, Tailwind CSS, Vite"
                value={draft.techStack}
                onChange={(e) => updateDraft("techStack", e.target.value)}
              />
            </div>
          </div>

          <div className="mt-2 pt-4 border-t flex flex-wrap gap-3 justify-end">
            <button
              onClick={() => handleCopy("polish")}
              disabled={isDraftEmpty}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 px-4 py-2.5 rounded-lg font-medium transition-colors border border-slate-300"
            >
              {copiedType === "polish" ? <Check className="w-4 h-4 text-emerald-600" /> : <MessageSquare className="w-4 h-4" />}
              <span>{copiedType === "polish" ? "コピー完了！" : "企画を相談・ブラッシュアップ"}</span>
            </button>

            <button
              onClick={() => handleCopy("roadmap")}
              disabled={isDraftEmpty}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
            >
              {copiedType === "roadmap" ? <Check className="w-4 h-4" /> : <Map className="w-4 h-4" />}
              <span>{copiedType === "roadmap" ? "ロードマップを作成" : "ロードマップを作成"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
