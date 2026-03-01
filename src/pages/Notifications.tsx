import { useState } from "react";
import { Check } from "lucide-react";

const notifications = [
  { id: 1, text: "Sneha assigned you to 'Design hero section'", time: "2m ago", type: "mention", read: false },
  { id: 2, text: "Karan flagged SHP-205 as blocked", time: "15m ago", type: "update", read: false },
  { id: 3, text: "Deadline: 'API Documentation' is due tomorrow", time: "1h ago", type: "deadline", read: false },
  { id: 4, text: "Riya mentioned you in a comment on SHP-142", time: "2h ago", type: "mention", read: true },
  { id: 5, text: "Priya completed 'Setup staging environment'", time: "3h ago", type: "update", read: true },
  { id: 6, text: "Weekly digest: 34 tasks completed, 3 blockers", time: "1d ago", type: "update", read: true },
  { id: 7, text: "Deepak deployed v2.1.0 to production", time: "1d ago", type: "update", read: true },
];

const Notifications = () => {
  const [filter, setFilter] = useState("All");
  const [items, setItems] = useState(notifications);
  const filters = ["All", "Mentions", "Deadlines", "Updates"];

  const filtered = filter === "All" ? items : items.filter(n => {
    if (filter === "Mentions") return n.type === "mention";
    if (filter === "Deadlines") return n.type === "deadline";
    if (filter === "Updates") return n.type === "update";
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl text-foreground">Notifications</h1>
        <button onClick={() => setItems(items.map(i => ({ ...i, read: true })))} className="text-xs text-primary hover:underline flex items-center gap-1">
          <Check className="h-3 w-3" /> Mark all read
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        {filtered.map(n => (
          <div key={n.id} className={`flex items-start gap-3 p-3 rounded-lg hover:bg-card transition-colors cursor-pointer ${!n.read ? "bg-card" : ""}`}>
            {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
            {n.read && <div className="w-2 shrink-0" />}
            <div className="flex-1">
              <p className={`text-sm ${!n.read ? "text-foreground font-medium" : "text-muted-foreground"}`}>{n.text}</p>
              <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
