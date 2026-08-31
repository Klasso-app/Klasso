import { IconArrowRight } from "../icons";

export default function CtaBanner() {
  return (
    <section id="demo" className="mx-auto max-w-6xl px-5 py-20">
      <div className="rounded-2xl border border-line bg-surface-tint px-8 py-14 text-center">
        <h2 className="font-display text-3xl text-ink max-w-lg mx-auto">
          Prêt à simplifier la gestion de votre école ?
        </h2>
        <p className="mt-4 text-ink-soft max-w-md mx-auto">
          Présentez-nous votre établissement et nous vous montrons comment
          Klasso s'adapte à votre organisation.
        </p>
        <a
          href="#contact"
          className="mt-8 inline-flex items-center gap-2 bg-indigo-500 text-white text-sm font-medium px-6 py-3 rounded-lg"
        >
          Demander une démo
          <IconArrowRight className="w-4 h-4" />
        </a>
      </div>
    </section>
  );
}
