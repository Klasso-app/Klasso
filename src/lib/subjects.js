// Liste de départ des matières couramment enseignées au Bénin, du collège
// (6ème-3ème) au lycée (2nde-Terminale), d'après les programmes du
// Ministère des Enseignements Secondaire et de l'UNESCO. Cette liste est
// un point de départ : le directeur peut la modifier, en retirer ou en
// ajouter librement (les séries A/C/D/G n'ont pas exactement les mêmes
// matières, et chaque établissement a ses spécificités).

export const DEFAULT_SUBJECTS = [
  { name: "Français", cycle: "Les deux" },
  { name: "Anglais", cycle: "Les deux" },
  { name: "Mathématiques", cycle: "Les deux" },
  { name: "Histoire et Géographie", cycle: "Les deux" },
  { name: "Physique-Chimie-Technologie (PCT)", cycle: "Les deux" },
  { name: "Sciences de la Vie et de la Terre (SVT)", cycle: "Les deux" },
  { name: "Philosophie", cycle: "Lycée" },
  { name: "Éducation Civique et Morale (ECM)", cycle: "Les deux" },
  { name: "Éducation Physique et Sportive (EPS)", cycle: "Les deux" },
  { name: "Espagnol (LV2)", cycle: "Les deux" },
  { name: "Allemand (LV2)", cycle: "Les deux" },
  { name: "Économie Familiale", cycle: "Collège" },
  { name: "Technologie", cycle: "Collège" },
  { name: "Informatique", cycle: "Les deux" },
  { name: "Arts Plastiques", cycle: "Collège" },
  { name: "Éducation Musicale", cycle: "Collège" },
];

import { collection, doc, setDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export async function seedDefaultSubjects(schoolId) {
  const existing = await getDocs(collection(db, "schools", schoolId, "subjects"));
  if (!existing.empty) return 0;

  await Promise.all(
    DEFAULT_SUBJECTS.map((s) =>
      setDoc(doc(collection(db, "schools", schoolId, "subjects")), {
        ...s,
        createdAt: serverTimestamp(),
      })
    )
  );
  return DEFAULT_SUBJECTS.length;
}
