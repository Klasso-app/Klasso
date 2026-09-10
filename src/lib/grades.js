// Calcul des moyennes à partir des notes stockées dans
// schools/{schoolId}/grades. Chaque document représente une évaluation
// (une classe + une matière + un trimestre + un type + une année scolaire)
// et contient les notes de tous les élèves de cette classe pour cette
// évaluation :
//
//   { classId, className, subject, term, evaluationType, schoolYear,
//     coefficient, scores: { [studentId]: number } }
//
// La moyenne est pondérée par les coefficients de chaque matière.
//
// Important : les fonctions ci-dessous acceptent un paramètre `schoolYear`
// optionnel pour ne calculer une moyenne que sur une année scolaire
// précise. Sans lui, tout l'historique serait mélangé — un élève qui passe
// de 5ème en 4ème garderait sinon la moyenne de sa 5ème affichée sur sa
// nouvelle classe. Les notes enregistrées avant l'ajout de ce champ (donc
// sans `schoolYear`) sont considérées comme appartenant à l'année en cours,
// pour ne rien faire disparaître rétroactivement.

import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { currentSchoolYear } from "./schoolYear";

export async function fetchAllGrades(schoolId) {
  const snap = await getDocs(collection(db, "schools", schoolId, "grades"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function filterByYear(grades, schoolYear) {
  if (!schoolYear) return grades;
  return grades.filter((g) => (g.schoolYear || currentSchoolYear()) === schoolYear);
}

export function averageForStudent(grades, studentId, schoolYear) {
  const scoped = filterByYear(grades, schoolYear);
  const entries = scoped
    .filter((g) => typeof g.scores?.[studentId] === "number")
    .map((g) => ({ score: g.scores[studentId], coefficient: g.coefficient || 1 }));

  if (entries.length === 0) return null;
  const totalCoef = entries.reduce((a, e) => a + e.coefficient, 0);
  const weightedSum = entries.reduce((a, e) => a + e.score * e.coefficient, 0);
  if (totalCoef === 0) return null;
  return Math.round((weightedSum / totalCoef) * 100) / 100;
}

export function schoolAverage(grades, studentIds, schoolYear) {
  const averages = studentIds
    .map((id) => averageForStudent(grades, id, schoolYear))
    .filter((v) => v !== null);

  if (averages.length === 0) return null;
  const sum = averages.reduce((a, b) => a + b, 0);
  return Math.round((sum / averages.length) * 100) / 100;
}

// Détail matière par matière pour un élève, utilisé pour générer le
// bulletin. Regroupe par matière + trimestre (au cas où plusieurs
// évaluations existeraient pour la même combinaison).
export function subjectBreakdownForStudent(grades, studentId, schoolYear) {
  const scoped = filterByYear(grades, schoolYear);
  return scoped
    .filter((g) => typeof g.scores?.[studentId] === "number")
    .map((g) => ({
      subject: g.subject,
      term: g.term,
      evaluationType: g.evaluationType || "",
      score: g.scores[studentId],
      coefficient: g.coefficient || 1,
    }))
    .sort((a, b) => a.subject.localeCompare(b.subject));
}
