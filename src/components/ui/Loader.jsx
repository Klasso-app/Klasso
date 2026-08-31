// Loader Klasso : reprend les trois barres ascendantes de l'icône du logo,
// animées en cascade. Pleine page ou en ligne selon la prop `fullscreen`.

export default function Loader({ fullscreen = true, label = "Chargement" }) {
  const bars = (
    <div className="flex items-end gap-1.5 h-9">
      <span className="w-2.5 rounded-sm bg-indigo-500 animate-klasso-bar" style={{ animationDelay: "0ms" }} />
      <span className="w-2.5 rounded-sm bg-indigo-500 animate-klasso-bar" style={{ animationDelay: "150ms" }} />
      <span className="w-2.5 rounded-sm bg-terracotta-500 animate-klasso-bar" style={{ animationDelay: "300ms" }} />
    </div>
  );

  if (!fullscreen) {
    return (
      <div className="inline-flex items-center gap-3">
        {bars}
        {label && <span className="text-sm text-ink-soft">{label}</span>}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-surface">
      {bars}
      <p className="text-sm tracking-wide text-ink-soft">{label}</p>
    </div>
  );
}
