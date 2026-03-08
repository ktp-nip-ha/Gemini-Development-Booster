import Header from "./components/Header";
import PromptGenerator from "./components/PromptGenerator";
import RoadmapTodo from "./components/RoadmapTodo";
import CodeExtractor from "./components/CodeExtractor";

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-8">
          <PromptGenerator />
          <CodeExtractor />
        </div>
        
        <div className="flex flex-col gap-8">
          <RoadmapTodo />
        </div>
      </main>
      
      <footer className="py-4 text-center text-sm text-slate-500 border-t">
        &copy; 2026 Gemini Development Booster
      </footer>
    </div>
  );
}

export default App;
