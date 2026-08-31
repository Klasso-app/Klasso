import { IconBell } from "../icons";
import { useAuth } from "../../context/AuthContext";

export default function Topbar({ title }) {
  const { profile } = useAuth();
  const firstName = (profile?.name || "").split(" ")[0];

  return (
    <div className="flex items-center justify-between px-6 py-5 border-b border-line bg-surface">
      <div>
        <h1 className="font-display text-xl text-ink">{title}</h1>
        {firstName && (
          <p className="text-sm text-ink-soft mt-0.5">Bon retour, {firstName}</p>
        )}
      </div>
      <button aria-label="Notifications" className="relative p-2 rounded-lg border border-line text-ink-soft">
        <IconBell className="w-4.5 h-4.5" />
      </button>
    </div>
  );
}
