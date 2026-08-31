import {
  IconClipboard,
  IconChart,
  IconCalendar,
  IconWallet,
  IconMessage,
  IconLayers,
} from "../icons";

const features = [
  {
    icon: IconClipboard,
    title: "Inscriptions et dossiers élèves",
    text: "Centralisez l'état civil, les documents et l'historique scolaire de chaque élève, de son inscription à sa réinscription.",
  },
  {
    icon: IconChart,
    title: "Notes et moyennes",
    text: "Les enseignants saisissent les notes, Klasso calcule les moyennes, classements et bulletins automatiquement.",
  },
  {
    icon: IconCalendar,
    title: "Emplois du temps et absences",
    text: "Construisez les emplois du temps par classe et suivez les absences des élèves et du personnel au quotidien.",
  },
  {
    icon: IconWallet,
    title: "Frais de scolarité",
    text: "Suivez les paiements, les échéanciers et les impayés, et générez les reçus automatiquement.",
  },
  {
    icon: IconMessage,
    title: "Espace parents",
    text: "Les parents accèdent aux notes, à l'emploi du temps et aux annonces de l'école, et sont notifiés en temps réel.",
  },
  {
    icon: IconLayers,
    title: "Multi-établissement",
    text: "Gérez plusieurs écoles depuis un même compte, chacune avec ses propres classes, effectifs et paramètres.",
  },
];

export default function Features() {
  return (
    <section id="fonctionnalites" className="bg-surface-tint border-y border-line">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <div className="max-w-lg">
          <h2 className="font-display text-3xl text-ink">
            Un logiciel pensé pour chaque étape de la scolarité
          </h2>
          <p className="mt-4 text-ink-soft">
            De la maternelle à la terminale, Klasso couvre les besoins
            administratifs et pédagogiques de votre établissement.
          </p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-line bg-surface p-6">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <f.icon className="w-5 h-5 text-indigo-500" />
              </div>
              <h3 className="mt-4 font-display text-lg text-ink">{f.title}</h3>
              <p className="mt-2 text-sm text-ink-soft leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
