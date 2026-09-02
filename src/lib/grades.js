// Calcul des moyennes à partir des notes stockées dans
// schools/{schoolId}/grades. Chaque document représente une évaluation
// (une classe + une matière + un trimestre + un coefficient) et contient
// les notes de tous les élèves de cette classe pour cette évaluation :
//
//   { classId, className, subject, term, coefficient, scores: { [studentId]: number } }
//
// La moyenne est pondérée par les coefficients de chaque matière.

import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export async function fetchAllGrades(schoolId) {
  const snap = await getDocs(collection(db, "schools", schoolId, "grades"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function averageForStudent(grades, studentId) {
  const entries = grades
    .filter((g) => typeof g.scores?.[studentId] === "number")
    .map((g) => ({ score: g.scores[studentId], coefficient: g.coefficient || 1 }));

  if (entries.length === 0) return null;
  const totalCoef = entries.reduce((a, e) => a + e.coefficient, 0);
  const weightedSum = entries.reduce((a, e) => a + e.score * e.coefficient, 0);
  if (totalCoef === 0) return null;
  return Math.round((weightedSum / totalCoef) * 100) / 100;
}

export function schoolAverage(grades, studentIds) {
  const averages = studentIds
    .map((id) => averageForStudent(grades, id))
    .filter((v) => v !== null);

  if (averages.length === 0) return null;
  const sum = averages.reduce((a, b) => a + b, 0);
  return Math.round((sum / averages.length) * 100) / 100;
}

// Détail matière par matière pour un élève, utilisé pour générer le
// bulletin. Regroupe par matière + trimestre (au cas où plusieurs
// évaluations existeraient pour la même combinaison).
export function subjectBreakdownForStudent(grades, studentId) {
  return grades
    .filter((g) => typeof g.scores?.[studentId] === "number")
    .map((g) => ({
      subject: g.subject,
      term: g.term,
      score: g.scores[studentId],
      coefficient: g.coefficient || 1,
    }))
    .sort((a, b) => a.subject.localeCompare(b.subject));
}
