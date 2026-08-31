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
import RoleHomePage from "./pages/RoleHomePage";
import StudentsPage from "./pages/dashboard/StudentsPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import ComingSoonPage from "./pages/dashboard/ComingSoonPage";
import { IconClipboard, IconLayers, IconWallet, IconChart, IconCalendar, IconUsers } from "./components/icons";

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
            <Route
              path="enseignants"
              element={<Page title="Enseignants"><ComingSoonPage icon={IconClipboard} title="Gestion des enseignants" /></Page>}
            />
            <Route
              path="classes"
              element={<Page title="Classes"><ComingSoonPage icon={IconLayers} title="Gestion des classes" /></Page>}
            />
            <Route
              path="finances"
              element={<Page title="Finances"><ComingSoonPage icon={IconWallet} title="Suivi des frais de scolarité" /></Page>}
            />
            <Route
              path="inscriptions"
              element={<Page title="Inscriptions"><ComingSoonPage icon={IconClipboard} title="Suivi des inscriptions" /></Page>}
            />
            <Route
              path="mes-classes"
              element={<Page title="Mes classes"><ComingSoonPage icon={IconLayers} title="Vos classes" /></Page>}
            />
            <Route
              path="notes"
              element={<Page title="Notes"><ComingSoonPage icon={IconChart} title="Saisie des notes" /></Page>}
            />
            <Route
              path="emploi-du-temps"
              element={<Page title="Emploi du temps"><ComingSoonPage icon={IconCalendar} title="Emploi du temps" /></Page>}
            />
            <Route
              path="mes-enfants"
              element={<Page title="Mes enfants"><ComingSoonPage icon={IconUsers} title="Vos enfants" /></Page>}
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
