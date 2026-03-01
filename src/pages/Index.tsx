import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowRight, Lightbulb, ClipboardList, Layout, Users, AlertCircle, BarChart3, Rocket, Target, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const features = [
  { icon: Lightbulb, title: "Thinking Space", desc: "A distraction-free writing area to dump raw ideas. No structure needed — just think out loud and convert to a project when ready.", glow: "glow-purple" },
  { icon: ClipboardList, title: "Smart Task Breakdown", desc: "Turn a project brief into an actionable checklist with priorities and deadlines. Drag, reorder, assign — all in one view.", glow: "glow-blue" },
  { icon: Layout, title: "Kanban Boards", desc: "Visual boards with To Do, In Progress, Blocked, and Done columns. See the full picture at a glance, move cards in one drag.", glow: "glow-orange" },
  { icon: Users, title: "Team Collaboration", desc: "Assign tasks, leave comments, tag teammates, and track who's doing what — without Slack threads that disappear.", glow: "glow-pink" },
  { icon: AlertCircle, title: "Blocker Tracking", desc: "Flag what's stuck and why. Blockers surface automatically on the dashboard so nothing slips through the cracks.", glow: "glow-orange" },
  { icon: BarChart3, title: "Progress Tracking", desc: "Live progress bars, velocity stats, and a weekly digest so every team member knows exactly where things stand.", glow: "glow-cyan" },
];

const steps = [
  { num: "01", title: "Capture", desc: "Write your idea in Thinking Space. No format needed.", color: "bg-primary" },
  { num: "02", title: "Plan", desc: "Break it into tasks. Set deadlines and assign owners.", color: "bg-[hsl(270,70%,60%)]" },
  { num: "03", title: "Execute", desc: "Work through the board. Track blockers in real time.", color: "bg-[hsl(var(--warning))]" },
  { num: "04", title: "Ship", desc: "Mark done. Celebrate. Move to the next idea.", color: "bg-accent" },
];

const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  // if user already signed in, send them to their dashboard
  useEffect(() => {
    if (!loading && user && profile) {
      navigate(profile.role === "builder" ? "/app" : "/investor");
    }
  }, [user, profile, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <span className="font-heading font-bold text-lg text-foreground">ShipIt</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#mission" className="hover:text-foreground transition-colors">Mission</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Log in
            </Link>
            <Link to="/app" className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              Get Started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--gradient-glow-blue)" }} />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="animate-fade-up">
            <span className="section-badge-blue">✦ Now in Beta — Free to Start</span>
          </div>
          <h1 className="mt-8 font-heading font-800 text-5xl md:text-7xl lg:text-8xl leading-[0.95] text-foreground animate-fade-up-delay-1">
            From <span className="gradient-text">idea</span> to<br />shipped. No chaos.
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed animate-fade-up-delay-2">
            One place to think, plan, collaborate, and execute. Stop juggling 5 tools. Start shipping faster.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up-delay-3">
            <Link to="/app" className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:shadow-[0_0_30px_hsl(217,90%,64%,0.3)]">
              🚀 Get Started Free
            </Link>
            <a href="#features" className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors">
              💻 Explore Features
            </a>
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-16 border-t border-border/50">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground uppercase tracking-[0.2em] mb-8">Trusted by builders everywhere</p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-muted-foreground/40">
            {["Vercel", "Linear", "Figma", "Stripe", "Notion"].map(name => (
              <span key={name} className="font-heading font-semibold text-xl">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 relative">
        <div className="absolute inset-0" style={{ background: "var(--gradient-glow-green)" }} />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <span className="section-badge-green">What's Inside</span>
            <h2 className="mt-6 font-heading font-800 text-4xl md:text-5xl text-foreground">
              Everything you need.<br />Nothing you don't.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl">
              Built for individuals and teams who want to move fast without losing track of what matters.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div key={f.title} className={`card-glow ${f.glow} bg-card rounded-lg border border-border p-6 hover:border-muted-foreground/30 transition-all group animate-fade-up`} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 border-t border-border/50">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <span className="section-badge-blue">How It Works</span>
          <h2 className="mt-6 font-heading font-800 text-4xl md:text-5xl text-foreground">
            Ship in 4 Simple Steps 🚀
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From a rough idea in your head to a shipped product — this is the loop.
          </p>
          <div className="mt-16 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-10 left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-primary via-[hsl(270,70%,60%)] via-[hsl(var(--warning))] to-accent" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {steps.map((step, i) => (
                <div key={step.num} className="flex flex-col items-center animate-fade-up" style={{ animationDelay: `${i * 0.12}s` }}>
                  <div className={`relative z-10 w-16 h-16 md:w-20 md:h-20 rounded-full ${step.color} flex items-center justify-center shadow-lg`}>
                    <span className="font-heading font-bold text-lg md:text-xl text-primary-foreground">{step.num}</span>
                  </div>
                  <h3 className="mt-4 font-heading font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section id="mission" className="py-24 relative">
        <div className="absolute inset-0" style={{ background: "var(--gradient-glow-green)" }} />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <span className="section-badge-blue">Our Mission</span>
          <h2 className="mt-6 font-heading font-800 text-4xl md:text-5xl text-foreground">
            Bridging <span className="gradient-text">Thinking</span><br />with Execution
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            Great ideas die because of broken workflows — not lack of talent. ShipIt exists to close that gap. We believe every team deserves a tool that thinks like they do, moves when they move, and gets out of the way when they're in flow.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/app" className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-all hover:shadow-[0_0_30px_hsl(160,100%,45%,0.3)]">
              🚀 Start Shipping Free
            </Link>
            <a href="#features" className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors">
              💻 Explore Guidance
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-border/50 relative">
        <div className="absolute inset-0" style={{ background: "var(--gradient-glow-blue)" }} />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-heading font-800 text-4xl md:text-5xl text-foreground">
            Ready to ship your next big thing? 🎯
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join 2,400+ teams who stopped planning and started shipping.
          </p>
          <div className="mt-10">
            <Link to="/app" className="inline-flex items-center gap-2 px-10 py-4 text-lg font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:shadow-[0_0_40px_hsl(217,90%,64%,0.4)]">
              🚀 Get Started — It's Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 ShipIt. Built for builders. Ship fast, ship often.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
