import { useAuth } from "../context/AuthContext";
import Loader from "../components/ui/Loader";
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
  const { profile, loading } = useAuth();

  if (loading || !profile) return <Loader fullscreen={false} label="Chargement" />;

  const Home = homeByRole[profile.role] || DirecteurHomePage;
  return <Home />;
}
