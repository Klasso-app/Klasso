export async function downloadReceipt({ school, payment }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a5" });
  const marginX = 18;
  let y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text(school?.name || "Établissement", marginX, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  y += 6;
  const location = [school?.city, school?.country].filter(Boolean).join(", ");
  if (location) {
    doc.text(location, marginX, y);
    y += 5;
  }

  y += 6;
  doc.setDrawColor(228, 230, 238);
  doc.line(marginX, y, 130, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.text("Reçu de paiement", marginX, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const rows = [
    ["Élève", payment.studentName],
    ["Montant", formatAmount(payment.amount)],
    ["Moyen de paiement", payment.method],
    ["Date", payment.date],
    ["Référence", payment.id],
  ];
  rows.forEach(([label, value]) => {
    doc.setTextColor(100, 100, 100);
    doc.text(label, marginX, y);
    doc.setTextColor(30, 30, 30);
    doc.text(String(value), 70, y);
    y += 7;
  });

  y += 10;
  doc.setDrawColor(228, 230, 238);
  doc.line(marginX, y, 130, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Reçu généré le ${new Date().toLocaleDateString("fr-FR")} via Klasso.`, marginX, y);

  doc.save(`recu-${payment.id}.pdf`);
}

function formatAmount(n) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}
