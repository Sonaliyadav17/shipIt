import { useState, useMemo } from "react";
import { Plus, MoreHorizontal, Calendar, Check, X, Loader2, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

interface Task {
  id: string;
  title: string;
  assigneeName: string;
  priority: "high" | "medium" | "low";
  dueDate: string;
  status: string;
}

const columnColors: Record<string, string> = {
  "todo": "bg-primary",
  "inprogress": "bg-[hsl(var(--warning))]",
  "blocked": "bg-destructive",
  "done": "bg-accent",
};

const priorityClass: Record<string, string> = {
  high: "priority-high",
  medium: "priority-medium",
  low: "priority-low",
};

const ProjectDetail = () => {
  const { id: projectId } = useParams();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("Board");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskStatus, setNewTaskStatus] = useState("todo");

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const navigate = useNavigate();

  // AI Plan Editor State
  const [editedPlan, setEditedPlan] = useState({
    summary: "",
    businessPitch: ""
  });

  // Fetch parent project to get details like title
  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/projects/${user?.uid}`);
      if (!res.ok) throw new Error("Failed to fetch projects");
      const projects = await res.json();
      return projects.find((p: any) => p.id === projectId);
    },
    enabled: !!projectId && !!user?.uid,
  });

  // Fetch ThinkingNote data for the AI Plan
  const { data: thinkingNote, isLoading: isNoteLoading } = useQuery({
    queryKey: ["thinkingNote", project?.thinkingNoteId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/thinking/note/${project.thinkingNoteId}`);
      if (!res.ok) throw new Error("Failed to fetch thinking note for AI plan");
      const noteData = await res.json();

      // Initialize edit state with existing data
      if (noteData?.aiPlan) {
        setEditedPlan({
          summary: noteData.aiPlan.summary || "",
          businessPitch: noteData.aiPlan.businessPitch || ""
        });
      }
      return noteData;
    },
    enabled: !!project?.thinkingNoteId && activeTab === "✨ AI Plan",
  });

  // Mutation to save edited AI Plan
  const saveAiPlanMutation = useMutation({
    mutationFn: async () => {
      if (!project?.thinkingNoteId) throw new Error("No linked thinking note found.");

      const payload = {
        aiPlan: {
          ...project.aiPlan, // Keep existing fields untouched
          summary: editedPlan.summary,
          businessPitch: editedPlan.businessPitch
        }
      };

      const res = await fetch(`${API_BASE}/api/thinking/note/${project.thinkingNoteId}/aiplan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update AI Plan");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thinkingNote", project?.thinkingNoteId] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["investor_projects"] });
      toast.success("AI Plan saved successfully!");
    },
    onError: () => toast.error("Failed to save AI Plan"),
  });

  // Fetch tasks
  const { data: rawTasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["tasks", "project", projectId],
    queryFn: async () => {
      const token = await user?.getIdToken();
      const res = await fetch(`${API_BASE}/api/tasks/project/${projectId}`, {
        headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) }
      });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
    enabled: !!projectId,
  });

  // Group tasks by column
  const initialColumns: Record<string, Task[]> = {
    "todo": [],
    "inprogress": [],
    "blocked": [],
    "done": []
  };

  const tasksByColumn = useMemo(() => {
    const grouped = { ...initialColumns };
    rawTasks.forEach((t: any) => {
      const col = t.status || "todo";
      if (!grouped[col]) grouped[col] = [];
      grouped[col].push({
        id: t.id,
        title: t.title,
        assigneeName: t.assigneeName || t.assigneeId?.substring(0, 2) || "U",
        status: t.status,
        priority: t.priority || "Medium",
        dueDate: t.dueDate || "TBD"
      });
    });
    return grouped;
  }, [rawTasks]);

  const createTaskMutation = useMutation({
    mutationFn: async (newTask: any) => {
      const token = await user?.getIdToken();
      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(newTask),
      });
      if (!res.ok) throw new Error("Failed to create task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Task created");
      setIsCreateOpen(false);
      setNewTaskTitle("");
    },
    onError: () => toast.error("Failed to create task"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string, newStatus: string }) => {
      const token = await user?.getIdToken();
      const res = await fetch(`${API_BASE}/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to move task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
    onError: () => toast.error("Failed to move task"),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const token = await user?.getIdToken();
      const res = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) }
      });
      if (!res.ok) throw new Error("Failed to delete task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Task deleted");
      setSelectedTask(null);
    },
    onError: () => toast.error("Failed to delete task"),
  });

  const toggleInvestmentMutation = useMutation({
    mutationFn: async (val: boolean) => {
      const token = await user?.getIdToken();
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/investment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ isOpenToInvestment: val }),
      });
      if (!res.ok) throw new Error("Failed to update investment status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Investment status updated");
    }
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    createTaskMutation.mutate({
      title: newTaskTitle,
      status: newTaskStatus,
      projectId,
      projectName: project?.title || "Unknown",
      assigneeId: user?.uid,
      assigneeName: profile?.name?.charAt(0) || "U",
    });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedTaskId) {
      // Find current task to prevent unnecessary calls
      const task = rawTasks.find((t: any) => t.id === draggedTaskId);
      if (task && task.status !== newStatus) {
        // Optimistic UI update could go here
        updateStatusMutation.mutate({ taskId: draggedTaskId, newStatus });
      }
    }
    setDraggedTaskId(null);
  };

  const tabs = ["Board", "List", "Timeline", "Files", "Discussion", "✨ AI Plan"];

  return (
    <div className="max-w-7xl mx-auto animate-fade-up">
      {/* Header */}
      <div className="flex flex-col gap-4 mx-2 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="font-heading font-bold text-2xl text-foreground">
            {project ? project.title : <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
          </h1>
          {project && (
            <>
              <span className="text-xs px-2.5 py-1 rounded bg-accent/15 text-accent font-medium capitalize">{project.status}</span>
              {project.isOpenToInvestment && (
                <span className="text-xs px-2.5 py-1 rounded bg-green-500/20 text-green-500 font-medium flex items-center gap-1">
                  💰 Seeking Investment
                </span>
              )}
              <span className="text-xs text-muted-foreground flex items-center gap-1 xl:ml-2"><Calendar className="h-3 w-3" /> Due {project.dueDate || "TBD"}</span>
            </>
          )}
        </div>

        {project && (
          <div className="flex border-b border-border pb-4 mt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={project.isOpenToInvestment}
                  disabled={toggleInvestmentMutation.isPending}
                  onChange={(e) => toggleInvestmentMutation.mutate(e.target.checked)}
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${project.isOpenToInvestment ? 'bg-primary' : 'bg-secondary'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-background text-primary w-4 h-4 rounded-full transition-transform ${project.isOpenToInvestment ? 'transform translate-x-4' : ''}`}></div>
              </div>
              <span className="text-sm font-medium text-foreground">Open to Investment 💰</span>
            </label>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto mx-2 hidden-scrollbar">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
        ))}
      </div>

      {isLoadingTasks ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : activeTab === "Board" ? (
        <div className="flex gap-4 overflow-x-auto pb-4 mx-2 min-h-[500px]">
          {Object.entries(tasksByColumn).map(([column, columnTasks]) => (
            <div
              key={column}
              className="min-w-[280px] flex-1 bg-background/50 rounded-xl p-2"
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
              onDrop={(e) => handleDrop(e, column)}
            >
              <div className="flex items-center gap-2 mb-3 px-2">
                <div className={`w-2 h-2 rounded-full ${columnColors[column]}`} />
                <span className="text-sm font-medium text-foreground">{column}</span>
                <span className="text-xs text-muted-foreground ml-1">{columnTasks.length}</span>
                <Dialog open={isCreateOpen && newTaskStatus === column} onOpenChange={(open) => {
                  setNewTaskStatus(column);
                  setIsCreateOpen(open);
                }}>
                  <DialogTrigger asChild>
                    <button className="ml-auto p-1 text-muted-foreground hover:text-foreground"><Plus className="h-4 w-4" /></button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add Task to {column}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateTask} className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Task Title</label>
                        <Input autoFocus value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} required />
                      </div>
                      <Button type="submit" disabled={createTaskMutation.isPending} className="w-full">
                        {createTaskMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Task
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-2 min-h-[100px]">
                {columnTasks.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => setSelectedTask(task)}
                    className="bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-colors cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                        {task.id.slice(-6)}
                      </span>
                      <button className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all"><MoreHorizontal className="h-3.5 w-3.5" /></button>
                    </div>
                    <p className="text-sm font-medium text-foreground mb-3">{task.title}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-xs text-muted-foreground uppercase">{task.assigneeName}</div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${priorityClass[task.priority]}`}>{task.priority}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{task.dueDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === "List" ? (
        <div className="space-y-2 mx-2">
          {rawTasks.map((task: any) => (
            <div key={task.id} className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-muted-foreground/30 transition-colors cursor-pointer" onClick={() => setSelectedTask(task)}>
              <span className="font-mono text-xs text-muted-foreground w-16 uppercase">{task.id.slice(-6)}</span>
              <span className="text-sm text-foreground flex-1">{task.title}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-medium capitalize ${priorityClass[task.priority] || "bg-secondary"}`}>{task.priority || "medium"}</span>
              <span className="text-[10px] text-muted-foreground min-w-[60px]">{task.dueDate || "TBD"}</span>
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs text-muted-foreground uppercase">
                {task.assigneeName || task.assigneeId?.substring(0, 2) || "U"}
              </div>
            </div>
          ))}
          {rawTasks.length === 0 && <p className="text-muted-foreground text-sm py-8 border border-dashed border-border rounded-xl p-8 text-center bg-card">No tasks created yet.</p>}
        </div>
      ) : activeTab === "✨ AI Plan" ? (
        <div className="max-w-4xl mx-auto space-y-8 bg-card border border-border rounded-xl p-8 mb-20 shadow-sm relative">

          {isNoteLoading && (
            <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-xl">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {!project?.thinkingNoteId || !thinkingNote?.pitchGenerated ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💡</span>
              </div>
              <h3 className="text-xl font-heading font-bold text-foreground mb-2">No AI Plan Generated Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Head over to the Thinking Space to generate a comprehensive business plan from your raw ideas.
              </p>
              <Button onClick={() => navigate("/thinking")} className="gap-2">
                Generate Plan in Thinking Space
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-border pb-6">
                <div>
                  <h2 className="text-2xl font-heading font-bold text-foreground">AI Business Plan</h2>
                  <p className="text-sm text-muted-foreground mt-1">Review and refine your auto-generated plan.</p>
                </div>
                <Button
                  onClick={() => saveAiPlanMutation.mutate()}
                  disabled={saveAiPlanMutation.isPending}
                  className="gap-2"
                >
                  {saveAiPlanMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Project Name</label>
                  <Input
                    value={editedPlan.summary}
                    onChange={(e) => setEditedPlan({ ...editedPlan, summary: e.target.value })}
                    className="font-medium"
                    placeholder="Enter project name..."
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-2">
                    💰 Business Pitch
                  </label>
                  <textarea
                    value={editedPlan.businessPitch}
                    onChange={(e) => setEditedPlan({ ...editedPlan, businessPitch: e.target.value })}
                    className="w-full min-h-[400px] p-3 text-sm bg-primary/5 text-foreground font-medium border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-y"
                    placeholder="Write your comprehensive business pitch here..."
                  />
                </div>

              </div>
            </>
          )}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-sm">{activeTab} view coming soon</p>
        </div>
      )}

      {/* Task Drawer */}
      {selectedTask && (
        <>
          <div className="fixed inset-0 bg-background/80 z-40 backdrop-blur-sm" onClick={() => setSelectedTask(null)} />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-popover border-l border-border z-50 p-6 overflow-auto" style={{ animation: "slideInRight 0.2s ease-out" }}>
            <div className="flex items-center justify-between mb-6">
              <span className="font-mono text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                Task • {selectedTask.id.slice(-8)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this task?")) {
                      deleteTaskMutation.mutate(selectedTask.id);
                    }
                  }}
                  className="text-muted-foreground hover:text-destructive text-sm p-1"
                  disabled={deleteTaskMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button onClick={() => setSelectedTask(null)} className="text-muted-foreground hover:text-foreground text-sm p-1"><X className="h-5 w-5" /></button>
              </div>
            </div>

            <h2 className="font-heading font-bold text-xl text-foreground mb-6">{selectedTask.title}</h2>

            <div className="space-y-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className={`px-2 py-0.5 rounded font-medium text-xs ${selectedTask.status === "To Do" ? "bg-primary text-primary-foreground" :
                  selectedTask.status === "In Progress" ? "bg-[hsl(var(--warning))] text-white" :
                    selectedTask.status === "Blocked" ? "bg-destructive text-destructive-foreground" :
                      "bg-accent text-accent-foreground"
                  }`}>{selectedTask.status || "To Do"}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Priority</span>
                <span className={`px-2 py-0.5 rounded font-medium text-xs ${priorityClass[selectedTask.priority]}`}>{selectedTask.priority}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Due Date</span>
                <span className="text-foreground">{selectedTask.dueDate}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Assignee</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs text-muted-foreground uppercase">{selectedTask.assigneeName}</div>
                </div>
              </div>

              <div className="border-t border-border pt-5">
                <h3 className="text-sm font-medium text-foreground mb-2">Description</h3>
                <p className="text-sm text-muted-foreground p-3 rounded-lg bg-secondary/30 border border-border min-h-[100px]">No description provided.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectDetail;
