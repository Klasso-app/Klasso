// Détermine les classes visibles pour l'utilisateur courant :
//  - un enseignant ne voit que la ou les classes qui lui sont attribuées
//    (enseignant unique en maternelle/primaire, ou affecté à une matière
//    au secondaire) ;
//  - un directeur ou une secrétaire peut être rattaché à un seul niveau
//    (champ `level` sur son profil) et ne voit alors que ce niveau ;
//    sans ce champ, l'accès reste complet (cas du compte fondateur).
//
// Important : ce filtrage est appliqué côté interface pour donner à
// chaque personne une vue adaptée à son rôle. Il ne remplace pas les
// règles de sécurité Firestore (qui restent la véritable barrière
// d'accès aux données) — voir isAssignedTeacherForGrade côté règles pour
// la partie déjà protégée au niveau serveur (les notes).

export function getAccessibleClasses({ profile, classes, assignments = [] }) {
  if (!profile) return [];

  if (profile.role === "enseignant") {
    const uid = profile.id;
    return classes.filter(
      (c) =>
        c.headTeacherId === uid ||
        assignments.some((a) => a.classId === c.id && a.teacherId === uid)
    );
  }

  if ((profile.role === "directeur" || profile.role === "secretaire") && profile.level) {
    return classes.filter((c) => c.level === profile.level);
  }

  return classes;
}

export function isScopedProfile(profile) {
  return profile?.role === "enseignant" || !!profile?.level;
}
