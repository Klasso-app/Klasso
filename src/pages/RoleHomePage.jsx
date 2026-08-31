import { useAuth } from "../context/AuthContext";
import Loader from "../components/ui/Loader";
import { IconShield } from "../components/icons";
import DirecteurHomePage from "./dashboard/DirecteurHomePage";
import SecretaireHomePage from "./dashboard/SecretaireHomePage";
import EnseignantHomePage from "./dashboard/EnseignantHomePage";
import ParentHomePage from "./dashboard/ParentHomePage";

const homeByRole = {
  directeur: DirecteurHomePage,
  secretaire: SecretaireHomePage,
  enseignant: EnseignantHomePage,
  parent: ParentHomePage,
};

export default function RoleHomePage() {
  const { profile, loading, profileError, signOut } = useAuth();

  if (loading) return <Loader fullscreen={false} label="Chargement" />;

  if (profileError) {
    return (
      <div className="rounded-xl border border-line bg-surface p-8 flex flex-col items-center text-center max-w-md mx-auto">
        <div className="w-11 h-11 rounded-lg bg-danger-soft flex items-center justify-center mb-4">
          <IconShield className="w-5 h-5 text-danger" />
        </div>
        <h2 className="font-display text-lg text-ink">Impossible de charger votre espace</h2>
        <p className="mt-2 text-sm text-ink-soft">{profileError}</p>
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="text-sm bg-indigo-500 text-white rounded-lg px-4 py-2"
          >
            Réessayer
          </button>
          <button onClick={signOut} className="text-sm text-ink-soft px-4 py-2">
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return <Loader fullscreen={false} label="Chargement" />;

  const Home = homeByRole[profile.role] || DirecteurHomePage;
  return <Home />;
}
