import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { IconPlus, IconClipboard } from "../../components/icons";
import EmptyState from "../../components/dashboard/EmptyState";
import FormField, { TextInput, Select } from "../../components/auth/FormField";

const STATUSES = ["Nouvelle demande", "En attente de documents", "Acceptée", "Refusée"];

const STATUS_STYLE = {
  "Nouvelle demande": "text-warning bg-warning-soft",
  "En attente de documents": "text-warning bg-warning-soft",
  "Acceptée": "text-success bg-success-soft",
  "Refusée": "text-danger bg-danger-soft",
};

export default function InscriptionsPage() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId;

  const [applications, setApplications] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [convertedId, setConvertedId] = useState(null);

  useEffect(() => {
    if (!schoolId) return;
    const unsubApps = onSnapshot(
      query(collection(db, "schools", schoolId, "applications"), orderBy("createdAt", "desc")),
      (snap) => {
        setApplications(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }
    );
    const unsubClasses = onSnapshot(collection(db, "schools", schoolId, "classes"), (snap) =>
      setClasses(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => {
      unsubApps();
      unsubClasses();
    };
  }, [schoolId]);

  async function updateStatus(app, status) {
    await updateDoc(doc(db, "schools", schoolId, "applications", app.id), { status });
  }

  async function handleDelete(app) {
    if (!window.confirm(`Supprimer la candidature de ${app.childName} ?`)) return;
    await deleteDoc(doc(db, "schools", schoolId, "applications", app.id));
  }

  async function convertToStudent(app) {
    setConvertedId(app.id);
    try {
      await addDoc(collection(db, "schools", schoolId, "students"), {
        fullName: app.childName,
        classLabel: app.desiredClass,
        birthDate: "",
        guardianName: app.parentName,
        guardianPhone: app.parentPhone,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "schools", schoolId, "applications", app.id), {
        status: "Acceptée",
        convertedToStudent: true,
      });
    } finally {
      setConvertedId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">
          {applications.length} candidature{applications.length > 1 ? "s" : ""}
        </p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-sm bg-indigo-500 text-white rounded-lg px-4 py-2"
        >
          <IconPlus className="w-4 h-4" />
          Nouvelle candidature
        </button>
      </div>

      {showForm && (
        <NewApplicationForm schoolId={schoolId} classes={classes} onDone={() => setShowForm(false)} />
      )}

      <div className="rounded-xl border border-line bg-surface">
        {!loading && applications.length === 0 ? (
          <EmptyState
            icon={IconClipboard}
            title="Aucune candidature en cours"
            text="Enregistrez ici les demandes d'inscription reçues, avant de les convertir en élèves une fois acceptées."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-soft">
                  <th className="px-6 py-3 font-medium">Enfant</th>
                  <th className="px-6 py-3 font-medium">Classe visée</th>
                  <th className="px-6 py-3 font-medium">Parent</th>
                  <th className="px-6 py-3 font-medium">Statut</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => (
                  <tr key={a.id} className="border-t border-line">
                    <td className="px-6 py-3 text-ink">{a.childName}</td>
                    <td className="px-6 py-3 text-ink-soft">{a.desiredClass || "—"}</td>
                    <td className="px-6 py-3 text-ink-soft">
                      {a.parentName}{a.parentPhone ? ` — ${a.parentPhone}` : ""}
                    </td>
                    <td className="px-6 py-3">
                      <select
                        value={a.status}
                        onChange={(e) => updateStatus(a, e.target.value)}
                        className={`text-xs rounded-md px-2 py-1 border-0 ${STATUS_STYLE[a.status] || ""}`}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        {!a.convertedToStudent && (
                          <button
                            onClick={() => convertToStudent(a)}
                            disabled={convertedId === a.id}
                            className="text-xs text-indigo-600 disabled:opacity-60"
                          >
                            {convertedId === a.id ? "..." : "Convertir en élève"}
                          </button>
                        )}
                        {a.convertedToStudent && (
                          <span className="text-xs text-ink-soft">Convertie</span>
                        )}
                        <button onClick={() => handleDelete(a)} className="text-xs text-danger">
                          Supprimer
                        </button>
                      </div>
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

function NewApplicationForm({ schoolId, classes, onDone }) {
  const [form, setForm] = useState({
    childName: "",
    desiredClass: "",
    parentName: "",
    parentPhone: "",
  });
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, "schools", schoolId, "applications"), {
        ...form,
        status: STATUSES[0],
        convertedToStudent: false,
        createdAt: serverTimestamp(),
      });
      setForm({ childName: "", desiredClass: "", parentName: "", parentPhone: "" });
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-surface p-6 flex flex-col gap-4">
      <h2 className="font-display text-base text-ink">Enregistrer une candidature</h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Nom de l'enfant">
          <TextInput required value={form.childName} onChange={update("childName")} />
        </FormField>
        <FormField label="Classe visée">
          {classes.length > 0 ? (
            <Select value={form.desiredClass} onChange={update("desiredClass")}>
              <option value="">Sélectionner une classe</option>
              {classes.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </Select>
          ) : (
            <TextInput value={form.desiredClass} onChange={update("desiredClass")} placeholder="Ex : CM2" />
          )}
        </FormField>
        <FormField label="Nom du parent">
          <TextInput required value={form.parentName} onChange={update("parentName")} />
        </FormField>
        <FormField label="Téléphone du parent">
          <TextInput value={form.parentPhone} onChange={update("parentPhone")} />
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
        <button type="button" onClick={onDone} className="text-sm text-ink-soft px-4 py-2.5">
          Annuler
        </button>
      </div>
    </form>
  );
}
