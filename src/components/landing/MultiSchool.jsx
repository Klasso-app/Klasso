import { IconBuilding, IconCheck } from "../icons";

const points = [
  "Chaque établissement gère ses propres classes, effectifs et enseignants.",
  "Le directeur ou un membre désigné personnalise les informations de son école.",
  "Les données d'un établissement ne sont jamais visibles par un autre.",
];

export default function MultiSchool() {
  return (
    <section id="multi-etablissement" className="bg-marine-900 text-white">
      <div className="mx-auto max-w-6xl px-5 py-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="w-11 h-11 rounded-lg bg-white/10 flex items-center justify-center">
            <IconBuilding className="w-5 h-5 text-white" />
          </div>
          <h2 className="mt-5 font-display text-3xl">
            Conçu pour les groupes scolaires
          </h2>
          <p className="mt-4 text-marine-100 max-w-md">
            Que vous dirigiez une seule école ou un groupe de plusieurs
            établissements, Klasso s'adapte sans dupliquer vos efforts.
          </p>
        </div>

        <ul className="flex flex-col gap-5">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-3">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-terracotta-500 flex items-center justify-center shrink-0">
                <IconCheck className="w-3 h-3 text-white" />
              </span>
              <span className="text-sm text-marine-50 leading-relaxed">{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
