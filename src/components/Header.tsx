import { ExternalLink, Sparkles, ChevronLeft } from "lucide-react";

interface HeaderProps {
  currentProjectName?: string;
  onBackToDashboard?: () => void;
}

export default function Header({ currentProjectName, onBackToDashboard }: HeaderProps) {
  const openGemini = () => {
    window.open("https://gemini.google.com/app", "_blank");
  };

  return (
    <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
              title="ダッシュボードに戻る"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <div className="flex items-center gap-2 text-indigo-600">
            <Sparkles className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-tight">
              {currentProjectName ? (
                <span className="flex items-center gap-2">
                  <span className="text-slate-400 font-normal hidden sm:inline">Project:</span>
                  <span className="text-slate-800">{currentProjectName}</span>
                </span>
              ) : (
                "Gemini Development Booster"
              )}
            </h1>
          </div>
        </div>
        
        <button
          onClick={openGemini}
          className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-medium transition-colors"
        >
          <span className="hidden sm:inline">Geminiを開く</span>
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
