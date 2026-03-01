import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Rocket } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: "builder" | "investor";
}

export const ProtectedRoute = ({ children, allowedRole }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();

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
