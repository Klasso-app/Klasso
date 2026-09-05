import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { createStaffAccount, fetchSchoolStaff, revokeStaffAccess } from "../../lib/staffAccounts";
import { IconPlus, IconShield, IconUserCircle } from "../../components/icons";
import EmptyState from "../../components/dashboard/EmptyState";
import FormField, { TextInput, Select } from "../../components/auth/FormField";

const ROLES = [
  { value: "secretaire", label: "Secrétaire" },
  { value: "directeur", label: "Directeur" },
];

function roleLabel(role) {
  return ROLES.find((r) => r.value === role)?.label || role;
}

export default function AdminPage() {
  const { profile, firebaseUser } = useAuth();
  const schoolId = profile?.schoolId;

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function loadStaff() {
    setLoading(true);
    try {
      const list = await fetchSchoolStaff(schoolId);
      setStaff(list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (schoolId) loadStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  async function handleRevoke(member) {
    if (member.id === firebaseUser?.uid) {
      window.alert("Vous ne pouvez pas révoquer votre propre accès depuis cette page.");
      return;
    }
    if (!window.confirm(`Retirer l'accès de ${member.name} à Klasso ?`)) return;
    await revokeStaffAccess(member.id);
    await loadStaff();
  }

  if (profile?.role !== "directeur") {
    return (
      <div className="rounded-xl border border-line bg-surface">
        <EmptyState
          icon={IconShield}
          title="Accès réservé"
          text="La gestion des comptes du personnel administratif est réservée au directeur."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-ink-soft max-w-lg">
        Créez ici les comptes du personnel administratif — secrétaire, ou un autre directeur
        (par exemple un responsable par niveau : maternelle, primaire, secondaire). Les
        enseignants se créent depuis le module Enseignants.
      </p>

      <div className="flex items-center justify-end">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-sm bg-indigo-500 text-white rounded-lg px-4 py-2"
        >
          <IconPlus className="w-4 h-4" />
          Nouveau compte
        </button>
      </div>

      {showForm && (
        <NewStaffForm
          schoolId={schoolId}
          onDone={() => { setShowForm(false); loadStaff(); }}
        />
      )}

      <div className="rounded-xl border border-line bg-surface">
        {!loading && staff.length === 0 ? (
          <EmptyState
            icon={IconUserCircle}
            title="Aucun membre du personnel administratif"
            text="Utilisez le bouton « Nouveau compte » pour ajouter une secrétaire ou un autre directeur."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-soft">
                  <th className="px-6 py-3 font-medium">Nom</th>
                  <th className="px-6 py-3 font-medium">E-mail</th>
                  <th className="px-6 py-3 font-medium">Rôle</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {staff.map((m) => (
                  <tr key={m.id} className="border-t border-line">
                    <td className="px-6 py-3 text-ink">
                      {m.name}
                      {m.id === firebaseUser?.uid && (
                        <span className="text-xs text-ink-soft ml-2">(vous)</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-ink-soft">{m.email}</td>
                    <td className="px-6 py-3 text-ink-soft">{roleLabel(m.role)}</td>
                    <td className="px-6 py-3">
                      {m.id !== firebaseUser?.uid && (
                        <button onClick={() => handleRevoke(m)} className="text-xs text-danger">
                          Révoquer l'accès
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function NewStaffForm({ schoolId, onDone }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "secretaire" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess(null);

    if (form.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setSubmitting(true);
    try {
      await createStaffAccount({ schoolId, ...form });
      setSuccess({ email: form.email, password: form.password });
      setForm({ name: "", email: "", password: "", role: "secretaire" });
      onDone();
    } catch (err) {
      console.error(err);
      setError(
        err.code === "auth/email-already-in-use"
          ? "Cette adresse e-mail est déjà utilisée."
          : err.code === "auth/password-does-not-meet-requirements"
          ? "Le mot de passe ne respecte pas les exigences de sécurité : au moins 8 caractères, avec une majuscule, une minuscule et un chiffre."
          : `Une erreur est survenue. (${err.code || err.message})`
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-surface p-6 flex flex-col gap-4">
      <h2 className="font-display text-base text-ink">Créer un compte</h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Nom complet">
          <TextInput required value={form.name} onChange={update("name")} />
        </FormField>
        <FormField label="Rôle">
          <Select value={form.role} onChange={update("role")}>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </Select>
        </FormField>
        <FormField label="Adresse e-mail">
          <TextInput required type="email" value={form.email} onChange={update("email")} />
        </FormField>
        <FormField label="Mot de passe initial">
          <TextInput
            required
            type="password"
            value={form.password}
            onChange={update("password")}
            placeholder="8 caractères min., avec majuscule et chiffre"
          />
        </FormField>
      </div>

      <p className="text-xs text-ink-soft -mt-2">
        Communiquez ces identifiants à la personne concernée en dehors de l'application
        (téléphone, message).
      </p>

      {error && (
        <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex items-center gap-3 mt-2">
        <button type="submit" disabled={submitting} className="text-sm bg-indigo-500 text-white rounded-lg px-4 py-2.5 disabled:opacity-60">
          {submitting ? "Création" : "Créer le compte"}
        </button>
      </div>
    </form>
  );
}
