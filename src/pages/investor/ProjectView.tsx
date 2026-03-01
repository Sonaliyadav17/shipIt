import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, Users, Shield, Lightbulb, Loader2, Sparkles, ClipboardList, Target, TrendingUp, Briefcase, AlertTriangle, Calendar } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const InvestorProjectView = () => {
    const { id } = useParams();
    const { profile } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [contributionType, setContributionType] = useState<"money" | "idea" | "both">("money");
    const [amount, setAmount] = useState("");
    const [ideaDesc, setIdeaDesc] = useState("");
    const [agreedToNoc, setAgreedToNoc] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "pitch">("overview");

    // Fetch single project data
    const { data: project, isLoading } = useQuery({
        queryKey: ["project", id],
        queryFn: async () => {
            const res = await fetch(`${API_BASE}/api/projects/all`); // Needs an endpoint to fetch by id
            // Instead of all, let's fetch from the investor pool, or we can just query the dashboard project endpoint assuming id is unique.
            // But since we just added builderName we can query the specific project and fetch owner name. 
            // Wait, we can fetch all open to investment and find the one.
            const allRes = await fetch(`${API_BASE}/api/investor/projects`);
            if (!allRes.ok) throw new Error("Failed");
            const allProjects = await allRes.json();
            return allProjects.find((p: any) => p._id === id || p.id === id);
        },
        enabled: !!id
    });

    const submitInterestMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${API_BASE}/api/investor/interest`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId: project._id || project.id,
                    projectName: project.title,
                    builderId: project.ownerId,
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
        if (!agreedToNoc || !project) return;
        submitInterestMutation.mutate();
    };

    if (isLoading || !project) {
        return (
            <div className="flex flex-col items-center justify-center p-20 animate-fade-up">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading project details...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-12 animate-fade-up">
            <Link to="/investor" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Discover
            </Link>

            {/* Header Info */}
            <div className="bg-card border border-border rounded-xl p-6 mb-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="px-2.5 py-1 rounded bg-secondary text-xs font-semibold uppercase text-muted-foreground tracking-wider">Project</span>
                            <span className="flex items-center gap-1.5 text-xs font-medium text-accent bg-accent/10 px-2.5 py-1 rounded">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div> {project.status || 'Active'}
                            </span>
                        </div>
                        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">{project.title}</h1>
                        <p className="text-muted-foreground max-w-xl">{project.description}</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all whitespace-nowrap flex items-center gap-2"
                    >
                        💰 Express Interest to Invest
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-border">
                    <div>
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block mb-1">Builder</span>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs text-foreground font-medium">{project.builderName?.charAt(0) || 'U'}</div>
                            <span className="text-sm font-medium text-foreground truncate">{project.builderName || "Unknown"}</span>
                        </div>
                    </div>
                    <div>
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block mb-1">Due Date</span>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                            <Clock className="w-4 h-4 text-muted-foreground" /> {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "TBD"}
                        </div>
                    </div>
                    <div>
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block mb-1">Team Size</span>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                            <Users className="w-4 h-4 text-muted-foreground" /> {(project.teamMembers || []).length} Members
                        </div>
                    </div>
                    <div>
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block mb-1">Seeking</span>
                        <span className="text-sm font-medium text-foreground">Sponsorship & Help</span>
                    </div>
                </div>
            </div>

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
                    💰 Investment Pitch {project.pitchGenerated && <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
                </button>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    {activeTab === "overview" && (
                        <>
                            <section className="bg-card border border-border rounded-xl p-6">
                                <h2 className="text-xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                                    <Lightbulb className="w-5 h-5 text-warning" /> Why Invest?
                                </h2>
                                <p className="text-foreground/90 leading-relaxed text-sm">
                                    {project.whyInvest || "The builder has not written a 'Why Invest' pitch, but their project is open to investments and collaborations!"}
                                </p>
                            </section>

                            <section className="bg-card border border-border rounded-xl p-6">
                                <h2 className="text-xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                                    Progress Timeline
                                    <span className="ml-auto text-sm font-medium px-3 py-1 bg-secondary rounded-full">{project.progress || 0}% Complete</span>
                                </h2>

                                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-6">
                                    <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${project.progress || 0}%` }}></div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="w-3 h-3 rounded-full flex-shrink-0 border-2 bg-primary border-primary"></div>
                                        <div className="flex-1 text-foreground font-medium">Project Created</div>
                                        <div className="text-xs text-muted-foreground tabular-nums">Started</div>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className={`w-3 h-3 rounded-full flex-shrink-0 border-2 ${(project.progress || 0) > 0 ? 'bg-primary border-primary' : 'bg-background border-primary'}`}></div>
                                        <div className="flex-1 text-foreground font-medium">Tasks Ongoing</div>
                                        <div className="text-xs text-muted-foreground tabular-nums">In Progress</div>
                                    </div>
                                </div>
                            </section>
                        </>
                    )}

                    {activeTab === "pitch" && (
                        <div className="space-y-6">
                            {!project.pitchGenerated ? (
                                <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center text-muted-foreground">
                                    <Sparkles className="w-10 h-10 mx-auto text-muted-foreground/30 mb-4" />
                                    <h3 className="text-xl font-bold text-foreground mb-2">No pitch available yet</h3>
                                    <p className="max-w-md mx-auto">The builder has not generated an AI Investment Pitch for this project yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
                                            <Sparkles className="w-6 h-6 text-purple-500" /> Executive Summary
                                        </h3>
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border" title="Pitch Score">
                                            <div className={`w-3 h-3 rounded-full ${project.pitchScore < 5 ? 'bg-red-500' : project.pitchScore < 8 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                                            <span className="text-sm font-bold font-mono text-foreground">{project.pitchScore}/10 Score</span>
                                        </div>
                                    </div>

                                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                        <h4 className="flex items-center gap-2 font-semibold text-base mb-3 text-foreground">
                                            <ClipboardList className="w-5 h-5 text-blue-500" /> Project Summary
                                        </h4>
                                        <p className="text-base text-muted-foreground leading-relaxed">{project.aiPlan?.summary}</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                            <h4 className="flex items-center gap-2 font-semibold text-base mb-4 text-foreground">
                                                <Target className="w-5 h-5 text-green-500" /> Core Features
                                            </h4>
                                            <ul className="space-y-3">
                                                {project.aiPlan?.features.map((item: string, i: number) => (
                                                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                                                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                                                        <span className="leading-relaxed">{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                            <h4 className="flex items-center gap-2 font-semibold text-base mb-4 text-foreground">
                                                <Lightbulb className="w-5 h-5 text-yellow-500" /> Market Opportunity
                                            </h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed">{project.aiPlan?.marketOpportunity}</p>
                                        </div>
                                    </div>

                                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                        <h4 className="flex items-center gap-2 font-semibold text-base mb-4 text-foreground">
                                            <Briefcase className="w-5 h-5 text-indigo-500" /> Business Pitch
                                        </h4>
                                        <div className="text-sm text-muted-foreground leading-relaxed space-y-4 whitespace-pre-wrap">
                                            {project.aiPlan?.businessPitch}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                            <h4 className="flex items-center gap-2 font-semibold text-base mb-4 text-foreground">
                                                <AlertTriangle className="w-5 h-5 text-red-500" /> Risks & Challenges
                                            </h4>
                                            <ul className="space-y-3">
                                                {project.aiPlan?.risks.map((item: string, i: number) => (
                                                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                                                        <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                                                        <span className="leading-relaxed">{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                            <h4 className="flex items-center gap-2 font-semibold text-base mb-4 text-foreground">
                                                <Calendar className="w-5 h-5 text-cyan-500" /> Suggested Timeline
                                            </h4>
                                            <div className="space-y-4">
                                                {project.aiPlan?.timeline.map((item: string, i: number) => (
                                                    <div key={i} className="flex items-start gap-4">
                                                        <div className="px-3 py-1 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-sm font-bold shrink-0 shadow-sm border border-cyan-500/20">Wk {i + 1}</div>
                                                        <span className="text-sm text-muted-foreground leading-relaxed pt-1">{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="md:col-span-1">
                    <div className="bg-card border border-border rounded-xl p-6 sticky top-6">
                        <h3 className="font-bold text-foreground mb-4">Team Members</h3>
                        <div className="space-y-3">
                            {(project.teamMembers && project.teamMembers.length > 0) ? project.teamMembers.map((member: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-secondary text-muted-foreground flex items-center justify-center font-medium text-sm">
                                        {profile?.name?.charAt(0) || "U"}
                                    </div>
                                    <span className="text-sm font-medium text-foreground">Team Member</span>
                                </div>
                            )) : (
                                <p className="text-sm text-muted-foreground">Solo Builder</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Express Interest Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
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
                                <p className="text-muted-foreground text-sm mb-6">Join {project.title} as an investor or strategic partner.</p>

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

export default InvestorProjectView;
