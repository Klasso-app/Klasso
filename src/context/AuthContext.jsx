import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut as fbSignOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { getUserProfile, getSchool } from "../lib/schools";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (!user) {
        setProfile(null);
        setSchool(null);
        setLoading(false);
        return;
      }

      try {
        const userProfile = await getUserProfile(user.uid);
        setProfile(userProfile);

        if (userProfile?.schoolId) {
          const s = await getSchool(userProfile.schoolId);
          setSchool(s);
        }
      } catch (err) {
        console.error("Erreur de chargement du profil :", err);
      } finally {
        setLoading(false);
      }
    });

    return unsub;
  }, []);

  async function refreshSchool() {
    if (profile?.schoolId) {
      const s = await getSchool(profile.schoolId);
      setSchool(s);
    }
  }

  async function signOut() {
    await fbSignOut(auth);
  }

  return (
    <AuthContext.Provider
      value={{ firebaseUser, profile, school, loading, signOut, refreshSchool }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return ctx;
}
