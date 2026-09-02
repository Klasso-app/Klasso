// Génération du numéro matricule d'un élève : SIGLE-ANNÉE-NUMÉRO
// (ex : KLS-2026-0007). Le compteur est stocké dans
// schools/{schoolId}/meta/counters et incrémenté via une transaction pour
// éviter que deux inscriptions simultanées obtiennent le même numéro.

import { doc, runTransaction } from "firebase/firestore";
import { db } from "./firebase";

export async function generateMatricule(schoolId) {
  const counterRef = doc(db, "schools", schoolId, "meta", "counters");
  const year = new Date().getFullYear();

  const number = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const current = snap.exists() ? snap.data().nextStudentNumber || 1 : 1;
    tx.set(counterRef, { nextStudentNumber: current + 1 }, { merge: true });
    return current;
  });

  return `KLS-${year}-${String(number).padStart(4, "0")}`;
}
