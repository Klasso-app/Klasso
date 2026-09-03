import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { getInvitation, markInvitationUsed } from "../lib/invitations";
import KlassoLogo from "../components/ui/KlassoLogo";
import FormField, { TextInput } from "../components/auth/FormField";

export default function JoinAsParentPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ code: "", name: "", email: "", password: "" });
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
      // Le compte doit être créé AVANT de lire l'invitation : nos règles
      // Firestore exigent d'être connecté pour lire un code (afin d'éviter
      // qu'un visiteur non identifié puisse essayer des codes au hasard).
      cred = await createUserWithEmailAndPassword(auth, form.email, form.password);

      const invitation = await getInvitation(form.code);

      if (!invitation) {
        setError("Ce code d'invitation est introuvable. Vérifiez-le auprès de l'école.");
        await cred.user.delete();
        setSubmitting(false);
        return;
      }
      if (invitation.used) {
        setError("Ce code d'invitation a déjà été utilisé.");
        await cred.user.delete();
        setSubmitting(false);
        return;
      }

      await setDoc(doc(db, "users", cred.user.uid), {
        name: form.name,
        email: form.email,
        role: "parent",
        schoolId: invitation.schoolId,
        parentOf: [invitation.studentId],
        createdAt: serverTimestamp(),
      });

      await markInvitationUsed(form.code, cred.user.uid);
      navigate("/app");
    } catch (err) {
      console.error(err);
      if (cred) {
        try { await cred.user.delete(); } catch {}
      }
      setError(
        err.code === "auth/email-already-in-use"
          ? "Cette adresse e-mail est déjà utilisée."
          : `Une erreur est survenue. Vérifiez le code et réessayez. (${err.code || err.message})`
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-tint px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <KlassoLogo size={38} />
        </div>

        <div className="rounded-2xl border border-line bg-surface p-7">
          <h1 className="font-display text-xl text-ink">Rejoindre en tant que parent</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Utilisez le code d'invitation fourni par l'établissement de votre enfant.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <FormField label="Code d'invitation">
              <TextInput
                required
                value={form.code}
                onChange={update("code")}
                placeholder="Ex : X7K2QM"
                className="uppercase"
              />
            </FormField>

            <FormField label="Votre nom">
              <TextInput required value={form.name} onChange={update("name")} />
            </FormField>

            <FormField label="Adresse e-mail">
              <TextInput type="email" required value={form.email} onChange={update("email")} />
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
              <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full bg-indigo-500 text-white text-sm font-medium py-2.5 rounded-lg disabled:opacity-60"
            >
              {submitting ? "Création du compte" : "Créer mon compte parent"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-ink-soft">
          Vous avez déjà un compte ?{" "}
          <Link to="/connexion" className="text-indigo-500 font-medium">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
