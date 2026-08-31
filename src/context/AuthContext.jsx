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
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setProfileError(null);

      if (!user) {
        setProfile(null);
        setSchool(null);
        setLoading(false);
        return;
      }

      try {
        const userProfile = await getUserProfile(user.uid);

        if (!userProfile) {
          setProfileError(
            "Aucun profil n'a été trouvé pour ce compte. Contactez la direction de votre établissement."
          );
          setLoading(false);
          return;
        }

        setProfile(userProfile);

        if (userProfile?.schoolId) {
          const s = await getSchool(userProfile.schoolId);
          setSchool(s);
        }
      } catch (err) {
        console.error("Erreur de chargement du profil :", err);
        setProfileError(
          err?.code === "permission-denied"
            ? "L'accès aux données a été refusé. Les règles de sécurité Firestore ne sont probablement pas encore publiées."
            : "Une erreur est survenue lors du chargement de votre espace."
        );
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
      value={{ firebaseUser, profile, school, loading, profileError, signOut, refreshSchool }}
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
