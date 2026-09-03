import { createContext, useContext, useEffect, useState, useCallback } from "react";
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

  // Centralise le chargement du profil + de l'école. Utilisé à la fois par
  // l'écouteur d'authentification et par `refreshProfile`, appelé
  // manuellement juste après qu'un flux d'inscription (création
  // d'établissement, rejoindre en tant que parent) vient d'écrire le
  // document de profil dans Firestore. Sans cet appel manuel, il existe une
  // condition de course : Firebase déclenche onAuthStateChanged dès la
  // création du compte, potentiellement avant que notre propre écriture du
  // profil n'ait eu lieu, laissant le contexte bloqué sur "aucun profil".
  const loadProfile = useCallback(async (uid) => {
    setProfileError(null);
    try {
      const userProfile = await getUserProfile(uid);

      if (!userProfile) {
        setProfile(null);
        setSchool(null);
        setProfileError(
          "Aucun profil n'a été trouvé pour ce compte. Contactez la direction de votre établissement."
        );
        return;
      }

      setProfile(userProfile);

      if (userProfile.schoolId) {
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
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (!user) {
        setProfile(null);
        setSchool(null);
        setProfileError(null);
        setLoading(false);
        return;
      }

      await loadProfile(user.uid);
      setLoading(false);
    });

    return unsub;
  }, [loadProfile]);

  async function refreshProfile() {
    if (auth.currentUser) {
      await loadProfile(auth.currentUser.uid);
    }
  }

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
      value={{ firebaseUser, profile, school, loading, profileError, signOut, refreshSchool, refreshProfile }}
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
