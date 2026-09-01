// Un parent ne peut pas s'auto-inscrire librement : l'école génère un code
// d'invitation à usage unique pour un élève précis (parentInvitations/{code}
// au niveau racine, pour être lisible par un parent qui n'a pas encore de
// profil). Le parent saisit ce code lors de la création de son compte, ce
// qui lie automatiquement son profil à l'élève concerné.

import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans caractères ambigus
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createParentInvitation({ schoolId, studentId, studentName }) {
  const code = randomCode();
  await setDoc(doc(db, "parentInvitations", code), {
    schoolId,
    studentId,
    studentName,
    used: false,
    createdAt: serverTimestamp(),
  });
  return code;
}

export async function getInvitation(code) {
  const snap = await getDoc(doc(db, "parentInvitations", code.toUpperCase().trim()));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function markInvitationUsed(code, uid) {
  await updateDoc(doc(db, "parentInvitations", code.toUpperCase().trim()), {
    used: true,
    usedBy: uid,
    usedAt: serverTimestamp(),
  });
}
