// Fichier temporaire de prévisualisation, retiré avant livraison finale.
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Page } from "../context/PageTitleContext";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import RoleHomePage from "../pages/RoleHomePage";
import StudentsPage from "../pages/dashboard/StudentsPage";
import TeachersPage from "../pages/dashboard/TeachersPage";
import ClassesPage from "../pages/dashboard/ClassesPage";
import GradesPage from "../pages/dashboard/GradesPage";
import FinancesPage from "../pages/dashboard/FinancesPage";
import SchedulePage from "../pages/dashboard/SchedulePage";
import AbsencesPage from "../pages/dashboard/AbsencesPage";
import AnnouncementsPage from "../pages/dashboard/AnnouncementsPage";
import StatsPage from "../pages/dashboard/StatsPage";
import CalendarPage from "../pages/dashboard/CalendarPage";
import MessagesPage from "../pages/dashboard/MessagesPage";
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
    parentOf: [],
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
            <Route path="enseignants" element={<Page title="Enseignants"><TeachersPage /></Page>} />
            <Route path="classes" element={<Page title="Classes"><ClassesPage /></Page>} />
            <Route path="notes" element={<Page title="Notes"><GradesPage /></Page>} />
            <Route path="finances" element={<Page title="Finances"><FinancesPage /></Page>} />
            <Route path="emploi-du-temps" element={<Page title="Emploi du temps"><SchedulePage /></Page>} />
            <Route path="absences" element={<Page title="Absences"><AbsencesPage /></Page>} />
            <Route path="annonces" element={<Page title="Annonces"><AnnouncementsPage /></Page>} />
            <Route path="statistiques" element={<Page title="Statistiques"><StatsPage /></Page>} />
            <Route path="calendrier" element={<Page title="Calendrier"><CalendarPage /></Page>} />
            <Route path="messagerie" element={<Page title="Messagerie"><MessagesPage /></Page>} />
            <Route path="parametres" element={<Page title="Paramètres de l'école"><SettingsPage /></Page>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}
