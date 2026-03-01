import { useState } from "react";
import { UserPlus, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const teamMembers = [
  { name: "Arjun Patel", role: "Product Lead", tasks: 8, projects: 3, avatar: "A", status: "online" },
  { name: "Sneha Gupta", role: "Designer", tasks: 5, projects: 2, avatar: "S", status: "online" },
  { name: "Riya Sharma", role: "Frontend Dev", tasks: 12, projects: 4, avatar: "R", status: "online" },
  { name: "Karan Singh", role: "Backend Dev", tasks: 6, projects: 2, avatar: "K", status: "away" },
  { name: "Priya Nair", role: "QA Engineer", tasks: 4, projects: 2, avatar: "P", status: "offline" },
  { name: "Deepak Kumar", role: "DevOps", tasks: 3, projects: 1, avatar: "D", status: "online" },
];

const statusColor: Record<string, string> = {
  online: "bg-accent",
  away: "bg-[hsl(var(--warning))]",
  offline: "bg-muted-foreground/30",
};

const Team = () => {
  const { user, profile } = useAuth();
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsInviting(true);
    setMessage(null);

    try {
      const inviterName = (profile as any)?.full_name || (profile as any)?.name || user?.email?.split('@')[0] || "A Team Member";

      const res = await fetch(`${API_BASE}/api/team/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          inviterId: user?.uid,
          inviterName
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send invite");
      }

      setMessage({ text: "Invite sent successfully!", type: "success" });
      setEmail("");
      setTimeout(() => {
        setShowInvite(false);
        setMessage(null);
      }, 3000);
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-up">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-heading font-bold text-2xl text-foreground">Team</h1>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {showInvite && (
        <div className="bg-card border border-border p-5 rounded-lg mb-6 shadow-sm animate-fade-up">
          <h3 className="font-heading font-semibold text-foreground mb-2">Invite new member</h3>
          <p className="text-sm text-muted-foreground mb-4">Send an email invitation to collaborate on ShipIt.</p>

          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
              required
            />
            <button
              type="submit"
              disabled={isInviting || !email}
              className="flex items-center justify-center gap-2 bg-foreground text-background px-4 py-2 rounded-md hover:bg-foreground/90 transition-colors text-sm font-medium disabled:opacity-50 min-w-[120px]"
            >
              {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Invite"}
            </button>
          </form>

          {message && (
            <div className={`mt-3 flex items-center gap-2 text-sm ${message.type === 'success' ? 'text-green-500' : 'text-destructive'}`}>
              {message.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
              {message.text}
            </div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map(m => (
          <div key={m.name} className="bg-card border border-border rounded-lg p-4 hover:border-muted-foreground/30 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">{m.avatar}</div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${statusColor[m.status]}`} />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.role}</div>
              </div>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span><strong className="text-foreground">{m.tasks}</strong> active tasks</span>
              <span><strong className="text-foreground">{m.projects}</strong> projects</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Team;
