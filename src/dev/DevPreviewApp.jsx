// Fichier temporaire de prévisualisation, retiré avant livraison finale.
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Page } from "../context/PageTitleContext";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import RoleHomePage from "../pages/RoleHomePage";
import StudentsPage from "../pages/dashboard/StudentsPage";
import SettingsPage from "../pages/dashboard/SettingsPage";

const role = new URLSearchParams(window.location.search).get("role") || "directeur";
const initialPath = new URLSearchParams(window.location.search).get("path") || "/app";

const fakeValue = {
  firebaseUser: { uid: "dev-uid" },
  profile: {
    name: "Jean Testeur",
    role,
    schoolId: "dev-school",
    canEditSchoolSettings: role === "directeur",
  },
  school: {
    id: "dev-school",
    name: "École Test Klasso",
    city: "Abidjan",
    country: "Côte d'Ivoire",
  },
  loading: false,
  signOut: async () => {},
  refreshSchool: async () => {},
};

export default function DevPreviewApp() {
  return (
    <AuthContext.Provider value={fakeValue}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/app" element={<DashboardLayout />}>
            <Route index element={<Page title="Tableau de bord"><RoleHomePage /></Page>} />
            <Route path="eleves" element={<Page title="Élèves"><StudentsPage /></Page>} />
            <Route path="parametres" element={<Page title="Paramètres de l'école"><SettingsPage /></Page>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}
