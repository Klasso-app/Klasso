// Historique des actions sensibles (suppression, modification des
// paramètres...). Volontairement limité aux actions à fort impact plutôt
// qu'à un traçage exhaustif de toute écriture, pour rester simple à lire.

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export async function logAction(schoolId, { actorUid, actorName, action, details }) {
  try {
    await addDoc(collection(db, "schools", schoolId, "auditLogs"), {
      actorUid: actorUid || null,
      actorName: actorName || "Utilisateur",
      action,
      details: details || "",
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    // Un échec de journalisation ne doit jamais bloquer l'action principale.
    console.error("Impossible d'enregistrer l'action dans l'historique :", err);
  }
}
