import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Rocket, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'builder' | 'investor'>('builder');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  
  const navigate = useNavigate();
  const { login, signup, loginWithGoogle, profile, user, refreshProfile } = useAuth();

  // Redirect after successful login when profile is loaded
  useEffect(() => {
    if (user && profile && !isLoading) {
      if (profile.role === 'builder') {
        navigate('/app');
      } else {
        navigate('/investor');
      }
    }
  }, [user, profile, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    if (!isLogin && !fullName) {
      setError("Full name is required");
      return;
    }

    try {
      setIsLoading(true);
      
      if (isLogin) {
        const { error: loginError } = await login(email, password);
        if (loginError) {
          setError(loginError);
          setIsLoading(false);
          return;
        }
        // Login successful - redirect based on role from context
        setTimeout(() => {
          if (profile) {
            navigate(profile.role === 'builder' ? '/app' : '/investor');
          }
        }, 500); // Small delay to ensure state is updated
      } else {
        const { error: signupError } = await signup(email, password, fullName, role);
        if (signupError) {
          setError(signupError);
          setIsLoading(false);
          return;
        }
        // Signup successful - redirect immediately with known role
        navigate(role === 'builder' ? '/app' : '/investor');
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    try {
      setIsLoading(true);
      const { error: googleError, needsRole } = await loginWithGoogle(role);
      if (googleError) {
        setError(googleError);
        setIsLoading(false);
        return;
      }
      if (needsRole) {
        // navigate to role selection screen
        navigate('/select-role');
        setIsLoading(false);
        return;
      }
      // Google login successful - refresh profile from backend then redirect based on real role
      const newProfile = await refreshProfile();
      if (newProfile && newProfile.role) {
        navigate(newProfile.role === 'builder' ? '/app' : '/investor');
      } else {
        navigate('/select-role');
      }
    } catch (err: any) {
      setError(err.message || "Google sign-in failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0" style={{ background: "var(--gradient-glow-blue)" }} />
        {/* Floating grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        {/* Floating shapes */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="absolute border border-primary/20 rounded-sm" style={{
            width: `${20 + i * 12}px`, height: `${20 + i * 12}px`,
            top: `${15 + i * 13}%`, left: `${10 + i * 14}%`,
            animation: `float ${4 + i}s ease-in-out infinite`, animationDelay: `${i * 0.5}s`,
            transform: `rotate(${i * 15}deg)`,
          }} />
        ))}
        <div className="relative z-10 text-center px-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Rocket className="h-8 w-8 text-primary" />
            <span className="font-heading font-bold text-3xl text-foreground">ShipIt</span>
          </div>
          <h1 className="font-heading font-800 text-4xl text-foreground leading-tight">
            From idea<br />to <span className="gradient-text">shipped</span>.
          </h1>
          <p className="mt-4 text-muted-foreground text-lg">Stop planning. Start shipping.</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Rocket className="h-5 w-5 text-primary" />
            <span className="font-heading font-bold text-lg text-foreground">ShipIt</span>
          </div>
          <h2 className="font-heading font-bold text-2xl text-foreground">
            {isLogin ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLogin ? "Sign in to continue shipping" : "Start shipping in under a minute"}
          </p>

          <div className="mt-8 mb-6 flex gap-4">
            <button
              type="button"
              onClick={() => setRole('builder')}
              className={`flex-1 py-4 px-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${role === 'builder'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:bg-secondary/50'
                }`}
            >
              <span className="text-2xl">👷</span>
              <span className="font-medium text-sm">I'm a Builder</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('investor')}
              className={`flex-1 py-4 px-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${role === 'investor'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:bg-secondary/50'
                }`}
            >
              <span className="text-2xl">💼</span>
              <span className="font-medium text-sm">I'm an Investor</span>
            </button>
          </div>
          {/* Google login button */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={isLoading}
              className="w-full py-2.5 rounded bg-white border border-border text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="text-2xl">🔎</span>
              Continue with Google
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                {error}
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                <input 
                  required 
                  type="text" 
                  placeholder={role === 'builder' ? "Arjun Patel" : "Sneha Gupta"}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 rounded bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed" 
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input 
                required 
                type="email" 
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input 
                  required 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 pr-10 rounded bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {!isLogin && role === 'investor' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Your Investment Focus</label>
                <select 
                  required 
                  disabled={isLoading}
                  className="w-full px-3 py-2 rounded bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="" disabled selected>Select an industry</option>
                  <option value="tech">Tech</option>
                  <option value="finance">Finance</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="consumer">Consumer</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-2.5 rounded bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (isLogin ? "Signing in..." : "Creating account...") : (isLogin ? "Sign In" : "Create Account")}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button 
              type="button" 
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setEmail("");
                setPassword("");
                setFullName("");
              }} 
              className="text-primary hover:underline font-medium"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
