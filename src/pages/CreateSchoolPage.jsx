import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { createSchoolAndDirector } from "../lib/schools";
import KlassoLogo from "../components/ui/KlassoLogo";
import FormField, { TextInput } from "../components/auth/FormField";

export default function CreateSchoolPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    schoolName: "",
    directorName: "",
    city: "",
    country: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setSubmitting(true);
    let cred;
    try {
      cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
    } catch (err) {
      setSubmitting(false);
      setError(
        err.code === "auth/email-already-in-use"
          ? "Cette adresse e-mail est déjà utilisée."
          : "Impossible de créer le compte. Merci de réessayer."
      );
      return;
    }

    try {
      await createSchoolAndDirector({
        uid: cred.user.uid,
        schoolName: form.schoolName,
        city: form.city,
        country: form.country,
        directorName: form.directorName,
        email: form.email,
      });
      navigate("/app");
    } catch (err) {
      // La création du compte a réussi mais l'enregistrement de l'école a
      // échoué (ex : règles Firestore non publiées). On supprime le compte
      // fraîchement créé pour éviter un compte "orphelin" sans profil, et on
      // laisse la personne réessayer proprement.
      console.error("Erreur lors de la création de l'établissement :", err);
      try {
        await cred.user.delete();
      } catch (cleanupErr) {
        console.error("Nettoyage du compte impossible :", cleanupErr);
      }
      setError(
        err.code === "permission-denied"
          ? "L'accès à la base de données a été refusé. Les règles de sécurité Firestore ne sont probablement pas encore publiées. Votre compte n'a pas été créé, vous pouvez réessayer une fois les règles publiées."
          : "Une erreur est survenue pendant la création de l'établissement. Votre compte n'a pas été créé, vous pouvez réessayer."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-tint px-5 py-10">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <KlassoLogo size={38} />
        </div>

        <div className="rounded-2xl border border-line bg-surface p-7">
          <h1 className="font-display text-xl text-ink">Créer votre espace établissement</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Ce compte sera celui du directeur, avec accès complet aux
            paramètres de l'école.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <FormField label="Nom de l'établissement">
              <TextInput
                required
                value={form.schoolName}
                onChange={update("schoolName")}
                placeholder="Groupe Scolaire Étoile"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Ville">
                <TextInput value={form.city} onChange={update("city")} placeholder="Abidjan" />
              </FormField>
              <FormField label="Pays">
                <TextInput value={form.country} onChange={update("country")} placeholder="Côte d'Ivoire" />
              </FormField>
            </div>

            <FormField label="Votre nom (directeur ou directrice)">
              <TextInput
                required
                value={form.directorName}
                onChange={update("directorName")}
                placeholder="Nom complet"
              />
            </FormField>

            <FormField label="Adresse e-mail">
              <TextInput
                type="email"
                required
                value={form.email}
                onChange={update("email")}
                placeholder="vous@ecole.com"
              />
            </FormField>

            <FormField label="Mot de passe">
              <TextInput
                type="password"
                required
                value={form.password}
                onChange={update("password")}
                placeholder="6 caractères minimum"
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
              {submitting ? "Création en cours" : "Créer l'espace établissement"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-ink-soft">
          Vous avez déjà un compte ?{" "}
          <Link to="/connexion" className="text-indigo-500 font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
