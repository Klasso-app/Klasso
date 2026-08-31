import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "./ui/Loader";

export default function ProtectedRoute({ children }) {
  const { firebaseUser, loading } = useAuth();

  if (loading) return <Loader label="Vérification de votre session" />;
  if (!firebaseUser) return <Navigate to="/connexion" replace />;

  return children;
}
