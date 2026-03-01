import { useState } from "react";
import { Calendar, List as ListIcon, Loader2, Check } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const statusClass: Record<string, string> = { "todo": "status-todo", "inprogress": "status-progress", "blocked": "status-blocked", "done": "status-done" };
const priorityClass: Record<string, string> = { "high": "priority-high", "medium": "priority-medium", "low": "priority-low" };

const MyTasks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("All");
  const [view, setView] = useState<"list" | "calendar">("list");
  const filters = ["All", "Due Today", "This Week", "Overdue"];

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", user?.uid],
    queryFn: async () => {
      const token = await user?.getIdToken();
      const res = await fetch(`${API_BASE}/api/tasks/user/${user?.uid}`, {
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
    enabled: !!user?.uid,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string, newStatus: string }) => {
      const token = await user?.getIdToken();
      const res = await fetch(`${API_BASE}/api/tasks/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update task status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", user?.uid] });
      toast.success("Task updated");
    },
    onError: () => {
      toast.error("Failed to update task");
    },
  });

  const filtered = filter === "All" ? tasks : tasks.filter((t: any) => {
    // Basic string matching temporarily based on original UI design patterns
    if (filter === "Due Today") return t.dueDate === "Today" || t.dueDate?.includes("Today");
    if (filter === "This Week") return t.dueDate === "This Week" || t.dueDate?.includes("Week") || t.dueDate === "Today" || t.dueDate === "Tomorrow";
    if (filter === "Overdue") return t.dueDate === "Overdue" || t.dueDate?.includes("Overdue");
    return true;
  });

  const handleToggleDone = (task: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = task.status === "done" ? "todo" : "done";
    toggleStatusMutation.mutate({ id: task.id, newStatus });
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-up px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl text-foreground">My Tasks</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setView("list")} className={`p-2 rounded ${view === "list" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}><ListIcon className="h-4 w-4" /></button>
          <button onClick={() => setView("calendar")} className={`p-2 rounded ${view === "calendar" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}><Calendar className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 hidden-scrollbar">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-xl bg-card text-muted-foreground text-sm">
          No tasks found for the selected filter.
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((t: any) => (
            <div key={t.id} className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 rounded-lg hover:bg-card transition-colors cursor-pointer group border border-transparent hover:border-border">
              <button
                onClick={(e) => handleToggleDone(t, e)}
                disabled={toggleStatusMutation.isPending}
                className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${t.status === "done" ? "bg-accent border-accent text-accent-foreground" : "border-muted-foreground/30 hover:border-primary"}`}
              >
                {t.status === "done" && <Check className="h-3 w-3" />}
              </button>

              <div className="flex flex-1 min-w-0 flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 shrink">
                <span className={`text-sm font-medium truncate ${t.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>{t.title}</span>
                <span className="text-xs text-muted-foreground truncate">{t.projectName}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
                <span className={`text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap capitalize ${statusClass[t.status] || "bg-secondary text-foreground"}`}>{t.status === 'inprogress' ? 'In Progress' : t.status}</span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap hidden capitalize sm:inline-block ${priorityClass[t.priority] || "bg-secondary text-foreground"}`}>{t.priority}</span>
                <span className={`text-xs whitespace-nowrap ${t.due === "Overdue" ? "text-destructive font-medium" : "text-muted-foreground"}`}>{t.dueDate || "No date"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTasks;
