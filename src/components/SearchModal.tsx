import { Search, X } from "lucide-react";
import { useEffect, useRef } from "react";

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const recentSearches = ["Landing page redesign", "Backend API tasks", "Sprint 12 blockers"];
const mockResults = {
  Projects: [
    { title: "Marketing Website v2", subtitle: "Active · 12 tasks", icon: "📂" },
    { title: "Mobile App Launch", subtitle: "On Hold · 8 tasks", icon: "📂" },
  ],
  Tasks: [
    { title: "Design hero section", subtitle: "Marketing Website v2 · Due tomorrow", icon: "✅" },
    { title: "API integration", subtitle: "Mobile App Launch · In Progress", icon: "🔵" },
  ],
  "Thinking Notes": [
    { title: "Q2 product strategy brainstorm", subtitle: "Updated 2 days ago", icon: "🧠" },
  ],
};

const SearchModal = ({ open, onOpenChange }: SearchModalProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative max-w-2xl mx-auto mt-[15vh] animate-fade-up">
        <div className="bg-popover border border-border rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input ref={inputRef} placeholder="Search projects, tasks, notes, people..." className="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground focus:outline-none" />
            <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-auto p-2">
            <div className="px-2 py-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent</span>
            </div>
            {recentSearches.map(s => (
              <button key={s} className="w-full px-3 py-2 text-sm text-left text-muted-foreground hover:bg-secondary hover:text-foreground rounded transition-colors">
                {s}
              </button>
            ))}

            {Object.entries(mockResults).map(([group, items]) => (
              <div key={group}>
                <div className="px-2 py-1.5 mt-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{group}</span>
                </div>
                {items.map(item => (
                  <button key={item.title} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-secondary rounded transition-colors">
                    <span>{item.icon}</span>
                    <div>
                      <div className="text-foreground">{item.title}</div>
                      <div className="text-xs text-muted-foreground">{item.subtitle}</div>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
            <span><kbd className="font-mono bg-secondary px-1 rounded">↑↓</kbd> Navigate</span>
            <span><kbd className="font-mono bg-secondary px-1 rounded">↵</kbd> Open</span>
            <span><kbd className="font-mono bg-secondary px-1 rounded">Esc</kbd> Close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
