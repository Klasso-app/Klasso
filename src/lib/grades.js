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
// Important : les fonctions ci-dessous filtrent par ANNÉE SCOLAIRE et, si
// fourni, par CLASSE (className). Les deux sont nécessaires : l'année seule
// ne suffit pas si un passage de classe est simulé dans la même année
// civile (tests, ou changement de classe en cours d'année) — filtrer aussi
// sur la classe garantit qu'un élève qui change de classe reparte avec des
// notes vierges pour sa nouvelle classe, quelle que soit la date réelle.
// Les notes enregistrées avant l'ajout du champ `schoolYear` sont
// considérées comme appartenant à l'année en cours, pour ne rien faire
// disparaître rétroactivement.

import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { currentSchoolYear } from "./schoolYear";

export async function fetchAllGrades(schoolId) {
  const snap = await getDocs(collection(db, "schools", schoolId, "grades"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function filterScope(grades, schoolYear, className) {
  let scoped = grades;
  if (schoolYear) {
    scoped = scoped.filter((g) => (g.schoolYear || currentSchoolYear()) === schoolYear);
  }
  if (className) {
    scoped = scoped.filter((g) => g.className === className);
  }
  return scoped;
}

export function averageForStudent(grades, studentId, schoolYear, className) {
  const scoped = filterScope(grades, schoolYear, className);
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
export function subjectBreakdownForStudent(grades, studentId, schoolYear, className) {
  const scoped = filterScope(grades, schoolYear, className);
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
