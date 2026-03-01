import { Link } from "react-router-dom";
import { ArrowRight, FileSignature, Layers, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const MyInvestments = () => {
    const { profile } = useAuth();

    const { data: investments = [], isLoading } = useQuery({
        queryKey: ["myInvestments", profile?.uid],
        queryFn: async () => {
            const res = await fetch(`${API_BASE}/api/investor/interest/${profile?.uid}`);
            if (!res.ok) throw new Error("Failed to fetch investments");
            // API returns [{ _id, project: { title, ownerId }, amount, status, ... }]
            const interests = await res.json();

            // Map the raw interests into our uniform Investment shape
            return interests.map((i: any) => ({
                id: i._id,
                projectId: i.project?._id,
                projectName: i.project?.title || "Unknown Project",
                builderName: "Builder", // Would ideally be populated in API
                contributionType: i.contributionType.charAt(0).toUpperCase() + i.contributionType.slice(1),
                agreementStatus: i.status === "accepted" ? "Signed" : "Pending",
                progress: i.project?.progress || 0,
                status: i.status === "pending" ? "Interested" : i.status === "accepted" ? "Active Partner" : "Completed",
                lastUpdated: new Date(i.updatedAt || i.createdAt).toLocaleDateString()
            }));
        },
        enabled: !!profile?.uid
    });
    return (
        <div className="max-w-6xl mx-auto animate-fade-up">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-foreground">My Investments</h1>
                    <p className="text-muted-foreground mt-1">Track the projects you've expressed interest in or joined.</p>
                </div>
            </div>

            <div className="grid gap-6">
                {isLoading ? (
                    <div className="py-20 flex justify-center text-primary animate-fade-in">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : investments.map((inv: any) => (
                    <div key={inv.id} className="bg-card border border-border rounded-xl p-6 hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center gap-6 animate-fade-up">

                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider ${inv.status === "Interested" ? "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]" :
                                    inv.status === "Active Partner" ? "bg-primary/10 text-primary" :
                                        "bg-green-500/10 text-green-500"
                                    }`}>
                                    {inv.status}
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1"><Layers className="w-3 h-3" /> Updated {inv.lastUpdated}</span>
                            </div>
                            <h3 className="font-heading font-bold text-xl text-foreground mb-1">{inv.projectName}</h3>
                            <p className="text-sm text-muted-foreground">By {inv.builderName}</p>
                        </div>

                        {/* Metrics */}
                        <div className="flex items-center gap-8 md:px-8 md:border-x border-border">
                            <div>
                                <span className="block text-[10px] text-muted-foreground uppercase font-bold mb-1">Contribution</span>
                                <span className="text-sm font-medium text-foreground">{inv.contributionType}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] text-muted-foreground uppercase font-bold mb-1">Agreement</span>
                                <span className="text-sm font-medium flex items-center gap-1.5">
                                    <FileSignature className="w-4 h-4 text-muted-foreground" />
                                    {inv.agreementStatus}
                                </span>
                            </div>
                        </div>

                        {/* Progress & Actions */}
                        <div className="flex-1 md:max-w-[200px]">
                            <div className="flex justify-between text-xs mb-1.5 font-medium">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="text-foreground">{inv.progress}%</span>
                            </div>
                            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-4">
                                <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${inv.progress}%` }}></div>
                            </div>

                            <Link to={`/investor/project/${inv.id}`} className="w-full py-2 flex items-center justify-center gap-2 rounded bg-secondary hover:bg-secondary/80 text-sm font-medium text-foreground transition-colors group">
                                View Details <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                    </div>
                ))}

                {(!isLoading && investments.length === 0) && (
                    <div className="py-16 text-center border border-dashed border-border rounded-xl bg-card animate-fade-in">
                        <div className="w-16 h-16 bg-secondary text-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                            💡
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-1">No investments yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">You haven't expressed interest in any projects. Start exploring the marketplace to find your first investment.</p>
                        <Link to="/investor" className="px-6 py-2.5 rounded bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors inline-block">
                            Discover Projects
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyInvestments;
