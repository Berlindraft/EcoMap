import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth } from "../firebase";
import { registerUser, fetchUser } from "../services/api";

// ─── Types ─────────────────────────────

interface UserProfile {
  uid: string;
  full_name: string;
  email: string;
  phone: string;
  profile_photo: string;
  barangay: string;
  city: string;
  role: string;
  eco_points_balance: number;
}

interface AuthContextType {
  firebaseUser: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ──────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const p = await fetchUser(user.uid);
          setProfile(p);
        } catch {
          // User exists in Firebase Auth but not in Firestore — auto-register
          try {
            const p = await registerUser(user.uid, user.displayName || user.email?.split("@")[0] || "User", user.email || "");
            setProfile(p);
          } catch {
            setProfile(null);
          }
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    try {
      const p = await fetchUser(cred.user.uid);
      setProfile(p);
    } catch {
      // Auto-register if Firestore doc is missing
      const p = await registerUser(cred.user.uid, cred.user.displayName || email.split("@")[0], email);
      setProfile(p);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // Create user doc in Firestore via backend
    const p = await registerUser(cred.user.uid, name, email);
    setProfile(p);
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (firebaseUser) {
      try {
        const p = await fetchUser(firebaseUser.uid);
        setProfile(p);
      } catch {
        // silent
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{ firebaseUser, profile, loading, login, signup, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ──────────────────────────────

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
