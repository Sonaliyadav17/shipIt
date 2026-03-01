import { useQuery } from "@tanstack/react-query";
import { Loader2, TrendingUp, Calendar, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const Analytics = () => {
  const { user } = useAuth();

  const { data: weeklyData = [], isLoading: loadingWeekly } = useQuery({
    queryKey: ["analytics", "weekly", user?.uid],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/analytics/weekly/${user?.uid}`);
      if (!res.ok) throw new Error("Failed to fetch weekly analytics");
      return res.json();
    },
    enabled: !!user?.uid,
  });

  const { data: projectHealth = [], isLoading: loadingHealth } = useQuery({
    queryKey: ["analytics", "health", user?.uid],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/analytics/health/${user?.uid}`);
      if (!res.ok) throw new Error("Failed to fetch project health");
      return res.json();
    },
    enabled: !!user?.uid,
  });

  const { data: heatmapData = [], isLoading: loadingHeatmap } = useQuery({
    queryKey: ["analytics", "heatmap", user?.uid],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/analytics/heatmap/${user?.uid}`);
      if (!res.ok) throw new Error("Failed to fetch heatmap data");
      return res.json();
    },
    enabled: !!user?.uid,
  });

  const maxTasks = weeklyData.length > 0 ? Math.max(...weeklyData.map((d: any) => d.tasks)) : 0;
  const totalTasks = weeklyData.reduce((acc: number, d: any) => acc + d.tasks, 0);
  const bestDayObj = weeklyData.find((d: any) => d.tasks === maxTasks && maxTasks > 0);
  const averagePerDay = weeklyData.length > 0 ? (totalTasks / weeklyData.length).toFixed(1) : "0";

  const isLoading = loadingWeekly || loadingHealth || loadingHeatmap;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-up space-y-6">
      <h1 className="font-heading font-bold text-2xl text-foreground">Analytics</h1>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-xs font-mono text-muted-foreground uppercase">This Week</span>
          </div>
          <p className="text-2xl font-bold font-heading text-foreground">{totalTasks} tasks</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-xs font-mono text-muted-foreground uppercase">Best Day</span>
          </div>
          <p className="text-2xl font-bold font-heading text-foreground">
            {bestDayObj ? `${bestDayObj.day} (${bestDayObj.tasks})` : "N/A"}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-xs font-mono text-muted-foreground uppercase">Average / Day</span>
          </div>
          <p className="text-2xl font-bold font-heading text-foreground">{averagePerDay}</p>
        </div>
      </div>

      {/* Weekly bar chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="font-heading font-semibold text-foreground text-sm mb-6">Tasks Completed This Week</h2>
        <div className="flex items-end gap-4 h-64">
          {weeklyData.map((d: any) => {
            let barColor = "bg-primary"; // standard primary
            let bgWrapper = "bg-primary/20";
            if (d.tasks === 0) {
              barColor = "bg-destructive"; // red
              bgWrapper = "bg-destructive/10";
            } else if (d.tasks === maxTasks && maxTasks > 0) {
              barColor = "bg-green-500"; // green
              bgWrapper = "bg-green-500/20";
            } else {
              barColor = "bg-blue-500";
              bgWrapper = "bg-blue-500/20";
            }

            return (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-3">
                <span className="text-xs font-mono text-muted-foreground">{d.tasks}</span>
                <div
                  className={`w-full ${bgWrapper} rounded-t transition-all duration-500 flex items-end`}
                  style={{ height: `${maxTasks ? (d.tasks / maxTasks) * 100 : 0}%`, minHeight: "4px" }}
                >
                  <div className={`w-full h-full ${barColor} rounded-t`} />
                </div>
                <span className="text-xs text-muted-foreground font-medium">{d.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Project health */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="font-heading font-semibold text-foreground text-sm mb-6">Project Health</h2>
        {projectHealth.length === 0 ? (
          <p className="text-sm text-muted-foreground">No projects found.</p>
        ) : (
          <div className="space-y-5">
            {projectHealth.map((p: any) => (
              <div key={p.name} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{p.name}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-background border border-border`}>
                    {p.status}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full ${p.color} transition-all duration-500`}
                    style={{ width: `${p.progress || 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contribution heatmap */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="font-heading font-semibold text-foreground text-sm mb-4">Contribution Heatmap</h2>
        <div className="flex gap-[2px] overflow-x-auto pb-2 hidden-scrollbar">
          {heatmapData.map((week: number[], wi: number) => (
            <div key={wi} className="flex flex-col gap-[2px]">
              {week.map((val: number, di: number) => (
                <div key={di} className="w-3 h-3 rounded-sm transition-colors" style={{ backgroundColor: val === 0 ? "hsl(var(--secondary))" : `hsl(var(--primary) / ${0.2 + val * 0.2})` }} title={`${val} completions`} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
