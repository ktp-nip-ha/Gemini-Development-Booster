import { useState } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import type { Project } from "../types/project";

interface ProjectHeaderProps {
  project: Project;
}

export default function ProjectHeader({ project }: ProjectHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-indigo-900 text-white shadow-md border-b border-indigo-800 transition-all duration-300">
      <div 
        className="container mx-auto px-4 py-4 flex items-center justify-between cursor-pointer hover:bg-indigo-800/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/30 p-2 rounded-lg">
            <FileText className="w-5 h-5 text-indigo-200" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{project.name}</h2>
            {!isOpen && (
              <p className="text-indigo-300 text-sm truncate max-w-md">
                {project.draft.concept || "企画素案を表示"}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-indigo-300">
          <span className="text-sm font-medium">{isOpen ? "閉じる" : "詳細を表示"}</span>
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>
      
      {isOpen && (
        <div className="container mx-auto px-4 pb-6 pt-2 animate-in slide-in-from-top-2 duration-300">
          <div className="bg-indigo-800/40 rounded-xl p-6 border border-indigo-700/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-2">
                  【タイトル】
                </h3>
                <div className="text-indigo-50 font-bold mb-4">
                  {project.draft.title || "（未定）"}
                </div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-2">
                  【一言コンセプト】
                </h3>
                <div className="text-indigo-50 whitespace-pre-wrap mb-4">
                  {project.draft.concept || "（未定）"}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-2">
                  【主要機能】
                </h3>
                <div className="text-indigo-50 whitespace-pre-wrap mb-4">
                  {project.draft.features || "（未定）"}
                </div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-2">
                  【こだわり/Vibe】
                </h3>
                <div className="text-indigo-50 whitespace-pre-wrap mb-4">
                  {project.draft.vibe || "（未定）"}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-2">
                  【技術スタック】
                </h3>
                <div className="text-indigo-50 whitespace-pre-wrap">
                  {project.draft.techStack || "（未定）"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
