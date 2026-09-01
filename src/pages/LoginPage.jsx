import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import KlassoLogo from "../components/ui/KlassoLogo";
import FormField, { TextInput } from "../components/auth/FormField";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/app");
    } catch (err) {
      setError("Identifiants incorrects. Vérifiez votre e-mail et votre mot de passe.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-tint px-5">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <KlassoLogo size={38} />
        </div>

        <div className="rounded-2xl border border-line bg-surface p-7">
          <h1 className="font-display text-xl text-ink">Connexion</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Accédez à l'espace de votre établissement.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <FormField label="Adresse e-mail">
              <TextInput
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@ecole.com"
              />
            </FormField>

            <FormField label="Mot de passe">
              <TextInput
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </FormField>

            {error && (
              <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full bg-indigo-500 text-white text-sm font-medium py-2.5 rounded-lg disabled:opacity-60"
            >
              {submitting ? "Connexion en cours" : "Se connecter"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-ink-soft">
          Votre établissement n'a pas encore de compte ?{" "}
          <Link to="/creer-etablissement" className="text-indigo-500 font-medium">
            Créer un espace établissement
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-ink-soft">
          Vous êtes parent d'élève ?{" "}
          <Link to="/rejoindre-parent" className="text-indigo-500 font-medium">
            Rejoindre avec un code
          </Link>
        </p>
      </div>
    </div>
  );
}
