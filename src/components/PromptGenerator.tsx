import { FileText, Check, MessageSquare, Map, ChevronUp, Edit3 } from "lucide-react";
import { useState, memo } from "react";
import type { ProjectDraft } from "../types/project";

interface PromptGeneratorProps {
  draft: ProjectDraft;
  onChange: (draft: ProjectDraft | ((prev: ProjectDraft) => ProjectDraft)) => void;
}

// React.memoでラップして、不要な再描画を防止。
// これにより、他のコンポーネントが更新されても、プロンプトの内容が変わらなければ再描画されません。
const PromptGenerator = memo(function PromptGenerator({ draft, onChange }: PromptGeneratorProps) {
  const [copiedType, setCopiedType] = useState<"polish" | "roadmap" | "summary" | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [markdownInput, setMarkdownInput] = useState("");

  const updateDraft = (field: keyof ProjectDraft, value: string) => {
    onChange(prev => ({ ...prev, [field]: value }));
  };

  const getFormattedDraft = () => {
    return `【タイトル】
${draft.title || "（未定）"}

【一言コンセプト】
${draft.concept || "（未定）"}

【コア体験】
${draft.coreExperience || "（未定）"}

【最小機能】
${draft.mvpFeatures || "（未定）"}

【追加機能】
${draft.extraFeatures || "（未定）"}

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
    return `土台を Google Antigravity で作成するので、それを踏まえた開発ロードマップを作成してください。

以下の【企画案】の全7項目（タイトル、コンセプト、コア体験、MVP機能、追加機能、Vibe、技術スタック）を踏まえて、ステップごとの具体的な実装手順を段階ごとに提案してください。

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

  const generateSummaryPrompt = () => {
    return `これまでの対話を踏まえ、以下の【形式】を厳守してMarkdownで出力してください。
・余計な挨拶や解説は一切禁止。
・各項目は必ず【項目名】で開始すること。
・箇条書きは必ずハイフン（-）を使用すること。

【タイトル】
（アプリ名）

【一言コンセプト】
（簡潔な説明）

【コア体験】
（ユーザーがどう感じるか。複数行可）

【最小機能】
- [ ] （必須機能1）
- [ ] （必須機能2）

【追加機能】
- [ ] （余裕があればやりたいこと1）

【雰囲気】
（世界観や重視するポイント）

【技術スタック】
（使用言語やフレームワーク）`;
  };

  const handleCopy = (type: "polish" | "roadmap" | "summary") => {
    let prompt: string;
    if (type === "polish") {
      prompt = generatePolishPrompt();
    } else if (type === "roadmap") {
      prompt = generateRoadmapPrompt();
    } else {
      prompt = generateSummaryPrompt();
    }
    navigator.clipboard.writeText(prompt);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleImportMarkdown = () => {
    if (!markdownInput.trim()) return;

    // 行頭のアスタリスク形式をハイフン形式に正規化
    const normalizedInput = markdownInput
      .split("\n")
      .map(line => {
        // 行頭の `* [ ] ` → `- [ ] `
        if (line.match(/^\s*\*\s*\[\s*\]/)) {
          return line.replace(/^(\s*)\*(\s*\[\s*\])/, "$1-$2");
        }
        // 行頭の `* ` → `- `
        if (line.match(/^\s*\*\s/)) {
          return line.replace(/^(\s*)\*(\s)/, "$1-$2");
        }
        return line;
      })
      .join("\n");

    const lines = normalizedInput.split("\n");
    const extractedData: Partial<ProjectDraft> = {};

    let currentSection: keyof ProjectDraft | null = null;
    let currentContent: string[] = [];

    const sectionMap: Record<string, keyof ProjectDraft> = {
      "タイトル": "title",
      "一言コンセプト": "concept",
      "コア体験": "coreExperience",
      "最小機能": "mvpFeatures",
      "追加機能": "extraFeatures",
      "雰囲気": "vibe",
      "技術スタック": "techStack"
    };

    lines.forEach(line => {
      const trimmed = line.trim();
      
      // 【タイトル】 のような括弧付きセクションを検出
      const sectionMatch = trimmed.match(/【(.+?)】/);
      if (sectionMatch) {
        // 前のセクションを保存
        if (currentSection && currentContent.length > 0) {
          const content = currentContent.join("\n").trim();
          if (content) {
            extractedData[currentSection] = content;
          }
        }

        // 新しいセクションをセット
        const sectionName = sectionMatch[1];
        currentSection = sectionMap[sectionName] || null;
        currentContent = [];
      } else if (currentSection && trimmed) {
        // セクション内のコンテンツを追加
        currentContent.push(line);
      }
    });

    // 最後のセクションを保存
    if (currentSection && currentContent.length > 0) {
      const content = currentContent.join("\n").trim();
      if (content) {
        extractedData[currentSection] = content;
      }
    }

    // Stateに反映
    onChange(prev => ({ ...prev, ...extractedData }));
    setMarkdownInput("");
    alert("企画Markdownを取り込みました");
  };

  const isDraftEmpty = !draft.title && !draft.concept && !draft.coreExperience && !draft.mvpFeatures && !draft.extraFeatures && !draft.vibe && !draft.techStack;

  return (
    <div className="bg-white rounded-xl shadow-sm border transition-all duration-300">
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
                コア体験
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg h-16 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                placeholder="ユーザーが最初に感じる体験、中核となる価値"
                value={draft.coreExperience}
                onChange={(e) => updateDraft("coreExperience", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                最小機能（MVP Features）
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg h-16 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                placeholder="・基本的な機能1&#10;・基本的な機能2&#10;・基本的な機能3"
                value={draft.mvpFeatures}
                onChange={(e) => updateDraft("mvpFeatures", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                追加機能（Extra Features）
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg h-16 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                placeholder="・拡張機能1&#10;・拡張機能2&#10;・将来的な機能"
                value={draft.extraFeatures}
                onChange={(e) => updateDraft("extraFeatures", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                雰囲気
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
              onClick={() => handleCopy("summary")}
              disabled={isDraftEmpty}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 px-4 py-2.5 rounded-lg font-medium transition-colors border border-slate-300"
            >
              {copiedType === "summary" ? <Check className="w-4 h-4 text-emerald-600" /> : <MessageSquare className="w-4 h-4" />}
              <span>{copiedType === "summary" ? "コピー完了！" : "企画まとめプロンプト"}</span>
            </button>

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

          {/* Markdown Import Area */}
          <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">企画コピペ成形 (Markdown)</label>
            <textarea
              className="w-full h-20 px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="【タイトル】&#10;...&#10;【一言コンセプト】&#10;...&#10;【コア体験】&#10;...&#10;【最小機能】&#10;...&#10;【追加機能】&#10;...&#10;【こだわり/Vibe】&#10;...&#10;【技術スタック】&#10;..."
              value={markdownInput}
              onChange={(e) => setMarkdownInput(e.target.value)}
            />
            <button
              onClick={handleImportMarkdown}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md text-sm font-medium transition-colors"
              disabled={!markdownInput.trim()}
            >
              <Check className="w-3.5 h-3.5" />
              反映
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default PromptGenerator;
