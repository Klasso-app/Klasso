import { useState } from "react";
import { IconBell, IconMenu } from "../icons";
import { useAuth } from "../../context/AuthContext";
import MobileNav from "./MobileNav";

export default function Topbar({ title }) {
  const { profile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const firstName = (profile?.name || "").split(" ")[0];

  return (
    <>
      <div className="flex items-center justify-between px-5 lg:px-6 py-5 border-b border-line bg-surface">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Ouvrir le menu"
            className="lg:hidden p-2 -ml-2 text-ink"
          >
            <IconMenu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-xl text-ink">{title}</h1>
            {firstName && (
              <p className="text-sm text-ink-soft mt-0.5">Bon retour, {firstName}</p>
            )}
          </div>
        </div>
        <button aria-label="Notifications" className="relative p-2 rounded-lg border border-line text-ink-soft">
          <IconBell className="w-4.5 h-4.5" />
        </button>
      </div>

      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
