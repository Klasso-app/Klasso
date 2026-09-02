import {
  IconHome,
  IconUsers,
  IconClipboard,
  IconLayers,
  IconWallet,
  IconSettings,
  IconCalendar,
  IconChart,
  IconMessage,
} from "../icons";

export const navByRole = {
  directeur: [
    { section: "Général", items: [
      { to: "/app", label: "Tableau de bord", icon: IconHome, end: true },
      { to: "/app/eleves", label: "Élèves", icon: IconUsers },
      { to: "/app/enseignants", label: "Enseignants", icon: IconClipboard },
      { to: "/app/classes", label: "Classes", icon: IconLayers },
      { to: "/app/notes", label: "Notes", icon: IconChart },
      { to: "/app/absences", label: "Absences", icon: IconCalendar },
      { to: "/app/finances", label: "Finances", icon: IconWallet },
      { to: "/app/statistiques", label: "Statistiques", icon: IconChart },
      { to: "/app/annonces", label: "Annonces", icon: IconMessage },
    ]},
    { section: "Autres", items: [
      { to: "/app/parametres", label: "Paramètres de l'école", icon: IconSettings },
    ]},
  ],
  secretaire: [
    { section: "Général", items: [
      { to: "/app", label: "Tableau de bord", icon: IconHome, end: true },
      { to: "/app/eleves", label: "Élèves", icon: IconUsers },
      { to: "/app/inscriptions", label: "Inscriptions", icon: IconClipboard },
      { to: "/app/absences", label: "Absences", icon: IconCalendar },
      { to: "/app/annonces", label: "Annonces", icon: IconMessage },
    ]},
    { section: "Autres", items: [
      { to: "/app/parametres", label: "Paramètres de l'école", icon: IconSettings },
    ]},
  ],
  enseignant: [
    { section: "Général", items: [
      { to: "/app", label: "Tableau de bord", icon: IconHome, end: true },
      { to: "/app/mes-classes", label: "Mes classes", icon: IconLayers },
      { to: "/app/notes", label: "Notes", icon: IconChart },
      { to: "/app/absences", label: "Absences", icon: IconCalendar },
      { to: "/app/emploi-du-temps", label: "Emploi du temps", icon: IconCalendar },
      { to: "/app/annonces", label: "Annonces", icon: IconMessage },
    ]},
  ],
  parent: [
    { section: "Général", items: [
      { to: "/app", label: "Tableau de bord", icon: IconHome, end: true },
      { to: "/app/mes-enfants", label: "Mes enfants", icon: IconUsers },
      { to: "/app/emploi-du-temps", label: "Emploi du temps", icon: IconCalendar },
      { to: "/app/annonces", label: "Annonces", icon: IconMessage },
    ]},
  ],
};

export function roleLabel(role) {
  return {
    directeur: "Directeur",
    secretaire: "Secrétaire",
    enseignant: "Enseignant",
    parent: "Parent",
  }[role] || role;
}
