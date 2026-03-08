import { useState, useRef, useEffect } from 'react';
import { Copy, Check, GitBranch } from 'lucide-react';

export default function GitCheatSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const commands = [
    'git add .',
    'git commit -m "メッセージ"',
    'git push origin main'
  ];

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors shadow-sm"
        title="Git Cheat Sheet"
      >
        <GitBranch className="w-3.5 h-3.5" />
        <span>Git</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <h3 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Git カンニングペーパー</h3>
          <div className="space-y-2">
            {commands.map((cmd, index) => (
              <div key={index} className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded border border-slate-100 group">
                <code className="text-[11px] font-mono text-slate-700 break-all">{cmd}</code>
                <button
                  onClick={() => copyToClipboard(cmd, index)}
                  className="p-1.5 hover:bg-white hover:shadow-sm rounded transition-all text-slate-400 hover:text-indigo-600"
                  title="コピー"
                >
                  {copiedIndex === index ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 leading-tight italic">
              ※ コミットメッセージは適宜書き換えてください
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
