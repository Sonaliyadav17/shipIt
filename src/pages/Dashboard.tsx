import { FolderOpen, CheckSquare, AlertCircle, Users, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const activity = [
  { text: "System synced metrics", time: "Just now" },
  { text: "New tasks fetched", time: "1m ago" },
  { text: "Project progress updated", time: "5m ago" },
];

const statusClass: Record<string, string> = {
  "todo": "status-todo",
  "inprogress": "status-progress",
  "blocked": "status-blocked",
  "done": "status-done",
};

const priorityClass: Record<string, string> = {
  "high": "priority-high",
  "medium": "priority-medium",
  "low": "priority-low",
};

const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects", user?.uid],
    queryFn: async () => {
      const token = await user?.getIdToken();
      const res = await fetch(`${API_BASE}/api/projects/${user?.uid}`, {
        headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) }
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!user?.uid,
  });

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["tasks", user?.uid],
    queryFn: async () => {
      const token = await user?.getIdToken();
      const res = await fetch(`${API_BASE}/api/tasks/user/${user?.uid}`, {
        headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) }
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!user?.uid,
  });

  const { data: activityFeed = [], isLoading: isLoadingActivity } = useQuery({
    queryKey: ["activity", user?.uid],
    queryFn: async () => {
      const token = await user?.getIdToken();
      const res = await fetch(`${API_BASE}/api/activity/feed/${user?.uid}`, {
        headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) }
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!user?.uid,
  });

  const activeBlockersCount = tasks.filter((t: any) => t.status === "blocked").length;
  // For tasks completed this week, approximating by checking for 'done' status
  // A perfect implementation would check updatedAt, but we'll use Done status.
  const completedTasksCount = tasks.filter((t: any) => t.status === "done" && (t.dueDate === "This Week" || t.dueDate === "Today" || t.dueDate === "Tomorrow" || !t.dueDate)).length;

  // Calculate unique team members across active projects
  const uniqueTeamMembers = Array.from(new Set(projects.flatMap((p: any) => p.teamMembers || []))).length;

  const recentTasks = tasks.slice(0, 5); // Just show top 5

  const stats = [
    { label: "Total Projects", value: isLoadingProjects ? "-" : projects.length.toString(), icon: FolderOpen, change: "All time" },
    { label: "Tasks Completed", value: isLoadingTasks ? "-" : completedTasksCount.toString(), icon: CheckSquare, change: "All time" },
    { label: "Active Blockers", value: isLoadingTasks ? "-" : activeBlockersCount.toString(), icon: AlertCircle, change: "Needs attention" },
    { label: "Team Members", value: isLoadingProjects ? "-" : uniqueTeamMembers.toString(), icon: Users, change: "Across projects" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-up">
      {/* Greeting  || "Builder" */ }
      <div>
        <h1 className="font-heading font-bold text-2xl text-foreground">Hey, {profile?.name?.split(" ")[0]} 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">You have {tasks.filter((t: any) => t.status !== "done").length} active tasks</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-4 hover:border-muted-foreground/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <s.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{s.change}</span>
            </div>
            <div className="font-heading font-bold text-2xl text-foreground">
              {(isLoadingProjects || isLoadingTasks) && (s.value === "-") ? <Loader2 className="h-4 w-4 animate-spin" /> : s.value}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Projects */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-semibold text-foreground">Active Projects</h2>
          <button onClick={() => navigate("/app/projects")} className="text-xs text-primary hover:underline flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 min-h-[160px]">
          {isLoadingProjects ? (
            <div className="w-full h-full flex items-center justify-center p-8 bg-card border border-dashed border-border rounded-lg text-muted-foreground text-sm">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center p-8 bg-card border border-dashed border-border rounded-lg text-muted-foreground text-sm">
              No active projects yet.
            </div>
          ) : (
            projects.map((p: any) => (
              <div key={p.id} onClick={() => navigate(`/app/projects/${p.id}`)} className="min-w-[260px] max-w-[260px] bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium capitalize">{p.status}</span>
                  <span className="text-xs text-muted-foreground">Due {p.dueDate || "TBD"}</span>
                </div>
                <h3 className="font-medium text-foreground text-sm mb-3 truncate">{p.title}</h3>
                <div className="mt-auto">
                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${p.progress || 0}%` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-1.5">
                      {(p.teamMembers || [""]).slice(0, 3).map((m: any, i: number) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-xs font-medium text-muted-foreground uppercase">
                          {profile?.name?.charAt(0) || "U"}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{p.progress || 0}%</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tasks + Activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="font-heading font-semibold text-foreground mb-3">Recent Tasks</h2>
          <div className="space-y-1">
            {isLoadingTasks ? (
              <div className="flex items-center justify-center py-8 bg-card rounded-lg text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading tasks...
              </div>
            ) : recentTasks.length === 0 ? (
              <div className="flex items-center justify-center py-8 bg-card border border-dashed border-border rounded-lg text-sm text-muted-foreground">
                No tasks available.
              </div>
            ) : (
              recentTasks.map((t: any) => (
                <div key={t.id} onClick={() => navigate('/app/tasks')} className="flex items-center gap-3 p-3 rounded-lg hover:bg-card transition-colors cursor-pointer group">
                  <div className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center ${t.status === "done" ? "bg-accent border-accent text-accent-foreground" : "border-muted-foreground/30"}`} >
                    {t.status === "done" && <span className="text-[10px]">✓</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${t.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>{t.title}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5 truncate">
                      <span className="font-mono bg-secondary px-1 py-0.5 rounded">{t.id.slice(-6).toUpperCase()}</span>
                      <span>·</span>
                      <span className="truncate">{t.projectName}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium whitespace-nowrap hidden sm:inline-block capitalize ${statusClass[t.status] || "bg-secondary"}`}>{t.status === 'inprogress' ? 'In Progress' : t.status}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium whitespace-nowrap capitalize ${priorityClass[t.priority] || "bg-secondary"}`}>{t.priority}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="font-heading font-semibold text-foreground mb-3">Recent Activity</h2>
          <div className="space-y-1">
            {isLoadingActivity ? (
              <div className="flex items-center justify-center py-8 bg-card rounded-lg text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading feed...
              </div>
            ) : activityFeed.length === 0 ? (
              <div className="flex items-center justify-center py-8 bg-card border border-dashed border-border rounded-lg text-sm text-muted-foreground">
                No recent activity.
              </div>
            ) : (
              activityFeed.map((a: any) => (
                <div key={`${a.type}-${a.id}`} className="p-3 rounded-lg hover:bg-card transition-colors">
                  <p className="text-sm text-foreground">{a.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">{a.timeString}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
