import { useState, useEffect, useRef } from "react";
import { Bold, Italic, Heading1, Heading2, List, CheckSquare, Minus, Code, ArrowRight, Save, Plus, Trash2, Loader2, Sparkles, ClipboardList, Target, Lightbulb, TrendingUp, Briefcase, AlertTriangle, Calendar, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const ThinkingSpace = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [title, setTitle] = useState("Untitled Note");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [showPanel, setShowPanel] = useState(true);

  // Track save state
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all notes
  const { data: notes = [], isLoading: isLoadingNotes } = useQuery({
    queryKey: ["thinkingNotes", user?.uid],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/thinking/${user?.uid}`);
      if (!res.ok) throw new Error("Failed to fetch notes");
      return res.json();
    },
    enabled: !!user?.uid,
  });

  // When notes change or activeNoteId is null, select the first note OR prepare a new one if none
  useEffect(() => {
    if (notes.length > 0 && !activeNoteId) {
      handleSelectNote(notes[0]);
    } else if (notes.length === 0 && !isLoadingNotes && !activeNoteId) {
      setTitle("Untitled Note");
      setContent("");
      setTags([]);
    }
  }, [notes, activeNoteId, isLoadingNotes]);

  // Create Note Mutation
  const createNoteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/api/thinking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "New Idea",
          content: "",
          ownerId: user?.uid
        }),
      });
      if (!res.ok) throw new Error("Failed to create note");
      return res.json();
    },
    onSuccess: (newNote) => {
      queryClient.invalidateQueries({ queryKey: ["thinkingNotes", user?.uid] });
      handleSelectNote(newNote);
    }
  });

  // Update Note Mutation
  const updateNoteMutation = useMutation({
    mutationFn: async (payload: { id: string, title?: string, content?: string, tags?: string[] }) => {
      const res = await fetch(`${API_BASE}/api/thinking/${payload.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update note");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thinkingNotes", user?.uid] });
      setIsSaving(false);
    }
  });

  // Delete Note Mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/api/thinking/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete note");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thinkingNotes", user?.uid] });
      setActiveNoteId(null);
      toast.success("Note deleted");
    }
  });

  // Convert Note Mutation
  const convertNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/api/thinking/${id}/convert`, { method: "POST" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to convert note");
      }
      return res.json();
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["thinkingNotes", user?.uid] });
      toast.success("Note converted to project!");
      navigate(`/projects/${project.id || project._id}`);
    },
    onError: (err: any) => {
      toast.error(err.message);
    }
  });

  // Generate Pitch Mutation
  const generatePitchMutation = useMutation({
    mutationFn: async ({ noteId, content }: { noteId: string, content: string }) => {
      console.log("Step 2 - Calling backend at POST /api/ai/generate-pitch");
      try {
        const res = await fetch(`${API_BASE}/api/ai/generate-pitch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ noteId, content }),
        });
        console.log(`Step 3 - Response received: ${res.status}`);
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "AI generation failed, please try again");
        }
        return res.json();
      } catch (err: any) {
        console.error("Fetch failed with error:", err.message, "Type:", err.name);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thinkingNotes", user?.uid] });
      toast.success("AI Pitch Generated Successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message);
    }
  });

  // Select a note to edit
  const handleSelectNote = (note: any) => {
    setActiveNoteId(note.id);
    setTitle(note.title);
    setContent(note.content || "");
    setTags(note.tags || []);
  };

  // Debounced Auto-save
  useEffect(() => {
    if (!activeNoteId) return;

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout to save after 1.5s of typing stop
    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(() => {
      updateNoteMutation.mutate({
        id: activeNoteId,
        title,
        content,
        tags
      });
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [title, content, tags, activeNoteId]);

  const handleTagsInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagsInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagsInput.trim())) {
        setTags([...tags, tagsInput.trim()]);
      }
      setTagsInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const activeNote = notes.find((n: any) => n.id === activeNoteId);
  const isConverted = activeNote?.status === "converted";

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-up">
      <div className="flex gap-6 h-[calc(100vh-140px)]">

        {/* Notes Sidebar List */}
        <div className="w-64 shrink-0 bg-card border border-border rounded-lg flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-heading font-semibold text-sm">Your Notes</h2>
            <button
              onClick={() => createNoteMutation.mutate()}
              disabled={createNoteMutation.isPending}
              className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors"
              title="New Note"
            >
              {createNoteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoadingNotes ? (
              <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
            ) : notes.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-4">No notes yet. Create one!</div>
            ) : (
              notes.map((note: any) => (
                <div
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors text-sm group flex justify-between items-start ${activeNoteId === note.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50"}`}
                >
                  <div className="truncate pr-2">
                    <div className="font-medium truncate">{note.title || "Untitled"}</div>
                    <div className="text-xs opacity-70 truncate mt-0.5">{note.content ? note.content.substring(0, 30) + '...' : 'Empty content'}</div>
                  </div>
                  {note.status === "converted" && (
                    <span className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" title="Converted to Project" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col bg-background relative overflow-y-auto pr-2 rounded-lg scrollbar-thin">
          {!activeNoteId ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select or create a note to start thinking.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4 sticky top-0 bg-background/80 backdrop-blur-sm pt-2 pb-2 z-10">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-mono ${isConverted ? 'bg-accent/20 text-accent' : 'bg-primary/10 text-primary'}`}>
                    {isConverted ? "Converted" : "Draft"}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    {isSaving ? (
                      <><Loader2 className="h-3 w-3 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="h-3 w-3" /> Auto-saved</>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this note?")) {
                        deleteNoteMutation.mutate(activeNoteId);
                      }
                    }}
                    className="text-xs text-destructive hover:bg-destructive/10 p-1.5 rounded transition-colors"
                    title="Delete Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setShowPanel(!showPanel)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    {showPanel ? "Hide" : "Show"} panel
                  </button>
                </div>
              </div>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent font-heading font-bold text-3xl text-foreground placeholder:text-muted-foreground focus:outline-none mb-2"
                placeholder="Title your idea..."
                disabled={isConverted}
              />

              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {tags.map(tag => (
                  <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1">
                    {tag}
                    {!isConverted && (
                      <button onClick={() => removeTag(tag)} className="hover:text-foreground"><Minus className="w-3 h-3" /></button>
                    )}
                  </span>
                ))}
                {!isConverted && (
                  <input
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    onKeyDown={handleTagsInputKeyDown}
                    placeholder="Add tags... (Press Enter)"
                    className="text-sm bg-secondary border border-border rounded px-2 py-1 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-48"
                  />
                )}
              </div>

              {/* Toolbar */}
              <div className="flex items-center justify-between p-2 border border-border rounded-lg bg-card mb-4 shrink-0">
                <div className="flex items-center gap-1">
                  {[Bold, Italic, Heading1, Heading2, List, CheckSquare, Minus, Code].map((Icon, i) => (
                    <button key={i} disabled={isConverted} className={`p-2 rounded transition-colors ${isConverted ? 'opacity-50 cursor-not-allowed' : 'hover:bg-secondary text-muted-foreground hover:text-foreground'}`}>
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
                {!isConverted && (
                  <button
                    onClick={() => {
                      const wordCount = content.split(/\s+/).filter(Boolean).length;
                      console.log(`Step 1 - Button clicked, note content length: ${content.length}`);
                      if (wordCount < 50) {
                        toast.warning("Please write more about your idea before generating a plan (min 50 words).", { duration: 4000 });
                        return;
                      }
                      generatePitchMutation.mutate({ noteId: activeNoteId, content });
                    }}
                    disabled={generatePitchMutation.isPending || activeNote?.pitchGenerated}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 transition-all"
                  >
                    {generatePitchMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> AI is thinking...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Generate Plan</>
                    )}
                  </button>
                )}
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isConverted}
                className="flex-1 w-full min-h-[40vh] bg-transparent text-foreground text-sm leading-relaxed placeholder:text-muted-foreground/50 focus:outline-none resize-none"
                placeholder="Dump your idea here. Don't filter. Just think."
              />

              <div className="mt-4 pb-4 text-xs text-muted-foreground flex gap-4 shrink-0">
                <span><kbd className="font-mono bg-secondary px-1 rounded">⌘B</kbd> Bold</span>
                <span><kbd className="font-mono bg-secondary px-1 rounded">⌘I</kbd> Italic</span>
                <span><kbd className="font-mono bg-secondary px-1 rounded">⌘⇧1</kbd> H1</span>
                <span><kbd className="font-mono bg-secondary px-1 rounded">⌘⇧L</kbd> List</span>
              </div>
            </>
          )}
        </div>

        {/* Side Panel */}
        {showPanel && activeNoteId && (
          <div className={`${activeNote?.pitchGenerated ? 'w-[400px]' : 'w-72'} shrink-0 animate-fade-left overflow-y-auto scrollbar-thin`}>
            {activeNote?.pitchGenerated && activeNote?.aiPlan ? (
              <div className="space-y-4 pb-4">
                <div className="flex items-center justify-between mb-2 sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
                  <h3 className="font-heading font-bold text-lg flex items-center gap-2 text-foreground">
                    <Sparkles className="w-5 h-5 text-purple-500" /> AI Business Plan
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary border border-border" title="Pitch Score">
                      <div className={`w-2.5 h-2.5 rounded-full ${activeNote.pitchScore < 5 ? 'bg-red-500' : activeNote.pitchScore < 8 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                      <span className="text-xs font-bold font-mono">{activeNote.pitchScore}/10</span>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                  <h4 className="flex items-center gap-2 font-semibold text-sm mb-2 text-foreground">
                    <ClipboardList className="w-4 h-4 text-blue-500" /> Project Summary
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{activeNote.aiPlan.summary}</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                  <h4 className="flex items-center gap-2 font-semibold text-sm mb-3 text-foreground">
                    <Target className="w-4 h-4 text-green-500" /> Core Features
                  </h4>
                  <ul className="space-y-2">
                    {activeNote.aiPlan.features.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                  <h4 className="flex items-center gap-2 font-semibold text-sm mb-3 text-foreground">
                    <Lightbulb className="w-4 h-4 text-yellow-500" /> Additional Ideas
                  </h4>
                  <ul className="space-y-2">
                    {activeNote.aiPlan.additionalIdeas.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                  <h4 className="flex items-center gap-2 font-semibold text-sm mb-2 text-foreground">
                    <TrendingUp className="w-4 h-4 text-emerald-500" /> Market Opportunity
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{activeNote.aiPlan.marketOpportunity}</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                  <h4 className="flex items-center gap-2 font-semibold text-sm mb-2 text-foreground">
                    <Briefcase className="w-4 h-4 text-indigo-500" /> Business Pitch
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{activeNote.aiPlan.businessPitch}</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                  <h4 className="flex items-center gap-2 font-semibold text-sm mb-3 text-foreground">
                    <AlertTriangle className="w-4 h-4 text-red-500" /> Risks and Challenges
                  </h4>
                  <ul className="space-y-2">
                    {activeNote.aiPlan.risks.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                  <h4 className="flex items-center gap-2 font-semibold text-sm mb-3 text-foreground">
                    <Calendar className="w-4 h-4 text-cyan-500" /> Suggested Timeline
                  </h4>
                  <div className="space-y-3">
                    {activeNote.aiPlan.timeline.map((item: string, i: number) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-bold shrink-0">Wk {i + 1}</div>
                        <span className="text-sm text-muted-foreground leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 pb-6 space-y-3">
                  <button
                    onClick={() => convertNoteMutation.mutate(activeNoteId)}
                    disabled={isConverted || convertNoteMutation.isPending || title === "Untitled Note" || !title.trim()}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all shadow-md ${isConverted
                      ? "bg-secondary text-muted-foreground cursor-not-allowed"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg"
                      }`}
                  >
                    {convertNoteMutation.isPending ? "Converting..." : isConverted ? "Converted to Project" : "Convert & Start Building"}
                    {!isConverted && <ArrowRight className="h-4 w-4" />}
                  </button>

                  {!isConverted && (
                    <button
                      onClick={() => {
                        const wordCount = content.split(/\s+/).filter(Boolean).length;
                        console.log(`Step 1 - Button clicked, note content length: ${content.length}`);
                        if (wordCount < 50) {
                          toast.warning("Please write more about your idea before generating a plan (min 50 words).", { duration: 4000 });
                          return;
                        }
                        generatePitchMutation.mutate({ noteId: activeNoteId, content });
                      }}
                      disabled={generatePitchMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-border hover:bg-secondary text-foreground"
                    >
                      {generatePitchMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Regenerating...</>
                      ) : (
                        <><RefreshCw className="w-4 h-4 text-muted-foreground" /> Regenerate Pitch</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg p-4 sticky top-6">
                <h3 className="font-heading font-semibold text-foreground text-sm mb-3">Actions</h3>
                <button
                  onClick={() => convertNoteMutation.mutate(activeNoteId)}
                  disabled={isConverted || convertNoteMutation.isPending || title === "Untitled Note" || !title.trim()}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded text-sm font-semibold transition-colors ${isConverted
                    ? "bg-secondary text-muted-foreground cursor-not-allowed"
                    : "bg-accent text-accent-foreground hover:bg-accent/90"
                    }`}
                >
                  {convertNoteMutation.isPending ? "Converting..." : isConverted ? "Converted" : "Convert to Project"}
                  {!isConverted && <ArrowRight className="h-3.5 w-3.5" />}
                </button>
                <p className="text-xs text-muted-foreground mt-3">
                  {isConverted
                    ? "This note has been scaffolded into a project. Edits are disabled."
                    : "This will scaffold your note into a structured project with tasks, deadlines, and assignments."}
                </p>

                <div className="mt-6 pt-4 border-t border-border">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Stats</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between"><span>Words</span><span className="text-foreground font-mono">{content ? content.split(/\s+/).filter(Boolean).length : 0}</span></div>
                    <div className="flex justify-between"><span>Characters</span><span className="text-foreground font-mono">{content.length}</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ThinkingSpace;
