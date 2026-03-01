import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut as firebaseSignOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, type User as FirebaseUser } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

interface Profile {
    uid: string;
    name: string;
    email: string;
    role: "builder" | "investor" | null;
    investmentFocus?: string | null;
    createdAt?: string | Date | null;
}

interface AuthContextType {
    user: FirebaseUser | null;
    profile: Profile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    login: (email: string, password: string) => Promise<{ error: string | null }>;
    signup: (email: string, password: string, fullName: string, role: "builder" | "investor") => Promise<{ error: string | null }>;
    loginWithGoogle: (role?: "builder" | "investor") => Promise<{ error: string | null; needsRole?: boolean }>;
    refreshProfile: () => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setLoading(true);
            if (!fbUser) {
                setUser(null);
                setProfile(null);
                setLoading(false);
                return;
            }
            setUser(fbUser);
            try {
                const uid = fbUser.uid;
                const resp = await fetch(`${API_BASE}/api/auth/user/${uid}`);
                if (resp.status === 200) {
                    const { user: u } = await resp.json();
                    setProfile({
                        uid: u.uid,
                        name: u.name,
                        email: u.email,
                        role: u.role || null,
                        investmentFocus: u.investmentFocus || null,
                        createdAt: u.createdAt || null,
                    });
                } else if (resp.status === 404) {
                    // create user on backend
                    const createResp = await fetch(`${API_BASE}/api/auth/user`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ uid: fbUser.uid, name: fbUser.displayName, email: fbUser.email }),
                    });
                    if (createResp.ok) {
                        const { user: u } = await createResp.json();
                        setProfile({ uid: u.uid, name: u.name, email: u.email, role: u.role || null, createdAt: u.createdAt || null });
                    }
                }
            } catch (err) {
                console.error("AuthProvider: failed fetching user profile", err);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const signOut = async () => {
        try {
            setLoading(true);
            await firebaseSignOut(auth);
        } finally {
            setUser(null);
            setProfile(null);
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            setLoading(true);
            const cred = await signInWithEmailAndPassword(auth, email, password);
            const fbUser = cred.user;
            if (!fbUser) return { error: "Login failed" };
            // fetch profile from backend
            try {
                const resp = await fetch(`${API_BASE}/api/auth/user/${fbUser.uid}`);
                if (resp.ok) {
                    const { user: u } = await resp.json();
                    setProfile({ uid: u.uid, name: u.name, email: u.email, role: u.role || null, investmentFocus: u.investmentFocus || null, createdAt: u.createdAt || null });
                }
            } catch (e) {
                console.error("Failed to fetch profile after login", e);
            }
            return { error: null };
        } catch (err: any) {
            return { error: err.message || "Login failed" };
        } finally {
            setLoading(false);
        }
    };

    const signup = async (
        email: string,
        password: string,
        fullName: string,
        role: "builder" | "investor"
    ) => {
        try {
            setLoading(true);
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            const fbUser = cred.user;
            if (!fbUser) return { error: "Signup failed" };

            // create user in backend with provided role
            try {
                const resp = await fetch(`${API_BASE}/api/auth/user`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ uid: fbUser.uid, name: fullName, email: fbUser.email, role }),
                });
                if (resp.ok) {
                    const { user: u } = await resp.json();
                    setProfile({ uid: u.uid, name: u.name, email: u.email, role: u.role || null, createdAt: u.createdAt || null });
                }
            } catch (e) {
                console.error("Failed to create backend user on signup", e);
            }

            return { error: null };
        } catch (err: any) {
            return { error: err.message || "Signup failed" };
        } finally {
            setLoading(false);
        }
    };

    const loginWithGoogle = async (role?: "builder" | "investor") => {
        try {
            setLoading(true);
            await signInWithRedirect(auth, googleProvider);
            const result = await getRedirectResult(auth);
            if (!result) return { error: null };
            
            const fbUser = result.user;
            if (!fbUser) return { error: "No user returned from Google" };

            // Send to backend to check/create
            const resp = await fetch(`${API_BASE}/api/auth/user`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uid: fbUser.uid, name: fbUser.displayName, email: fbUser.email }),
            });
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                return { error: err.error || "Failed to contact backend" };
            }
            const body = await resp.json();
            const userFromDb = body.user;
            setProfile({ uid: userFromDb.uid, name: userFromDb.name, email: userFromDb.email, role: userFromDb.role || null, createdAt: userFromDb.createdAt || null });
            if (body.needsRole) {
                return { error: null, needsRole: true };
            }
            return { error: null };
        } catch (err: any) {
            console.error("Google login failed", err);
            return { error: err.message || "Google login failed" };
        } finally {
            setLoading(false);
        }
    };

    const refreshProfile = async () => {
        if (!user) return null;
        try {
            const resp = await fetch(`${API_BASE}/api/auth/user/${user.uid}`);
            if (resp.ok) {
                const { user: u } = await resp.json();
                const p = { uid: u.uid, name: u.name, email: u.email, role: u.role || null, investmentFocus: u.investmentFocus || null, createdAt: u.createdAt || null } as Profile;
                setProfile(p);
                return p;
            }
        } catch (err) {
            console.error("refreshProfile failed", err);
        }
        return null;
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, signOut, login, signup, loginWithGoogle, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
