import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Rocket, RefreshCw } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: "builder" | "investor";
}

export const ProtectedRoute = ({ children, allowedRole }: ProtectedRouteProps) => {
  const { user, profile, loading, backendUnavailable, retryBackend } = useAuth();

  if (backendUnavailable) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <Rocket className="h-10 w-10 text-primary mb-4" />
        <p className="text-muted-foreground font-medium text-center mb-2">
          Taking longer than usual? The server may be starting (Render free tier).
        </p>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Please wait a moment and try again.
        </p>
        <button
          type="button"
          onClick={() => (user ? retryBackend() : window.location.reload())}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Rocket className="h-10 w-10 text-primary animate-bounce mb-4" />
        <p className="text-muted-foreground font-medium animate-pulse">Checking credentials...</p>
      </div>
    );
  }

  // Not logged in -> redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role mismatch -> redirect to correct dashboard
  if (profile) {
    if (!profile.role) {
      return <Navigate to="/select-role" replace />;
    }
    if (profile.role !== allowedRole) {
      return <Navigate to={profile.role === "builder" ? "/app" : "/investor"} replace />;
    }
  }

  return <>{children}</>;
};
