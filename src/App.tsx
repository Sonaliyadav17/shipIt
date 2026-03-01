import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SelectRole from "./pages/SelectRole";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import MyTasks from "./pages/MyTasks";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import ThinkingSpace from "./pages/ThinkingSpace";
import Team from "./pages/Team";
import InvestorLayout from "./components/InvestorLayout";
import Discover from "./pages/investor/Discover";
import MyInvestments from "./pages/investor/MyInvestments";
import InvestorProjectView from "./pages/investor/ProjectView";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Analytics from "./pages/Analytics";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Agreements from "./pages/Agreements";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/select-role" element={<SelectRole />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute allowedRole="builder">
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="tasks" element={<MyTasks />} />
              <Route path="projects" element={<Projects />} />
              <Route path="projects/:id" element={<ProjectDetail />} />
              <Route path="thinking" element={<ThinkingSpace />} />
              <Route path="team" element={<Team />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route
              path="/investor"
              element={
                <ProtectedRoute allowedRole="investor">
                  <InvestorLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Discover />} />
              <Route path="project/:id" element={<InvestorProjectView />} />
              <Route path="investments" element={<MyInvestments />} />
              <Route path="agreements" element={<Agreements />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
