import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const SelectRole = () => {
  const { profile, user, refreshProfile } = useAuth() as any;
  const [role, setRole] = useState<'builder' | 'investor' | ''>('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSubmit = async () => {
    if (!role) return;
    setLoading(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/auth/user/${user.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!resp.ok) throw new Error('Failed to update role');
      await refreshProfile();
      navigate(role === 'builder' ? '/app' : '/investor');
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2">Welcome{profile?.name ? `, ${profile.name}` : ''}</h2>
        <p className="text-sm text-muted-foreground mb-6">We need to know whether you're a builder or an investor.</p>

        <div className="mb-4 flex gap-4">
          <button onClick={() => setRole('builder')} className={`flex-1 py-3 rounded border ${role==='builder' ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}>
            I'm a Builder
          </button>
          <button onClick={() => setRole('investor')} className={`flex-1 py-3 rounded border ${role==='investor' ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}>
            I'm an Investor
          </button>
        </div>

        <button disabled={!role || loading} onClick={handleSubmit} className="w-full py-2.5 rounded bg-primary text-primary-foreground font-semibold disabled:opacity-50">
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

export default SelectRole;
