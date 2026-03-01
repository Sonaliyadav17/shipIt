import { useState, useEffect } from "react";
import { FolderCheck, FolderOpen, Flame, CalendarDays, Github, Linkedin, Twitter, GraduationCap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const getHeatColor = (val: number) => {
  if (val === 0) return "bg-secondary";
  if (val === 1) return "bg-primary/20";
  if (val === 2) return "bg-primary/40";
  if (val === 3) return "bg-primary/60";
  return "bg-primary/80";
};

const Profile = () => {
  const { profile, user } = useAuth();
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [loadingStats, setLoadingStats] = useState(true);

  const { data: heatmapData = [], isLoading: loadingHeatmap } = useQuery({
    queryKey: ["analytics", "heatmap", user?.uid],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/analytics/heatmap/${user?.uid}`);
      if (!res.ok) throw new Error("Failed to fetch heatmap data");
      return res.json();
    },
    enabled: !!user?.uid,
  });

  useEffect(() => {
    if (profile) {
      fetchProjectStats();
    }
  }, [profile]);

  const fetchProjectStats = async () => {
    if (!profile) return;
    setLoadingStats(true);
    try {
      const [{ count: comp }, { count: act }] = await Promise.all([
        supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("builder_id", (profile as any).id || (profile as any).uid)
          .eq("status", "Completed"),
        supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("builder_id", (profile as any).id || (profile as any).uid)
          .eq("status", "Active"),
      ]);
      setCompletedCount(comp ?? 0);
      setActiveCount(act ?? 0);
    } catch (e) {
      console.error("Failed to load project stats", e);
    } finally {
      setLoadingStats(false);
    }
  };

  const memberSince = profile
    ? new Date((profile as any).created_at || (profile as any).createdAt || Date.now()).getFullYear()
    : "";

  let currentStreak = 0;
  let maxStreak = 0;
  let totalActiveDays = 0;

  if (heatmapData.length > 0) {
    const flat = heatmapData.flat();
    totalActiveDays = flat.filter((d: number) => d > 0).length;

    let temp = 0;
    for (const val of flat) {
      if (val > 0) {
        temp++;
        if (temp > maxStreak) maxStreak = temp;
      } else {
        temp = 0;
      }
    }

    let foundFirst = false;
    for (let i = flat.length - 1; i >= 0; i--) {
      if (flat[i] > 0) {
        foundFirst = true;
        currentStreak++;
      } else if (foundFirst) {
        break;
      }
    }
  }

  if (!profile) {
    return <p className="text-muted-foreground p-8">Loading…</p>;
  }

  const p = profile as any;

  return (
    <div className="max-w-5xl mx-auto animate-fade-up space-y-8 pb-10">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Side: Avatar & Details */}
        <div className="w-full md:w-1/3 bg-card border border-border rounded-lg p-6 flex flex-col items-center md:items-start text-center md:text-left">
          <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center text-5xl font-bold text-primary font-heading mb-4">
            {(p.full_name || p.name || "?").charAt(0).toUpperCase()}
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            {p.full_name || p.name}
          </h1>
          <p className="text-muted-foreground font-mono text-sm mb-4">
            @{p.email?.split("@")[0]}
          </p>

          <div className="w-full space-y-3 mt-4 text-sm border-t border-border pt-4">
            {p.role && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Flame className="w-4 h-4 text-primary" />
                <span className="capitalize">{p.role}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-muted-foreground">
              <GraduationCap className="w-4 h-4/80" />
              <span>{p.college_name || "Technical University"}</span>
            </div>

            <div className="pt-4 mt-2 border-t border-border w-full flex justify-center md:justify-start gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Right Side: Stat Cards */}
        <div className="w-full md:w-2/3 grid grid-cols-2 gap-4">
          <div className="p-5 rounded-lg bg-card border border-border flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <FolderCheck className="h-4 w-4 text-primary" />
              <span className="text-xs font-mono tracking-wider text-muted-foreground uppercase">
                Projects Completed
              </span>
            </div>
            <p className="text-3xl font-heading font-bold text-foreground">
              {loadingStats ? "…" : completedCount}
            </p>
          </div>

          <div className="p-5 rounded-lg bg-card border border-border flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <FolderOpen className="h-4 w-4 text-primary" />
              <span className="text-xs font-mono tracking-wider text-muted-foreground uppercase">
                Currently Working On
              </span>
            </div>
            <p className="text-3xl font-heading font-bold text-foreground">
              {loadingStats ? "…" : activeCount}
            </p>
          </div>

          <div className="p-5 rounded-lg bg-card border border-border flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-4 w-4 text-primary" />
              <span className="text-xs font-mono tracking-wider text-muted-foreground uppercase">
                Current Streak
              </span>
            </div>
            <p className="text-3xl font-heading font-bold text-foreground">
              {loadingHeatmap ? "…" : currentStreak}
            </p>
          </div>

          <div className="p-5 rounded-lg bg-card border border-border flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span className="text-xs font-mono tracking-wider text-muted-foreground uppercase">
                Member Since
              </span>
            </div>
            <p className="text-3xl font-heading font-bold text-foreground">
              {memberSince}
            </p>
          </div>
        </div>
      </div>

      {/* Full Width Consistency Heatmap */}
      <div className="bg-card border border-border rounded-lg p-6 w-full">
        <h2 className="text-lg font-heading font-bold text-foreground mb-6">
          Consistency
        </h2>

        {loadingHeatmap ? (
          <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
            Loading heatmap...
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex gap-[3px] overflow-x-auto pb-2 hidden-scrollbar">
              {heatmapData.length > 0 ? (
                heatmapData.map((week: number[], wi: number) => (
                  <div key={wi} className="flex flex-col gap-[3px] flex-shrink-0">
                    {week.map((val: number, di: number) => (
                      <div
                        key={di}
                        className={`w-3.5 h-3.5 rounded-sm ${getHeatColor(val)} transition-colors`}
                        title={`${val} tasks completed`}
                      />
                    ))}
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground text-sm">No activity data found.</div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-muted-foreground mt-2 border-t border-border pt-4">
              <div className="flex gap-6 mb-4 sm:mb-0">
                <div>
                  Total active days: <strong className="text-foreground">{totalActiveDays}</strong>
                </div>
                <div>
                  Max streak: <strong className="text-foreground">{maxStreak}</strong>
                </div>
              </div>
              <div className="flex items-center gap-2 scale-90 sm:scale-100">
                <span>Less</span>
                {[0, 1, 2, 3, 4].map((v) => (
                  <div key={v} className={`w-3.5 h-3.5 rounded-sm ${getHeatColor(v)}`} />
                ))}
                <span>More</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
