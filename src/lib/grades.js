// Calcul des moyennes à partir des notes stockées dans
// schools/{schoolId}/grades. Chaque document représente une évaluation
// (une classe + une matière + un trimestre) et contient les notes de tous
// les élèves de cette classe pour cette évaluation :
//
//   { classId, className, subject, term, scores: { [studentId]: number } }
//
// MVP : moyenne non pondérée (sans coefficients par matière). Les
// coefficients pourront être ajoutés plus tard sans changer ce modèle.

import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export async function fetchAllGrades(schoolId) {
  const snap = await getDocs(collection(db, "schools", schoolId, "grades"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function averageForStudent(grades, studentId) {
  const scores = grades
    .map((g) => g.scores?.[studentId])
    .filter((v) => typeof v === "number");

  if (scores.length === 0) return null;
  const sum = scores.reduce((a, b) => a + b, 0);
  return Math.round((sum / scores.length) * 100) / 100;
}

export function schoolAverage(grades, studentIds) {
  const averages = studentIds
    .map((id) => averageForStudent(grades, id))
    .filter((v) => v !== null);

  if (averages.length === 0) return null;
  const sum = averages.reduce((a, b) => a + b, 0);
  return Math.round((sum / averages.length) * 100) / 100;
}
