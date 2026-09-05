// Création de comptes pour le personnel administratif (secrétaire,
// directeur supplémentaire...) depuis l'application.
//
// Piège classique de Firebase Auth côté client : créer un nouveau compte
// avec createUserWithEmailAndPassword connecte AUTOMATIQUEMENT ce nouveau
// compte, ce qui déconnecterait le directeur en train de l'utiliser. On
// contourne ça avec une seconde instance Firebase, temporaire, utilisée
// uniquement pour créer le compte Auth ; la session du directeur (sur
// l'instance principale) n'est jamais touchée.

import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut as fbSignOut } from "firebase/auth";
import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db, firebaseConfig } from "./firebase";

const ADMIN_ROLES = ["directeur", "secretaire"];

export async function createStaffAccount({ schoolId, name, email, password, role }) {
  const secondaryApp = initializeApp(firebaseConfig, `staff-creation-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);

    await setDoc(doc(db, "users", cred.user.uid), {
      name,
      email,
      role,
      schoolId,
      canEditSchoolSettings: role === "directeur",
      createdAt: serverTimestamp(),
    });

    await fbSignOut(secondaryAuth);
    return cred.user.uid;
  } finally {
    await deleteApp(secondaryApp);
  }
}

export async function fetchSchoolStaff(schoolId) {
  const q = query(
    collection(db, "users"),
    where("schoolId", "==", schoolId),
    where("role", "in", ADMIN_ROLES)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Supprime le PROFIL applicatif du membre du personnel, ce qui lui retire
// immédiatement l'accès à Klasso. Son compte de connexion Firebase Auth
// n'est pas supprimé (cela nécessiterait des privilèges d'administration
// serveur que l'application n'a pas) — seul l'accès à l'application l'est.
export async function revokeStaffAccess(uid) {
  await deleteDoc(doc(db, "users", uid));
}
