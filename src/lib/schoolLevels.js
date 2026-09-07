// Référentiel fixe des niveaux et classes proposés à la création d'une
// classe. Centralisé ici pour être réutilisé ailleurs si besoin (filtres,
// statistiques...).

export const LEVELS = ["Maternelle", "Primaire", "Secondaire"];

export const CLASS_NAMES_BY_LEVEL = {
  Maternelle: ["Maternelle 1", "Maternelle 2"],
  Primaire: ["CI", "CP", "CE1", "CE2", "CM1", "CM2"],
  Secondaire: ["6ème", "5ème", "4ème", "3ème", "2nde", "1ère", "Terminale"],
};

// Type d'évaluation proposé selon le niveau de la classe : en maternelle et
// primaire, une seule notion (« Évaluation ») suffit puisqu'un seul
// enseignant note tout ; au secondaire, on distingue interrogation et devoir
// (généralement pondérés différemment via le coefficient).
export const EVALUATION_TYPES_BY_LEVEL = {
  Maternelle: ["Évaluation"],
  Primaire: ["Évaluation"],
  Secondaire: ["Interrogation", "Devoir"],
};
