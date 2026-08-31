import { IconUserCircle, IconClipboard, IconChart, IconUsers } from "../icons";

const roles = [
  {
    icon: IconUserCircle,
    title: "Directeur",
    text: "Vue d'ensemble de l'établissement, paramètres de l'école et gestion des accès.",
  },
  {
    icon: IconClipboard,
    title: "Secrétaire",
    text: "Inscriptions, dossiers élèves, courriers et suivi administratif au quotidien.",
  },
  {
    icon: IconChart,
    title: "Enseignant",
    text: "Saisie des notes, présences et emploi du temps de ses classes.",
  },
  {
    icon: IconUsers,
    title: "Parent",
    text: "Suivi des résultats, de l'emploi du temps et des annonces de l'école.",
  },
];

export default function Roles() {
  return (
    <section id="espaces" className="mx-auto max-w-6xl px-5 py-20">
      <div className="max-w-lg">
        <h2 className="font-display text-3xl text-ink">Un espace pour chaque rôle</h2>
        <p className="mt-4 text-ink-soft">
          Chaque personne accède uniquement à ce dont elle a besoin, avec une
          interface adaptée à sa fonction dans l'établissement.
        </p>
      </div>

      <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {roles.map((r) => (
          <div key={r.title} className="p-6 rounded-xl border border-line">
            <r.icon className="w-6 h-6 text-terracotta-500" />
            <h3 className="mt-4 font-display text-lg text-ink">{r.title}</h3>
            <p className="mt-2 text-sm text-ink-soft leading-relaxed">{r.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
