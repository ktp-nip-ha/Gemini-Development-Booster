import { Copy, FileText, Check } from "lucide-react";
import { useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

export default function PromptGenerator() {
  const [copied, setCopied] = useState(false);
  const [focus, setFocus] = useLocalStorage("devBuddy_focus", "");
  const [context, setContext] = useLocalStorage("devBuddy_context", "");

  const generatePrompt = () => {
    return `【目的】
${focus}

【前提コンテキスト】
${context}

上記について、最適な実装方法とコード例を提示してください。
`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatePrompt());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b pb-4">
        <FileText className="w-5 h-5 text-indigo-500" />
        <h2 className="text-lg font-semibold text-slate-800">素案メモエリア</h2>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            いま解決したい課題・目的
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
            placeholder="例：ReactのカスタムフックでlocalStorageを同期したい"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            前提条件・コード断片
          </label>
          <textarea
            className="w-full px-3 py-2 border rounded-lg h-32 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
            placeholder="現在のコードや、使用している技術スタックなどを記述します..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-2 pt-4 border-t flex justify-end">
        <button
          onClick={handleCopy}
          disabled={!focus && !context}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? "コピーしました！" : "プロンプトをコピー"}</span>
        </button>
      </div>
    </div>
  );
}
