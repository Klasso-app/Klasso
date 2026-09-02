// Détermine l'année scolaire en cours (au sens large : août à juillet) et
// la suivante, utilisées pour la réinscription simplifiée.

export function currentSchoolYear(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0 = janvier
  const startYear = month >= 7 ? year : year - 1; // à partir d'août
  return `${startYear}-${startYear + 1}`;
}

export function nextSchoolYear(date = new Date()) {
  const [start] = currentSchoolYear(date).split("-").map(Number);
  return `${start + 1}-${start + 2}`;
}
