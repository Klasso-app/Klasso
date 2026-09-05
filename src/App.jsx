import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Page } from "./context/PageTitleContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Loader from "./components/ui/Loader";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import CreateSchoolPage from "./pages/CreateSchoolPage";
import JoinAsParentPage from "./pages/JoinAsParentPage";
import RoleHomePage from "./pages/RoleHomePage";
import StudentsPage from "./pages/dashboard/StudentsPage";
import TeachersPage from "./pages/dashboard/TeachersPage";
import ClassesPage from "./pages/dashboard/ClassesPage";
import SubjectsPage from "./pages/dashboard/SubjectsPage";
import GradesPage from "./pages/dashboard/GradesPage";
import FinancesPage from "./pages/dashboard/FinancesPage";
import TuitionFeesPage from "./pages/dashboard/TuitionFeesPage";
import SchedulePage from "./pages/dashboard/SchedulePage";
import InscriptionsPage from "./pages/dashboard/InscriptionsPage";
import AbsencesPage from "./pages/dashboard/AbsencesPage";
import AnnouncementsPage from "./pages/dashboard/AnnouncementsPage";
import StatsPage from "./pages/dashboard/StatsPage";
import CalendarPage from "./pages/dashboard/CalendarPage";
import MessagesPage from "./pages/dashboard/MessagesPage";
import LibraryPage from "./pages/dashboard/LibraryPage";
import TransportPage from "./pages/dashboard/TransportPage";
import CanteenPage from "./pages/dashboard/CanteenPage";
import LogsPage from "./pages/dashboard/LogsPage";
import AdminPage from "./pages/dashboard/AdminPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import ParentHomePage from "./pages/dashboard/ParentHomePage";

export default function App() {
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 700);
    return () => clearTimeout(t);
  }, []);

  if (booting) return <Loader label="Chargement de Klasso" />;

  return (
    <AuthProvider>
      <BrowserRouter basename="/Klasso">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/creer-etablissement" element={<CreateSchoolPage />} />
          <Route path="/rejoindre-parent" element={<JoinAsParentPage />} />

          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Page title="Tableau de bord"><RoleHomePage /></Page>} />
            <Route path="eleves" element={<Page title="Élèves"><StudentsPage /></Page>} />
            <Route path="enseignants" element={<Page title="Enseignants"><TeachersPage /></Page>} />
            <Route path="classes" element={<Page title="Classes"><ClassesPage /></Page>} />
            <Route path="matieres" element={<Page title="Matières"><SubjectsPage /></Page>} />
            <Route path="notes" element={<Page title="Notes"><GradesPage /></Page>} />
            <Route path="finances" element={<Page title="Finances"><FinancesPage /></Page>} />
            <Route path="scolarite" element={<Page title="Scolarité"><TuitionFeesPage /></Page>} />
            <Route path="emploi-du-temps" element={<Page title="Emploi du temps"><SchedulePage /></Page>} />
            <Route path="absences" element={<Page title="Absences"><AbsencesPage /></Page>} />
            <Route path="annonces" element={<Page title="Annonces"><AnnouncementsPage /></Page>} />
            <Route path="statistiques" element={<Page title="Statistiques"><StatsPage /></Page>} />
            <Route path="calendrier" element={<Page title="Calendrier"><CalendarPage /></Page>} />
            <Route path="messagerie" element={<Page title="Messagerie"><MessagesPage /></Page>} />
            <Route path="bibliotheque" element={<Page title="Bibliothèque"><LibraryPage /></Page>} />
            <Route path="transport" element={<Page title="Transport"><TransportPage /></Page>} />
            <Route path="cantine" element={<Page title="Cantine"><CanteenPage /></Page>} />
            <Route path="historique" element={<Page title="Historique"><LogsPage /></Page>} />
            <Route path="administration" element={<Page title="Administration"><AdminPage /></Page>} />
            <Route path="mes-classes" element={<Page title="Mes classes"><ClassesPage /></Page>} />
            <Route path="mes-enfants" element={<Page title="Mes enfants"><ParentHomePage /></Page>} />
            <Route
              path="inscriptions"
              element={<Page title="Inscriptions"><InscriptionsPage /></Page>}
            />
            <Route
              path="parametres"
              element={<Page title="Paramètres de l'école"><SettingsPage /></Page>}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
