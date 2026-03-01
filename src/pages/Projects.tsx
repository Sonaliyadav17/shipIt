import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Trash2, FolderOpen, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export interface ProjectType {
    id: string;
    title: string;
    description: string;
    status: string;
    dueDate: string;
    ownerId: string;
    teamMembers: string[];
    progress: number;
    isOpenToInvestment: boolean;
    createdAt: string;
}

const Projects = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDueDate, setNewDueDate] = useState("");

    const { data: projects = [], isLoading } = useQuery<ProjectType[]>({
        queryKey: ["projects", user?.uid],
        queryFn: async () => {
            const token = await user?.getIdToken();
            const res = await fetch(`${API_BASE}/api/projects/${user?.uid}`, {
                headers: {
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                }
            });
            if (!res.ok) throw new Error("Failed to fetch projects");
            return res.json();
        },
        enabled: !!user?.uid,
    });

    const createMutation = useMutation({
        mutationFn: async (newProject: Partial<ProjectType>) => {
            const token = await user?.getIdToken();
            const res = await fetch(`${API_BASE}/api/projects`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify(newProject),
            });
            if (!res.ok) throw new Error("Failed to create project");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects", user?.uid] });
            toast.success("Project created successfully");
            setIsCreateOpen(false);
            setNewTitle("");
            setNewDueDate("");
        },
        onError: () => {
            toast.error("Failed to create project");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (projectId: string) => {
            const token = await user?.getIdToken();
            const res = await fetch(`${API_BASE}/api/projects/${projectId}`, {
                method: "DELETE",
                headers: {
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                }
            });
            if (!res.ok) throw new Error("Failed to delete project");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects", user?.uid] });
            toast.success("Project deleted");
        },
        onError: () => {
            toast.error("Failed to delete project");
        },
    });

    const toggleInvestmentMutation = useMutation({
        mutationFn: async ({ id, isOpenToInvestment }: { id: string, isOpenToInvestment: boolean }) => {
            const token = await user?.getIdToken();
            const res = await fetch(`${API_BASE}/api/projects/${id}/investment-toggle`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ isOpenToInvestment }),
            });
            if (!res.ok) throw new Error("Failed to update investment status");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects", user?.uid] });
            toast.success("Investment status updated");
        },
        onError: () => {
            toast.error("Failed to update investment status");
        },
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;
        createMutation.mutate({
            title: newTitle,
            dueDate: newDueDate,
            ownerId: user?.uid,
            teamMembers: [user?.uid as string],
        });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-up px-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-heading font-bold text-3xl text-foreground">Projects</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage your ideas and track progress.</p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> New Project
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Create New Project</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Project Title</label>
                                <Input
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="e.g. Next Big App"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Due Date (Optional)</label>
                                <Input
                                    value={newDueDate}
                                    onChange={(e) => setNewDueDate(e.target.value)}
                                    placeholder="e.g. Q3 2026"
                                />
                            </div>
                            <Button type="submit" disabled={createMutation.isPending} className="w-full">
                                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Project
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : projects.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-border rounded-xl bg-card">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                        <FolderOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-heading font-semibold text-lg text-foreground mb-2">No projects yet</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">Create your first project to start organizing tasks, tracking progress, and collaborating.</p>
                    <Button onClick={() => setIsCreateOpen(true)} variant="outline">
                        <Plus className="h-4 w-4 mr-2" /> Create Project
                    </Button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((project) => (
                        <div key={project.id} className="group bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all hover:shadow-md flex flex-col cursor-pointer" onClick={() => navigate(`/app/projects/${project.id}`)}>
                            <div className="flex items-start justify-between mb-3">
                                <span className="text-xs px-2.5 py-1 rounded bg-primary/10 text-primary font-medium">{project.status}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm("Are you sure you want to delete this project?")) {
                                            deleteMutation.mutate(project.id);
                                        }
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            <h3 className="font-heading font-semibold text-lg text-foreground mb-1">{project.title}</h3>
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                {project.description || "No description provided."}
                            </p>

                            <div className="mt-auto space-y-4">
                                <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-between border-t border-border pt-4">
                                    <span className="text-xs font-medium text-foreground">Open to Investment</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={project.isOpenToInvestment}
                                            disabled={toggleInvestmentMutation.isPending}
                                            onChange={(e) => toggleInvestmentMutation.mutate({
                                                id: project.id,
                                                isOpenToInvestment: e.target.checked
                                            })}
                                        />
                                        <div className="w-9 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>

                                <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${project.progress}%` }} />
                                </div>

                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1.5"><ArrowRight className="h-3 w-3" /> Due {project.dueDate || "TBD"}</span>
                                    <span>{project.progress}% completed</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Projects;
