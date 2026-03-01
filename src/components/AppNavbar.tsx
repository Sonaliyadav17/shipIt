import { Search, Bell, ChevronDown } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface AppNavbarProps {
  onSearchClick: () => void;
}

const AppNavbar = ({ onSearchClick }: AppNavbarProps) => {
  const [avatarOpen, setAvatarOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const initials = profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "?";

  return (
    <header className="h-14 border-b border-border flex items-center px-4 gap-4 shrink-0 bg-background/50 backdrop-blur-sm">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

      <button onClick={onSearchClick} className="flex-1 max-w-md mx-auto flex items-center gap-2 px-3 py-1.5 rounded bg-secondary border border-border text-sm text-muted-foreground hover:border-muted-foreground/50 transition-colors">
        <Search className="h-3.5 w-3.5" />
        <span>Search...</span>
        <kbd className="ml-auto text-xs bg-background px-1.5 py-0.5 rounded border border-border font-mono">⌘K</kbd>
      </button>

      <div className="flex items-center gap-3">
        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        </button>

        <div className="relative">
          <button onClick={() => setAvatarOpen(!avatarOpen)} className="flex items-center gap-2 hover:bg-secondary p-1 pr-2 rounded transition-colors">
            <div className="w-7 h-7 rounded bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">{initials}</div>
          </button>

          {avatarOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setAvatarOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-lg shadow-lg z-50 py-1 animate-fade-up">
                <button
                  className="w-full px-3 py-2 text-sm text-left text-popover-foreground hover:bg-secondary transition-colors"
                  onClick={() => navigate(profile ? "/app/profile" : "/login")}
                >
                  Profile
                </button>
                <button
                  className="w-full px-3 py-2 text-sm text-left text-popover-foreground hover:bg-secondary transition-colors"
                  onClick={() => navigate("/app/tasks")}
                >
                  My Tasks
                </button>
                <button
                  className="w-full px-3 py-2 text-sm text-left text-popover-foreground hover:bg-secondary transition-colors"
                  onClick={() => navigate("/app/settings")}
                >
                  Settings
                </button>
                <div className="border-t border-border my-1" />
                <button
                  className="w-full px-3 py-2 text-sm text-left text-popover-foreground hover:bg-secondary transition-colors"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppNavbar;
