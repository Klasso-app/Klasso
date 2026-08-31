import { useState } from "react";
import { IconMenu, IconClose } from "../icons";
import KlassoLogo from "../ui/KlassoLogo";

const links = [
  { label: "Fonctionnalités", href: "#fonctionnalites" },
  { label: "Multi-établissement", href: "#multi-etablissement" },
  { label: "Les espaces", href: "#espaces" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-line">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <KlassoLogo size={34} />

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-ink-soft"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a href="#connexion" className="text-sm font-medium text-ink px-4 py-2">
            Se connecter
          </a>
          <a
            href="#demo"
            className="text-sm font-medium text-white bg-indigo-500 px-4 py-2 rounded-lg"
          >
            Demander une démo
          </a>
        </div>

        <button
          className="md:hidden p-2 text-ink"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {open ? <IconClose className="w-6 h-6" /> : <IconMenu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-line bg-surface px-5 py-4 flex flex-col gap-4">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-ink-soft">
              {l.label}
            </a>
          ))}
          <a href="#connexion" className="text-sm font-medium text-ink">
            Se connecter
          </a>
          <a
            href="#demo"
            className="text-sm font-medium text-white bg-indigo-500 px-4 py-2 rounded-lg text-center"
          >
            Demander une démo
          </a>
        </div>
      )}
    </header>
  );
}
