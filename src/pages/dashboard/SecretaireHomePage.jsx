import { Link } from "react-router-dom";
import { IconUsers, IconClipboard, IconArrowRight } from "../../components/icons";

export default function SecretaireHomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          to="/app/eleves"
          className="rounded-xl border border-line bg-surface p-6 flex items-center justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
              <IconUsers className="w-5 h-5 text-indigo-500" />
            </div>
            <h3 className="mt-4 font-display text-base text-ink">Élèves</h3>
            <p className="mt-1 text-sm text-ink-soft">Voir et inscrire des élèves</p>
          </div>
          <IconArrowRight className="w-4 h-4 text-ink-soft shrink-0" />
        </Link>

        <Link
          to="/app/inscriptions"
          className="rounded-xl border border-line bg-surface p-6 flex items-center justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
              <IconClipboard className="w-5 h-5 text-indigo-500" />
            </div>
            <h3 className="mt-4 font-display text-base text-ink">Inscriptions</h3>
            <p className="mt-1 text-sm text-ink-soft">Suivre les dossiers en cours</p>
          </div>
          <IconArrowRight className="w-4 h-4 text-ink-soft shrink-0" />
        </Link>
      </div>
    </div>
  );
}
