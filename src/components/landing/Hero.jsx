import { IconArrowRight, IconChart } from "../icons";

export default function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-5 pt-14 pb-20 md:pt-20 md:pb-28">
      <div className="grid md:grid-cols-2 gap-14 items-center">
        <div>
          <h1 className="font-display text-4xl md:text-5xl leading-tight text-ink">
            La gestion de votre école, de l'inscription au bulletin.
          </h1>
          <p className="mt-5 text-base md:text-lg text-ink-soft max-w-md">
            Klasso réunit les inscriptions, les notes, les emplois du temps,
            les enseignants et les parents dans un seul espace, pensé pour
            les établissements de la maternelle à la terminale.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#demo"
              className="inline-flex items-center gap-2 bg-indigo-500 text-white text-sm font-medium px-5 py-3 rounded-lg"
            >
              Demander une démo
              <IconArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#fonctionnalites"
              className="inline-flex items-center gap-2 text-sm font-medium text-ink px-5 py-3 rounded-lg border border-line"
            >
              Voir les fonctionnalités
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-ink-soft">
            <span>Maternelle à la terminale</span>
            <span>Multi-établissement</span>
            <span>Pensé pour l'Afrique de l'Ouest</span>
          </div>
        </div>

        <DashboardMock />
      </div>
    </section>
  );
}

function DashboardMock() {
  const rows = [
    { name: "Aïcha Koné", classe: "6ème A", moyenne: "15,4", statut: "Publié" },
    { name: "Moussa Diarra", classe: "5ème B", moyenne: "12,1", statut: "Publié" },
    { name: "Fatou Sow", classe: "6ème A", moyenne: "17,0", statut: "En attente" },
  ];

  return (
    <div className="rounded-2xl border border-line bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-surface-tint">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          <span className="text-sm font-medium text-ink">Groupe Scolaire Étoile</span>
        </div>
        <span className="text-xs text-ink-soft">Année 2026 – 2027</span>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-xl border border-line p-4">
            <p className="text-xs text-ink-soft">Effectif total</p>
            <p className="font-display text-2xl mt-1 text-ink">842</p>
          </div>
          <div className="rounded-xl border border-line p-4">
            <p className="text-xs text-ink-soft">Moyenne générale</p>
            <p className="font-display text-2xl mt-1 text-ink">13,8</p>
          </div>
        </div>

        <div className="rounded-xl border border-line p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-ink">Frais encaissés</p>
            <IconChart className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-end gap-1.5 h-16">
            {[30, 45, 38, 55, 70, 60, 82].map((h, i) => (
              <span
                key={i}
                className="flex-1 rounded-sm bg-indigo-100"
                style={{ height: `${h}%`, backgroundColor: i === 6 ? "#3B4FE0" : undefined }}
              />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-line overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-tint text-left text-xs text-ink-soft">
                <th className="px-4 py-2.5 font-medium">Élève</th>
                <th className="px-4 py-2.5 font-medium">Classe</th>
                <th className="px-4 py-2.5 font-medium">Moyenne</th>
                <th className="px-4 py-2.5 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name} className="border-t border-line">
                  <td className="px-4 py-2.5 text-ink">{r.name}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{r.classe}</td>
                  <td className="px-4 py-2.5 text-ink">{r.moyenne}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={
                        r.statut === "Publié"
                          ? "text-success bg-success-soft text-xs px-2 py-0.5 rounded-md"
                          : "text-warning bg-warning-soft text-xs px-2 py-0.5 rounded-md"
                      }
                    >
                      {r.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
