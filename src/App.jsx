import { useEffect, useState } from "react";
import LandingPage from "./pages/LandingPage";
import Loader from "./components/ui/Loader";

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <Loader label="Chargement de Klasso" />;

  return <LandingPage />;
}
