import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateSchool, uploadSchoolLogo } from "../../lib/schools";
import { exportSchoolBackup } from "../../lib/backup";
import { logAction } from "../../lib/auditLog";
import { IconShield, IconFile } from "../../components/icons";
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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState("");
  const [backupStep, setBackupStep] = useState("");
  const [backupResult, setBackupResult] = useState(null);
  const [backupError, setBackupError] = useState("");

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

  async function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setLogoError("Merci de choisir un fichier image (PNG ou JPG).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError("L'image ne doit pas dépasser 2 Mo.");
      return;
    }

    setLogoError("");
    setUploadingLogo(true);
    try {
      await uploadSchoolLogo(school.id, file);
      await refreshSchool();
    } catch (err) {
      console.error(err);
      setLogoError("Le téléversement a échoué. Vérifiez votre connexion et réessayez.");
    } finally {
      setUploadingLogo(false);
    }
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

  async function handleBackup() {
    setBackupError("");
    setBackupResult(null);
    setBackupStep("Préparation...");
    try {
      const result = await exportSchoolBackup(school.id, school.name, (name) => setBackupStep(`Export : ${name}...`));
      setBackupResult(result);
      logAction(school.id, {
        actorUid: firebaseUser?.uid,
        actorName: profile?.name,
        action: "Export d'une sauvegarde complète",
        details: `${result.totalDocs} document(s)`,
      });
    } catch (err) {
      console.error(err);
      setBackupError("L'export a échoué. Vérifiez votre connexion et réessayez.");
    } finally {
      setBackupStep("");
    }
  }

  return (
    <div className="max-w-xl flex flex-col gap-6">
      <div className="rounded-xl border border-line bg-surface p-6 flex flex-col gap-4">
        <div>
          <h2 className="font-display text-base text-ink">Logo de l'établissement</h2>
          <p className="text-sm text-ink-soft mt-1">
            Ce logo apparaît sur les bulletins, les reçus de paiement, et dans la barre latérale
            de l'application. Format PNG ou JPG, 2 Mo maximum.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg border border-line bg-surface-tint flex items-center justify-center overflow-hidden shrink-0">
            {school?.logoUrl ? (
              <img src={school.logoUrl} alt="Logo de l'établissement" className="w-full h-full object-contain" />
            ) : (
              <IconFile className="w-6 h-6 text-ink-soft" />
            )}
          </div>

          <label className="text-sm text-indigo-600 border border-indigo-200 rounded-lg px-4 py-2 cursor-pointer">
            {uploadingLogo ? "Envoi en cours..." : school?.logoUrl ? "Changer le logo" : "Ajouter un logo"}
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleLogoChange}
              disabled={uploadingLogo}
              className="hidden"
            />
          </label>
        </div>

        {logoError && (
          <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{logoError}</p>
        )}
      </div>

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

      <div className="rounded-xl border border-line bg-surface p-6 flex flex-col gap-4">
        <div>
          <h2 className="font-display text-base text-ink">Sauvegarde complète</h2>
          <p className="text-sm text-ink-soft mt-1">
            Télécharge un fichier unique contenant toutes les données de l'école (élèves, enseignants,
            notes, finances, messages...), pour garder une copie de sécurité de votre côté.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleBackup}
            disabled={!!backupStep}
            className="flex items-center gap-1.5 text-sm border border-indigo-200 text-indigo-600 rounded-lg px-4 py-2.5 disabled:opacity-60"
          >
            <IconFile className="w-4 h-4" />
            {backupStep || "Télécharger une sauvegarde"}
          </button>
          {backupResult && (
            <span className="text-sm text-success">{backupResult.totalDocs} document(s) exportés</span>
          )}
        </div>

        {backupError && (
          <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{backupError}</p>
        )}

        <p className="text-xs text-ink-soft">
          Ce fichier contient des informations personnelles (élèves, tuteurs, paiements...) : gardez-le
          privé et supprimez-le de vos téléchargements une fois mis en lieu sûr.
        </p>
      </div>
    </div>
  );
}
