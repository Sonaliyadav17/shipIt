import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { onAuthStateChanged, signInWithRedirect, getRedirectResult, signOut as firebaseSignOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, type User as FirebaseUser } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

const BACKEND_TIMEOUT_MS = 12000;

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
    backendUnavailable: boolean;
    signOut: () => Promise<void>;
    login: (email: string, password: string) => Promise<{ error: string | null }>;
    signup: (email: string, password: string, fullName: string, role: "builder" | "investor") => Promise<{ error: string | null }>;
    loginWithGoogle: (role?: "builder" | "investor") => Promise<{ error: string | null; needsRole?: boolean }>;
    refreshProfile: () => Promise<Profile | null>;
    retryBackend: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchWithTimeout(url: string, options: RequestInit = {}, ms = BACKEND_TIMEOUT_MS): Promise<Response> {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), ms);
    try {
        const res = await fetch(url, { ...options, signal: ctrl.signal });
        return res;
    } finally {
        clearTimeout(id);
    }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [backendUnavailable, setBackendUnavailable] = useState(false);

    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

    const fetchOrCreateProfile = useCallback(async (fbUser: FirebaseUser): Promise<boolean> => {
        try {
            const uid = fbUser.uid;
            const resp = await fetchWithTimeout(`${API_BASE}/api/auth/user/${uid}`);
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
                setBackendUnavailable(false);
                return true;
            }
            if (resp.status === 404) {
                const createResp = await fetchWithTimeout(`${API_BASE}/api/auth/user`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ uid: fbUser.uid, name: fbUser.displayName, email: fbUser.email }),
                });
                if (createResp.ok) {
                    const { user: u } = await createResp.json();
                    setProfile({ uid: u.uid, name: u.name, email: u.email, role: u.role || null, createdAt: u.createdAt || null });
                    setBackendUnavailable(false);
                    return true;
                }
            }
        } catch (err) {
            console.error("AuthProvider: failed fetching user profile", err);
        }
        return false;
    }, [API_BASE]);

    useEffect(() => {
        getRedirectResult(auth).then(async (result) => {
            if (!result?.user) return;
            const fbUser = result.user;
            setUser(fbUser);
            setLoading(true);
            setBackendUnavailable(false);
            const ok = await fetchOrCreateProfile(fbUser);
            if (!ok) setBackendUnavailable(true);
            setLoading(false);
        }).catch((err) => {
            console.error("getRedirectResult failed", err);
            setLoading(false);
        });
    }, [fetchOrCreateProfile]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setLoading(true);
            setBackendUnavailable(false);
            if (!fbUser) {
                setUser(null);
                setProfile(null);
                setLoading(false);
                return;
            }
            setUser(fbUser);
            const ok = await fetchOrCreateProfile(fbUser);
            if (!ok) setBackendUnavailable(true);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [fetchOrCreateProfile]);

    useEffect(() => {
        if (!loading) return;
        const id = setTimeout(() => {
            setLoading((prev) => {
                if (prev) setBackendUnavailable(true);
                return false;
            });
        }, BACKEND_TIMEOUT_MS);
        return () => clearTimeout(id);
    }, [loading]);

    const signOut = async () => {
        try {
            setLoading(true);
            await firebaseSignOut(auth);
        } finally {
            setUser(null);
            setProfile(null);
            setBackendUnavailable(false);
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            setLoading(true);
            const cred = await signInWithEmailAndPassword(auth, email, password);
            const fbUser = cred.user;
            if (!fbUser) return { error: "Login failed" };
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

    const loginWithGoogle = async (_role?: "builder" | "investor") => {
        setLoading(true);
        await signInWithRedirect(auth, googleProvider);
        return { error: null };
    };

    const refreshProfile = async () => {
        if (!user) return null;
        try {
            const resp = await fetchWithTimeout(`${API_BASE}/api/auth/user/${user.uid}`);
            if (resp.ok) {
                const { user: u } = await resp.json();
                const p = { uid: u.uid, name: u.name, email: u.email, role: u.role || null, investmentFocus: u.investmentFocus || null, createdAt: u.createdAt || null } as Profile;
                setProfile(p);
                setBackendUnavailable(false);
                return p;
            }
        } catch (err) {
            console.error("refreshProfile failed", err);
        }
        return null;
    };

    const retryBackend = async () => {
        if (!user) return;
        setBackendUnavailable(false);
        setLoading(true);
        const ok = await fetchOrCreateProfile(user);
        if (!ok) setBackendUnavailable(true);
        setLoading(false);
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, backendUnavailable, signOut, login, signup, loginWithGoogle, refreshProfile, retryBackend }}>
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
