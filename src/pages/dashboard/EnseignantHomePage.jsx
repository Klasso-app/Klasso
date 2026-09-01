import { Link } from "react-router-dom";
import { IconChart, IconCalendar, IconArrowRight } from "../../components/icons";

export default function EnseignantHomePage() {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <Link
        to="/app/notes"
        className="rounded-xl border border-line bg-surface p-6 flex items-center justify-between"
      >
        <div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
            <IconChart className="w-5 h-5 text-indigo-500" />
          </div>
          <h3 className="mt-4 font-display text-base text-ink">Saisir des notes</h3>
          <p className="mt-1 text-sm text-ink-soft">Par classe, matière et trimestre</p>
        </div>
        <IconArrowRight className="w-4 h-4 text-ink-soft shrink-0" />
      </Link>

      <Link
        to="/app/emploi-du-temps"
        className="rounded-xl border border-line bg-surface p-6 flex items-center justify-between"
      >
        <div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
            <IconCalendar className="w-5 h-5 text-indigo-500" />
          </div>
          <h3 className="mt-4 font-display text-base text-ink">Emploi du temps</h3>
          <p className="mt-1 text-sm text-ink-soft">Consulter les créneaux de cours</p>
        </div>
        <IconArrowRight className="w-4 h-4 text-ink-soft shrink-0" />
      </Link>
    </div>
  );
}
