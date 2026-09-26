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

// Année cible pour réinscrire (ou faire passer) un élève dont l'année
// scolaire enregistrée est `previousSchoolYear`.
// - S'il est déjà sur l'année en cours (ou n'a pas d'année connue), on le
//   prépare pour l'année suivante (cas : réinscription anticipée en
//   juin/juillet, avant la rentrée).
// - S'il est déjà sur l'année suivante, il a déjà été réinscrit en avance :
//   on ne change rien (idempotent), pour ne jamais faire régresser un
//   élève déjà à jour si le bouton est cliqué une seconde fois par erreur.
// - Sinon, il est en retard sur une année antérieure : on le ramène
//   directement sur l'année en cours (cas : rattrapage après la rentrée),
//   plutôt que de toujours viser « l'année après aujourd'hui », ce qui le
//   ferait sauter une année scolaire entière s'il est réinscrit après le
//   1er août.
export function reenrollmentTargetYear(previousSchoolYear, date = new Date()) {
  const current = currentSchoolYear(date);
  const next = nextSchoolYear(date);
  if (!previousSchoolYear || previousSchoolYear === current || previousSchoolYear === next) {
    return next;
  }
  return current;
}
