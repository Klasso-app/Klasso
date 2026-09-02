import { averageForStudent, subjectBreakdownForStudent } from "./grades";

// jsPDF est chargé à la demande (et non au démarrage de l'app) pour ne pas
// alourdir le chargement initial du dashboard, alors que peu de visites
// génèrent réellement un bulletin.
export async function downloadBulletin({ school, student, grades, term }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const marginX = 20;
  let y = 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(30, 30, 30);
  doc.text(school?.name || "Établissement", marginX, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  y += 6;
  const location = [school?.city, school?.country].filter(Boolean).join(", ");
  if (location) {
    doc.text(location, marginX, y);
    y += 5;
  }

  y += 6;
  doc.setDrawColor(228, 230, 238);
  doc.line(marginX, y, 190, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text("Bulletin de notes", marginX, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Élève : ${student.fullName}`, marginX, y);
  y += 6;
  doc.text(`Classe : ${student.classLabel || "—"}`, marginX, y);
  y += 6;
  doc.text(`Période : ${term}`, marginX, y);
  y += 10;

  const rows = subjectBreakdownForStudent(grades, student.id).filter(
    (r) => term === "Toutes les périodes" || r.term === term
  );

  // En-tête du tableau
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(70, 70, 70);
  doc.text("Matière", marginX, y);
  doc.text("Trimestre", 95, y);
  doc.text("Note / 20", 140, y);
  doc.text("Coef.", 170, y);
  y += 3;
  doc.setDrawColor(228, 230, 238);
  doc.line(marginX, y, 190, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 30, 30);

  if (rows.length === 0) {
    doc.setTextColor(120, 120, 120);
    doc.text("Aucune note disponible pour cette période.", marginX, y);
    y += 8;
  } else {
    rows.forEach((r) => {
      doc.text(r.subject, marginX, y);
      doc.text(r.term, 95, y);
      doc.text(String(r.score), 140, y);
      doc.text(String(r.coefficient), 170, y);
      y += 7;
    });
  }

  y += 6;
  doc.setDrawColor(228, 230, 238);
  doc.line(marginX, y, 190, y);
  y += 10;

  const relevantGrades = term === "Toutes les périodes"
    ? grades
    : grades.filter((g) => g.term === term);
  const average = averageForStudent(relevantGrades, student.id);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Moyenne générale :", marginX, y);
  doc.text(average === null ? "—" : `${average} / 20`, 140, y);

  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(`Document généré le ${new Date().toLocaleDateString("fr-FR")} via Klasso.`, marginX, y);

  doc.save(`bulletin-${slugify(student.fullName)}.pdf`);
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
