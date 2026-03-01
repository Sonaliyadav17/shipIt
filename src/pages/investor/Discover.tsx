import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, Loader2, X, Clock, Users, Lightbulb, Sparkles, ClipboardList, Target, TrendingUp, Briefcase, AlertTriangle, Calendar } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const categories = ["All", "Tech", "Marketing", "Design", "Finance"];

const Discover = () => {
    const { profile } = useAuth();
    const queryClient = useQueryClient();
    const [activeCategory, setActiveCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    // Drawer State
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"overview" | "pitch">("overview");

    // Express Interest Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [contributionType, setContributionType] = useState<"money" | "idea" | "both">("money");
    const [amount, setAmount] = useState("");
    const [ideaDesc, setIdeaDesc] = useState("");
    const [agreedToNoc, setAgreedToNoc] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const [projects, setProjects] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOpenProjects = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/projects/open`);
                const data = await res.json();
                console.log('Investor sees these open projects:', data);
                if (!res.ok) {
                    setProjects([]);
                    return;
                }
                setProjects(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Failed to fetch open projects:', err);
                setProjects([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOpenProjects();
        const interval = setInterval(fetchOpenProjects, 5000);
        return () => clearInterval(interval);
    }, []);

    const filteredProjects = projects.filter((p: any) => {
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === "All" || true; // Can add actual category logic later
        return matchesSearch && matchesCategory;
    });

    const activeProject = projects.find((p: any) => p.id === activeProjectId || p._id === activeProjectId);

    // Fetch single thinking note for pitch data if needed
    const { data: thinkingNote, isLoading: isNoteLoading } = useQuery({
        queryKey: ["thinkingNote", activeProject?.thinkingNoteId],
        queryFn: async () => {
            const res = await fetch(`${API_BASE}/api/thinking/note/${activeProject.thinkingNoteId}`);
            if (!res.ok) throw new Error("Failed to fetch note");
            return res.json();
        },
        enabled: !!activeProject?.thinkingNoteId && activeTab === "pitch"
    });

    const submitInterestMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${API_BASE}/api/investor/interest`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId: activeProject._id || activeProject.id,
                    projectName: activeProject.title,
                    builderId: activeProject.ownerId,
                    investorId: profile?.uid,
                    investorName: profile?.name,
                    contributionType: contributionType,
                    amount: Number(amount) || 0,
                    ideaDescription: ideaDesc
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to submit interest");
            }
            return res.json();
        },
        onSuccess: () => {
            setSubmitted(true);
            toast.success("Interest expressed successfully!");
            setTimeout(() => {
                setIsModalOpen(false);
                setSubmitted(false);
            }, 2000);
        },
        onError: (err: Error) => {
            toast.error(err.message || "Failed to express interest");
        }
    });

    const handleSubmitInterest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreedToNoc || !activeProject) return;
        submitInterestMutation.mutate();
    };

    return (
        <div className="max-w-7xl mx-auto animate-fade-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-foreground">Discover Projects</h1>
                    <p className="text-muted-foreground mt-1">Find and invest in exciting new ideas.</p>
                </div>
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 hidden-scrollbar">
                <Filter className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${activeCategory === cat
                            ? "bg-primary border-primary text-primary-foreground"
                            : "bg-card border-border text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full py-16 flex flex-col items-center justify-center text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                        <p>Loading open projects...</p>
                    </div>
                ) : (
                    <>
                        {filteredProjects.map((project: any) => (
                            <div key={project.id || project._id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all hover:shadow-[0_0_15px_rgba(var(--primary),0.1)] flex flex-col h-full group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                            🚀
                                        </div>
                                        <div>
                                            <h3 className="font-heading font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{project.title}</h3>
                                            <p className="text-xs text-muted-foreground">By {project.builderName || "Unknown Builder"}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {project.aiPlan?.businessPitch ? (
                                            <>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/20 whitespace-nowrap" title="Investor AI Pitch Ready">
                                                    ✨ AI Pitch Ready
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/80 text-muted-foreground font-semibold border border-border whitespace-nowrap" title="No AI Pitch Generated">
                                                No Pitch Yet
                                            </span>
                                        )}
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground uppercase font-semibold">
                                            Active
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4 flex-1">
                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2 font-medium">
                                        {project.description || "No description provided."}
                                    </p>
                                    <div>
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span className="text-muted-foreground flex items-center gap-1.5 hover:text-foreground transition-colors"><div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div>{project.status}</span>
                                            <span className="font-medium text-foreground">{project.progress || 0}% done</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                                            <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${project.progress || 0}%` }}></div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        <div className="bg-secondary/50 rounded-lg p-2.5">
                                            <span className="block text-[10px] text-muted-foreground uppercase font-semibold mb-0.5">Seeking</span>
                                            <span className="text-sm font-medium text-foreground">Investment</span>
                                        </div>
                                        <div className="bg-secondary/50 rounded-lg p-2.5">
                                            <span className="block text-[10px] text-muted-foreground uppercase font-semibold mb-0.5">Team Size</span>
                                            <span className="text-sm font-medium text-foreground">{project.teamMembers?.length || 1} members</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-border flex gap-3">
                                    <button
                                        onClick={() => {
                                            setActiveProjectId(project.id || project._id);
                                            setActiveTab("overview");
                                        }}
                                        className="flex-1 py-2 text-center rounded bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium transition-colors"
                                    >
                                        View Project
                                    </button>
                                    <button disabled className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-medium transition-colors hover:bg-primary/90">
                                        ⭐
                                    </button>
                                </div>
                            </div>
                        ))}

                        {filteredProjects.length === 0 && (
                            <div className="col-span-full py-16 text-center border border-dashed border-border rounded-xl bg-card">
                                <span className="text-4xl block mb-4">🔍</span>
                                <h3 className="text-lg font-bold text-foreground mb-1">No open projects found</h3>
                                <p className="text-muted-foreground">Wait for builders to open their projects to investment, or adjust your search.</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Sliding Drawer */}
            {activeProjectId && activeProject && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
                        onClick={() => setActiveProjectId(null)}
                    />

                    {/* Drawer Content */}
                    <div className="fixed inset-y-0 right-0 w-full md:w-[600px] lg:w-[800px] bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-fade-left">

                        {/* Drawer Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/50 backdrop-blur sticky top-0 z-20">
                            <div className="flex items-center gap-3">
                                <span className="px-2.5 py-1 rounded bg-secondary text-xs font-semibold uppercase text-muted-foreground tracking-wider">Project</span>
                                <span className="flex items-center gap-1.5 text-xs font-medium text-accent bg-accent/10 px-2.5 py-1 rounded">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div> {activeProject.status || 'Active'}
                                </span>
                            </div>
                            <button
                                onClick={() => setActiveProjectId(null)}
                                className="p-2 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Drawer Scrollable Body */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                            <div className="mb-8">
                                <h1 className="text-3xl font-heading font-bold text-foreground mb-3">{activeProject.title}</h1>
                                <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">{activeProject.description}</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-border mb-8">
                                <div>
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block mb-1">Builder</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs text-foreground font-medium">{activeProject.builderName?.charAt(0) || 'U'}</div>
                                        <span className="text-sm font-medium text-foreground truncate">{activeProject.builderName || "Unknown"}</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block mb-1">Due Date</span>
                                    <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                                        <Clock className="w-4 h-4 text-muted-foreground" /> {activeProject.dueDate ? new Date(activeProject.dueDate).toLocaleDateString() : "TBD"}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block mb-1">Team Size</span>
                                    <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                                        <Users className="w-4 h-4 text-muted-foreground" /> {activeProject.teamMembers?.length || 1}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block mb-1">Seeking</span>
                                    <span className="text-sm font-medium text-foreground">Investment</span>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-border mb-6">
                                <button
                                    onClick={() => setActiveTab("overview")}
                                    className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === "overview" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"}`}
                                >
                                    Overview
                                </button>
                                <button
                                    onClick={() => setActiveTab("pitch")}
                                    className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === "pitch" ? "border-purple-500 text-purple-500" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"}`}
                                >
                                    💰 Investment Pitch {activeProject.pitchGenerated && <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
                                </button>
                            </div>

                            <div className="pb-24">
                                {activeTab === "overview" && (
                                    <div className="space-y-8 animate-fade-in">
                                        <section className="bg-card border border-border rounded-xl p-6">
                                            <h2 className="text-lg font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                                                <Lightbulb className="w-5 h-5 text-warning" /> Why Invest?
                                            </h2>
                                            <p className="text-foreground/90 leading-relaxed text-sm">
                                                {activeProject.whyInvest || "The builder has not written a 'Why Invest' pitch, but their project is open to investments and collaborations!"}
                                            </p>
                                        </section>

                                        <section className="bg-card border border-border rounded-xl p-6">
                                            <h2 className="text-lg font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                                                Progress Timeline
                                                <span className="ml-auto text-sm font-medium px-3 py-1 bg-secondary rounded-full">{activeProject.progress || 0}% Complete</span>
                                            </h2>
                                            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-6">
                                                <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${activeProject.progress || 0}%` }}></div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4 text-sm">
                                                    <div className="w-3 h-3 rounded-full flex-shrink-0 border-2 bg-primary border-primary"></div>
                                                    <div className="flex-1 text-foreground font-medium">Project Created</div>
                                                    <div className="text-xs text-muted-foreground tabular-nums">Started</div>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm">
                                                    <div className={`w-3 h-3 rounded-full flex-shrink-0 border-2 ${(activeProject.progress || 0) > 0 ? 'bg-primary border-primary' : 'bg-background border-primary'}`}></div>
                                                    <div className="flex-1 text-foreground font-medium">Tasks Ongoing</div>
                                                    <div className="text-xs text-muted-foreground tabular-nums">In Progress</div>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                )}

                                {activeTab === "pitch" && (
                                    <div className="space-y-6 animate-fade-in">
                                        {!activeProject.pitchGenerated ? (
                                            <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center text-muted-foreground">
                                                <span className="text-4xl block mb-4 opacity-50">📑</span>
                                                <h3 className="text-lg font-bold text-foreground mb-2">No pitch available yet</h3>
                                                <p className="text-sm max-w-sm mx-auto">The builder has not generated an AI Investment Pitch from their notes for this project yet.</p>
                                            </div>
                                        ) : isNoteLoading ? (
                                            <div className="flex justify-center items-center py-20">
                                                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
                                                        <Sparkles className="w-5 h-5 text-purple-500" /> Executive Summary
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border" title="Pitch Score">
                                                        <div className={`w-2.5 h-2.5 rounded-full ${activeProject.pitchScore < 5 ? 'bg-red-500' : activeProject.pitchScore < 8 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                                                        <span className="text-sm font-bold font-mono text-foreground">{activeProject.pitchScore}/10 Score</span>
                                                    </div>
                                                </div>

                                                {(thinkingNote?.aiPlan || activeProject.aiPlan) && (() => {
                                                    const plan = thinkingNote?.aiPlan || activeProject.aiPlan;
                                                    return (
                                                        <>
                                                            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                                                                <h4 className="flex items-center gap-2 font-semibold text-sm mb-2 text-foreground">
                                                                    <ClipboardList className="w-4 h-4 text-blue-500" /> Project Summary
                                                                </h4>
                                                                <p className="text-sm text-muted-foreground leading-relaxed">{plan.summary}</p>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                                                                    <h4 className="flex items-center gap-2 font-semibold text-sm mb-3 text-foreground">
                                                                        <Target className="w-4 h-4 text-green-500" /> Core Features
                                                                    </h4>
                                                                    <ul className="space-y-2.5">
                                                                        {plan.features.map((item: string, i: number) => (
                                                                            <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                                                                                <span className="leading-relaxed">{item}</span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>

                                                                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                                                                    <h4 className="flex items-center gap-2 font-semibold text-sm mb-3 text-foreground">
                                                                        <Lightbulb className="w-4 h-4 text-yellow-500" /> Market Opportunity
                                                                    </h4>
                                                                    <p className="text-sm text-muted-foreground leading-relaxed">{plan.marketOpportunity}</p>
                                                                </div>
                                                            </div>

                                                            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                                                                <h4 className="flex items-center gap-2 font-semibold text-sm mb-3 text-foreground">
                                                                    <Briefcase className="w-4 h-4 text-indigo-500" /> Business Pitch
                                                                </h4>
                                                                <div className="text-sm text-muted-foreground leading-relaxed space-y-3 whitespace-pre-wrap">
                                                                    {plan.businessPitch}
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                                                                    <h4 className="flex items-center gap-2 font-semibold text-sm mb-3 text-foreground">
                                                                        <AlertTriangle className="w-4 h-4 text-red-500" /> Risks & Challenges
                                                                    </h4>
                                                                    <ul className="space-y-2.5">
                                                                        {plan.risks.map((item: string, i: number) => (
                                                                            <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                                                                                <span className="leading-relaxed">{item}</span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>

                                                                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                                                                    <h4 className="flex items-center gap-2 font-semibold text-sm mb-3 text-foreground">
                                                                        <Calendar className="w-4 h-4 text-cyan-500" /> Suggested Timeline
                                                                    </h4>
                                                                    <div className="space-y-3">
                                                                        {plan.timeline.map((item: string, i: number) => (
                                                                            <div key={i} className="flex items-start gap-3">
                                                                                <div className="px-2 py-0.5 rounded shadow-sm bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-bold shrink-0">Wk {i + 1}</div>
                                                                                <span className="text-sm text-muted-foreground leading-relaxed">{item}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sticky Bottom Action */}
                        <div className="p-4 border-t border-border bg-background/95 backdrop-blur z-20 shrink-0">
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="w-full py-4 text-center rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] flex items-center justify-center gap-2"
                            >
                                💰 Express Interest in <span className="text-white drop-shadow-md truncate inline-block max-w-[200px] align-bottom ml-1">{activeProject.title}</span>
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Express Interest Modal */}
            {isModalOpen && activeProject && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => !submitInterestMutation.isPending && !submitted && setIsModalOpen(false)} />
                    <div className="relative bg-card border border-border rounded-2xl p-6 md:p-8 max-w-md w-full mx-4 shadow-2xl animate-fade-up">

                        {submitted ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <h3 className="text-2xl font-bold text-foreground mb-2">Request Sent!</h3>
                                <p className="text-muted-foreground text-sm">The builder will review your interest shortly. Check your Agreements tab for updates.</p>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-2xl font-heading font-bold text-foreground mb-2">Express Interest</h2>
                                <p className="text-muted-foreground text-sm mb-6">Join {activeProject.title} as an investor or strategic partner.</p>

                                <form onSubmit={handleSubmitInterest} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-3">How would you like to contribute?</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            <label className={`cursor-pointer border text-center p-3 rounded-xl transition-all ${contributionType === 'money' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary hover:bg-secondary/80 text-foreground'}`}>
                                                <input type="radio" className="sr-only" checked={contributionType === 'money'} onChange={() => setContributionType('money')} />
                                                <span className="text-lg block mb-1">💵</span>
                                                <span className="text-xs font-semibold">Money</span>
                                            </label>
                                            <label className={`cursor-pointer border text-center p-3 rounded-xl transition-all ${contributionType === 'idea' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary hover:bg-secondary/80 text-foreground'}`}>
                                                <input type="radio" className="sr-only" checked={contributionType === 'idea'} onChange={() => setContributionType('idea')} />
                                                <span className="text-lg block mb-1">💡</span>
                                                <span className="text-xs font-semibold">Idea</span>
                                            </label>
                                            <label className={`cursor-pointer border text-center p-3 rounded-xl transition-all ${contributionType === 'both' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary hover:bg-secondary/80 text-foreground'}`}>
                                                <input type="radio" className="sr-only" checked={contributionType === 'both'} onChange={() => setContributionType('both')} />
                                                <span className="text-lg block mb-1 flex justify-center">💵💡</span>
                                                <span className="text-xs font-semibold">Both</span>
                                            </label>
                                        </div>
                                    </div>

                                    {(contributionType === 'money' || contributionType === 'both') && (
                                        <div className="animate-fade-in">
                                            <label className="block text-sm font-medium text-foreground mb-1.5">Approximate investment amount (₹)</label>
                                            <input required type="number" placeholder="50000" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 bg-secondary border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-foreground" />
                                        </div>
                                    )}

                                    {(contributionType === 'idea' || contributionType === 'both') && (
                                        <div className="animate-fade-in">
                                            <label className="block text-sm font-medium text-foreground mb-1.5">Describe your idea or strategic value</label>
                                            <textarea required placeholder="I have 5 years experience in marketing and can help with Google Ads..." value={ideaDesc} onChange={(e) => setIdeaDesc(e.target.value)} rows={3} className="w-full px-3 py-2 bg-secondary border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-foreground resize-none" />
                                        </div>
                                    )}

                                    <div className="flex items-start gap-3 mt-4 p-3 bg-secondary/50 rounded-lg border border-border">
                                        <input
                                            type="checkbox"
                                            id="noc"
                                            checked={agreedToNoc}
                                            onChange={(e) => setAgreedToNoc(e.target.checked)}
                                            className="mt-1 shrink-0 accent-primary"
                                        />
                                        <label htmlFor="noc" className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
                                            <strong className="text-foreground">Confidentiality Agreement:</strong> I agree to sign a digital Non-Objection Certificate (NOC) binding me to confidentiality before fully joining this team.
                                        </label>
                                    </div>

                                    <div className="flex gap-3 pt-4 border-t border-border">
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 flex-1 rounded text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 transition-colors">
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={!agreedToNoc || submitInterestMutation.isPending} className="px-4 py-2 flex-1 rounded text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center">
                                            {submitInterestMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                            Send Request
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Discover;
