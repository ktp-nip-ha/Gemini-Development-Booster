import { useState } from "react";
import { Code2, ArrowRightLeft, Copy, Check } from "lucide-react";
import { useLocalStorage } from "../hooks/useLocalStorage";

export default function CodeExtractor() {
  const [markdown, setMarkdown] = useLocalStorage("devBuddy_markdown", "");
  const [extractedCode, setExtractedCode] = useState("");
  const [copied, setCopied] = useState(false);

  const handleExtract = () => {
    // 正規表現でコードブロック (```...```) を抽出
    const regex = /```[\s\S]*?\n([\s\S]*?)```/g;
    let match;
    const codes: string[] = [];

    while ((match = regex.exec(markdown)) !== null) {
      if (match[1]) {
        codes.push(match[1].trim());
      }
    }

    if (codes.length > 0) {
      setExtractedCode(codes.join("\n\n// ---\n\n"));
    } else {
      setExtractedCode("対象のコードブロックが見つかりませんでした。");
    }
  };

  const handleCopy = () => {
    if (!extractedCode || extractedCode === "対象のコードブロックが見つかりませんでした。") return;
    navigator.clipboard.writeText(extractedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b pb-4">
        <Code2 className="w-5 h-5 text-indigo-500" />
        <h2 className="text-lg font-semibold text-slate-800">コピペ整形ツール</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700 flex justify-between">
            <span>AIの回答 (Markdown)</span>
          </label>
          <textarea
            className="w-full px-3 py-2 border rounded-lg h-48 font-mono text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
            placeholder="AIからの回答をここにペースト..."
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
          />
        </div>

        {/* Output */}
        <div className="flex flex-col gap-2 relative">
          <div className="text-sm font-medium text-slate-700 flex items-center justify-between">
            <span>抽出されたコード</span>
            <button
              onClick={handleCopy}
              disabled={!extractedCode || extractedCode === "対象のコードブロックが見つかりませんでした。"}
              className="text-indigo-600 hover:text-indigo-700 disabled:opacity-50 flex items-center gap-1 text-xs font-semibold bg-indigo-50 px-2.5 py-1 rounded-md transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "コピー済" : "コードをコピー"}
            </button>
          </div>
          <textarea
            readOnly
            className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg h-48 font-mono text-sm resize-none text-slate-800 focus:outline-none"
            placeholder="抽出ボタンを押すとここにコードのみが表示されます"
            value={extractedCode}
          />
        </div>
      </div>

      <div className="flex justify-center -mt-2">
        <button
          onClick={handleExtract}
          disabled={!markdown.trim()}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white px-5 py-2 rounded-full font-medium transition-colors shadow-sm"
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>コードだけを抽出</span>
        </button>
      </div>
    </div>
  );
}
