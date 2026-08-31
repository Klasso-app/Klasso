import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import KlassoLogo from "../ui/KlassoLogo";
import {
  IconHome,
  IconUsers,
  IconClipboard,
  IconLayers,
  IconWallet,
  IconSettings,
  IconCalendar,
  IconChart,
  IconMoreVertical,
} from "../icons";

const navByRole = {
  directeur: [
    { section: "Général", items: [
      { to: "/app", label: "Tableau de bord", icon: IconHome, end: true },
      { to: "/app/eleves", label: "Élèves", icon: IconUsers },
      { to: "/app/enseignants", label: "Enseignants", icon: IconClipboard },
      { to: "/app/classes", label: "Classes", icon: IconLayers },
      { to: "/app/finances", label: "Finances", icon: IconWallet },
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
      { to: "/app/emploi-du-temps", label: "Emploi du temps", icon: IconCalendar },
    ]},
  ],
  parent: [
    { section: "Général", items: [
      { to: "/app", label: "Tableau de bord", icon: IconHome, end: true },
      { to: "/app/mes-enfants", label: "Mes enfants", icon: IconUsers },
      { to: "/app/emploi-du-temps", label: "Emploi du temps", icon: IconCalendar },
    ]},
  ],
};

export default function Sidebar() {
  const { profile, school, signOut } = useAuth();
  const role = profile?.role || "directeur";
  const sections = navByRole[role] || navByRole.directeur;

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-line bg-surface h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-line">
        <KlassoLogo size={30} />
        {school?.name && (
          <p className="mt-3 text-xs text-ink-soft truncate">{school.name}</p>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-6">
        {sections.map((section) => (
          <div key={section.section}>
            <p className="px-2.5 mb-2 text-xs text-ink-soft">{section.section}</p>
            <div className="flex flex-col gap-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm ${
                      isActive
                        ? "bg-indigo-50 text-indigo-600 font-medium"
                        : "text-ink-soft"
                    }`
                  }
                >
                  <item.icon className="w-4.5 h-4.5" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-line px-3 py-3 flex items-center justify-between">
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
    </aside>
  );
}

function roleLabel(role) {
  return {
    directeur: "Directeur",
    secretaire: "Secrétaire",
    enseignant: "Enseignant",
    parent: "Parent",
  }[role] || role;
}
