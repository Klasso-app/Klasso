import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateSchool } from "../../lib/schools";
import { logAction } from "../../lib/auditLog";
import { IconShield } from "../../components/icons";
import EmptyState from "../../components/dashboard/EmptyState";
import FormField, { TextInput } from "../../components/auth/FormField";

export default function SettingsPage() {
  const { profile, school, refreshSchool, firebaseUser } = useAuth();
  const canEdit = profile?.role === "directeur" || profile?.canEditSchoolSettings;

  const [form, setForm] = useState({
    name: school?.name || "",
    address: school?.address || "",
    city: school?.city || "",
    country: school?.country || "",
    phone: school?.phone || "",
    email: school?.email || "",
  });
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!canEdit) {
    return (
      <div className="rounded-xl border border-line bg-surface">
        <EmptyState
          icon={IconShield}
          title="Accès réservé"
          text="Seul le directeur ou un membre désigné peut modifier les informations de l'établissement."
        />
      </div>
    );
  }

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setSaved(false);
    try {
      await updateSchool(school.id, form);
      await refreshSchool();
      logAction(school.id, {
        actorUid: firebaseUser?.uid,
        actorName: profile?.name,
        action: "Modification des paramètres de l'école",
        details: form.name,
      });
      setSaved(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl">
      <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-surface p-6 flex flex-col gap-4">
        <h2 className="font-display text-base text-ink">Informations de l'établissement</h2>
        <p className="text-sm text-ink-soft -mt-2">
          Ces informations apparaissent sur les bulletins et documents officiels.
        </p>

        <FormField label="Nom de l'établissement">
          <TextInput required value={form.name} onChange={update("name")} />
        </FormField>

        <FormField label="Adresse">
          <TextInput value={form.address} onChange={update("address")} />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Ville">
            <TextInput value={form.city} onChange={update("city")} />
          </FormField>
          <FormField label="Pays">
            <TextInput value={form.country} onChange={update("country")} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Téléphone">
            <TextInput value={form.phone} onChange={update("phone")} />
          </FormField>
          <FormField label="E-mail de contact">
            <TextInput type="email" value={form.email} onChange={update("email")} />
          </FormField>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <button
            type="submit"
            disabled={submitting}
            className="text-sm bg-indigo-500 text-white rounded-lg px-4 py-2.5 disabled:opacity-60"
          >
            {submitting ? "Enregistrement" : "Enregistrer"}
          </button>
          {saved && <span className="text-sm text-success">Informations enregistrées</span>}
        </div>
      </form>
    </div>
  );
}
