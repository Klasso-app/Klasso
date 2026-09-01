import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import KlassoLogo from "../ui/KlassoLogo";
import { navByRole, roleLabel } from "./navConfig";
import { IconClose, IconMoreVertical } from "../icons";

export default function MobileNav({ open, onClose }) {
  const { profile, school, signOut } = useAuth();

  // Empêche la page derrière le menu de défiler (sinon, sur mobile, un
  // scroll qui atteint le bas du menu "déborde" et fait défiler le
  // tableau de bord caché en dessous).
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  const role = profile?.role || "directeur";
  const sections = navByRole[role] || navByRole.directeur;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface lg:hidden overscroll-contain">
      <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
        <KlassoLogo size={28} />
        <button onClick={onClose} aria-label="Fermer le menu" className="p-1.5 text-ink-soft">
          <IconClose className="w-5 h-5" />
        </button>
      </div>

      {school?.name && (
        <p className="px-5 pt-4 text-xs text-ink-soft truncate shrink-0">{school.name}</p>
      )}

      <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 flex flex-col gap-6">
        {sections.map((section) => (
          <div key={section.section}>
            <p className="px-2.5 mb-2 text-xs text-ink-soft">{section.section}</p>
            <div className="flex flex-col gap-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-2.5 py-3 rounded-lg text-base ${
                      isActive
                        ? "bg-indigo-50 text-indigo-600 font-medium"
                        : "text-ink"
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-line px-3 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 px-1.5 min-w-0">
          <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-medium shrink-0">
            {(profile?.name || "K")[0].toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="text-sm text-ink truncate">{profile?.name || "Utilisateur"}</p>
            <p className="text-xs text-ink-soft truncate">{roleLabel(role)}</p>
          </div>
        </div>
        <button onClick={signOut} aria-label="Se déconnecter" className="p-1.5 text-ink-soft">
          <IconMoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
