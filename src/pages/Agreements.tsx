import { useState } from "react";
import { FileText, CheckCircle2, Download, X } from "lucide-react";

interface Agreement {
    id: string;
    project: string;
    otherParty: string;
    type: string;
    status: "Pending Signature" | "Signed";
    date: string;
    builderSigned: boolean;
    investorSigned: boolean;
    builderName: string;
    investorName: string;
}

const mockAgreements: Agreement[] = [
    {
        id: "1",
        project: "Marketing Website v2",
        otherParty: "Rahul Mehta",
        type: "Investor NOC",
        status: "Pending Signature",
        date: new Date().toLocaleDateString(),
        builderSigned: true,
        investorSigned: false,
        builderName: "Arjun Patel",
        investorName: "Rahul Mehta"
    },
    {
        id: "2",
        project: "Mobile App Launch",
        otherParty: "Sneha Gupta",
        type: "Investor NOC",
        status: "Signed",
        date: "2026-02-15",
        builderSigned: true,
        investorSigned: true,
        builderName: "Arjun Patel",
        investorName: "Sneha Gupta"
    }
];

const Agreements = () => {
    const [agreements, setAgreements] = useState(mockAgreements);
    const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
    const [signatureInput, setSignatureInput] = useState("");
    const [signingAs, setSigningAs] = useState<"builder" | "investor" | null>(null);

    const handleSign = () => {
        if (!selectedAgreement || !signingAs || !signatureInput) return;

        const updated = { ...selectedAgreement };
        if (signingAs === "builder") {
            updated.builderSigned = true;
        } else {
            updated.investorSigned = true;
        }

        if (updated.builderSigned && updated.investorSigned) {
            updated.status = "Signed";
        }

        setAgreements(agreements.map(a => a.id === updated.id ? updated : a));
        setSelectedAgreement(updated);
        setSigningAs(null);
        setSignatureInput("");
    };

    const handleDownloadPDF = () => {
        if (!selectedAgreement) return;
        const apiBase = import.meta.env.VITE_API_URL || "http://localhost:4000";

        // Trigger generic browser download
        const url = `${apiBase}/api/noc/${selectedAgreement.id}/download`;
        const a = document.createElement("a");
        a.href = url;
        a.download = `NOC-${selectedAgreement.project.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="max-w-6xl mx-auto animate-fade-up">
            <div className="mb-8">
                <h1 className="text-3xl font-heading font-bold text-foreground">Agreements</h1>
                <p className="text-muted-foreground mt-1">Manage your No Objection Certificates and Confidentiality Agreements.</p>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-secondary/50 text-muted-foreground uppercase text-xs tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Project</th>
                                <th className="px-6 py-4 font-semibold">Other Party</th>
                                <th className="px-6 py-4 font-semibold">Type</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {agreements.map((agreement) => (
                                <tr
                                    key={agreement.id}
                                    onClick={() => setSelectedAgreement(agreement)}
                                    className="hover:bg-secondary/30 transition-colors cursor-pointer group"
                                >
                                    <td className="px-6 py-4 font-medium text-foreground group-hover:text-primary transition-colors">
                                        {agreement.project}
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-secondary text-foreground flex items-center justify-center text-[10px] font-bold">
                                            {agreement.otherParty.charAt(0)}
                                        </div>
                                        {agreement.otherParty}
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">{agreement.type}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${agreement.status === "Signed"
                                            ? "bg-green-500/10 text-green-500 border border-green-500/20"
                                            : "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border border-[hsl(var(--warning))]/20"
                                            }`}>
                                            {agreement.status === "Signed" ? "✅ Signed" : "✍️ Pending"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Document View Modal */}
            {selectedAgreement && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedAgreement(null)} />

                    <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-fade-up">
                        <div className="flex items-center justify-between p-6 border-b border-border bg-secondary/30 rounded-t-xl">
                            <div className="flex items-center gap-3">
                                <FileText className="text-primary h-6 w-6" />
                                <h2 className="text-xl font-heading font-bold text-foreground">NOC Document</h2>
                            </div>
                            <div className="flex items-center gap-4">
                                {selectedAgreement.status === "Signed" ? (
                                    <button
                                        onClick={handleDownloadPDF}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white shadow shadow-green-500/20 text-sm font-medium rounded transition-colors"
                                    >
                                        <Download className="h-4 w-4" /> Download Agreement PDF
                                    </button>
                                ) : (
                                    <span className="text-xs font-medium text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded">
                                        Waiting for both signatures...
                                    </span>
                                )}
                                <button onClick={() => setSelectedAgreement(null)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-secondary">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-8 overflow-y-auto flex-1 font-serif text-foreground/90 leading-relaxed bg-[#fbfbfb] dark:bg-card">
                            <div className="max-w-2xl mx-auto space-y-8">
                                <div className="text-center mb-12">
                                    <h3 className="text-2xl font-bold uppercase tracking-wider mb-2">Non-Objection & Confidentiality Agreement</h3>
                                    <p className="text-muted-foreground font-sans text-sm">Date: {selectedAgreement.date}</p>
                                </div>

                                <div className="space-y-4 text-base">
                                    <p>This agreement is entered into by and between:</p>
                                    <div className="pl-6 border-l-2 border-primary/30 py-2 space-y-2 font-sans font-medium text-sm">
                                        <p><span className="text-muted-foreground w-20 inline-block">Builder:</span> {selectedAgreement.builderName}</p>
                                        <p><span className="text-muted-foreground w-20 inline-block">Investor:</span> {selectedAgreement.investorName}</p>
                                        <p><span className="text-muted-foreground w-20 inline-block">Project:</span> {selectedAgreement.project}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-bold text-lg">Terms & Conditions:</h4>
                                    <ol className="list-decimal pl-5 space-y-4 marker:text-muted-foreground">
                                        <li className="pl-2">The investor agrees not to share, replicate, or misuse any project idea, data, or technical plan shared during collaboration.</li>
                                        <li className="pl-2">The builder agrees not to misuse any funds, resources, or contacts provided by the investor.</li>
                                        <li className="pl-2">Both parties agree that any breach of this mutual confidentiality agreement may result in legal action under applicable laws.</li>
                                        <li className="pl-2">This agreement is legally binding from the date of digital signature by both participating parties.</li>
                                    </ol>
                                </div>

                                <div className="grid grid-cols-2 gap-8 pt-12 mt-12 border-t border-border">
                                    {/* Builder Signature */}
                                    <div className="space-y-4">
                                        <div className="text-sm font-bold uppercase text-muted-foreground tracking-wider mb-2">Builder Signature</div>

                                        {selectedAgreement.builderSigned ? (
                                            <div className="h-24 bg-green-500/5 border border-green-500/20 rounded-lg flex flex-col items-center justify-center text-green-600 dark:text-green-400">
                                                <span className="font-signature text-3xl mb-1 opacity-80" style={{ fontFamily: 'cursive' }}>{selectedAgreement.builderName}</span>
                                                <span className="text-[10px] font-sans font-medium uppercase tracking-wider flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Digitally Signed</span>
                                            </div>
                                        ) : (
                                            <div className="h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center p-4">
                                                {signingAs === "builder" ? (
                                                    <div className="w-full flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Type name to sign"
                                                            value={signatureInput}
                                                            onChange={(e) => setSignatureInput(e.target.value)}
                                                            className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                                                        />
                                                        <button onClick={handleSign} className="px-3 bg-primary text-primary-foreground text-xs font-semibold rounded hover:bg-primary/90">Sign</button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setSigningAs("builder")} className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium rounded transition-colors w-full h-full flex items-center justify-center gap-2">
                                                        ✍️ Sign Now
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Investor Signature */}
                                    <div className="space-y-4">
                                        <div className="text-sm font-bold uppercase text-muted-foreground tracking-wider mb-2">Investor Signature</div>

                                        {selectedAgreement.investorSigned ? (
                                            <div className="h-24 bg-green-500/5 border border-green-500/20 rounded-lg flex flex-col items-center justify-center text-green-600 dark:text-green-400">
                                                <span className="font-signature text-3xl mb-1 opacity-80" style={{ fontFamily: 'cursive' }}>{selectedAgreement.investorName}</span>
                                                <span className="text-[10px] font-sans font-medium uppercase tracking-wider flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Digitally Signed</span>
                                            </div>
                                        ) : (
                                            <div className="h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center p-4">
                                                {signingAs === "investor" ? (
                                                    <div className="w-full flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Type name to sign"
                                                            value={signatureInput}
                                                            onChange={(e) => setSignatureInput(e.target.value)}
                                                            className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                                                        />
                                                        <button onClick={handleSign} className="px-3 bg-primary text-primary-foreground text-xs font-semibold rounded hover:bg-primary/90">Sign</button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setSigningAs("investor")} className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded transition-colors w-full h-full flex items-center justify-center gap-2">
                                                        ✍️ Sign Now
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Agreements;
