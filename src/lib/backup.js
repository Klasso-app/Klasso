import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

// Toutes les collections directement sous schools/{schoolId}/. À tenir à
// jour si une nouvelle collection est ajoutée à l'app — sinon elle sera
// silencieusement absente des sauvegardes.
const TOP_LEVEL_COLLECTIONS = [
  "students",
  "teachers",
  "classes",
  "subjects",
  "grades",
  "absences",
  "payments",
  "expenses",
  "otherFees",
  "tuitionFees",
  "schedule",
  "classSubjectTeachers",
  "announcements",
  "books",
  "loans",
  "busRoutes",
  "canteenMenus",
  "applications",
  "appreciations",
  "auditLogs",
  "events",
  "leaves",
  "teacherAttendance",
  "teacherEvaluations",
  "meta",
];

// Les timestamps Firestore ne se sérialisent pas lisiblement en JSON brut :
// on les convertit en date ISO, récursivement dans les objets et tableaux
// imbriqués (ex. les tableaux de documents dans une évaluation d'élève).
function serializeValue(value) {
  if (value && typeof value.toDate === "function") return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serializeValue);
  if (value && typeof value === "object") return serializeData(value);
  return value;
}

function serializeData(data) {
  const out = {};
  for (const [key, value] of Object.entries(data)) {
    out[key] = serializeValue(value);
  }
  return out;
}

function slugify(str) {
  return (str || "ecole")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Exporte l'intégralité des données de l'école en un seul fichier JSON
// téléchargé côté navigateur (aucun serveur impliqué). Les conversations
// sont un cas particulier : leurs messages vivent dans une sous-collection
// (conversations/{id}/messages), récupérée à part et imbriquée.
export async function exportSchoolBackup(schoolId, schoolName, onProgress) {
  const backup = {
    exportedAt: new Date().toISOString(),
    schoolId,
    schoolName: schoolName || "",
    collections: {},
  };

  for (const name of TOP_LEVEL_COLLECTIONS) {
    onProgress?.(name);
    const snap = await getDocs(collection(db, "schools", schoolId, name));
    backup.collections[name] = snap.docs.map((d) => ({ id: d.id, ...serializeData(d.data()) }));
  }

  onProgress?.("conversations");
  const convSnap = await getDocs(collection(db, "schools", schoolId, "conversations"));
  const conversations = [];
  for (const convDoc of convSnap.docs) {
    const messagesSnap = await getDocs(
      collection(db, "schools", schoolId, "conversations", convDoc.id, "messages")
    );
    conversations.push({
      id: convDoc.id,
      ...serializeData(convDoc.data()),
      messages: messagesSnap.docs.map((m) => ({ id: m.id, ...serializeData(m.data()) })),
    });
  }
  backup.collections.conversations = conversations;

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `klasso-sauvegarde-${slugify(schoolName)}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  const totalDocs = Object.values(backup.collections).reduce(
    (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
    0
  );
  return { totalDocs };
}
