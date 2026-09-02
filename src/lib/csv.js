// Export CSV léger, sans dépendance externe. Excel, Google Sheets et
// LibreOffice ouvrent nativement les fichiers .csv, donc pas besoin d'une
// librairie de génération .xlsx (celles disponibles ont des failles de
// sécurité non corrigées à ce jour).

export function exportToCsv(filename, rows) {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const escape = (value) => {
    const str = String(value ?? "");
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ];

  // BOM UTF-8 pour qu'Excel affiche correctement les accents français.
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
