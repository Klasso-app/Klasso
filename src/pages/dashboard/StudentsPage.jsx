import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { IconPlus, IconUsers } from "../../components/icons";
import EmptyState from "../../components/dashboard/EmptyState";
import FormField, { TextInput } from "../../components/auth/FormField";

export default function StudentsPage() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId;

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    const q = query(
      collection(db, "schools", schoolId, "students"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [schoolId]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">
          {students.length} élève{students.length > 1 ? "s" : ""} inscrit{students.length > 1 ? "s" : ""}
        </p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-sm bg-indigo-500 text-white rounded-lg px-4 py-2"
        >
          <IconPlus className="w-4 h-4" />
          Nouvel élève
        </button>
      </div>

      {showForm && (
        <NewStudentForm schoolId={schoolId} onDone={() => setShowForm(false)} />
      )}

      <div className="rounded-xl border border-line bg-surface">
        {!loading && students.length === 0 ? (
          <EmptyState
            icon={IconUsers}
            title="Aucun élève inscrit"
            text="Utilisez le bouton « Nouvel élève » pour commencer les inscriptions de votre établissement."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-soft">
                  <th className="px-6 py-3 font-medium">Nom complet</th>
                  <th className="px-6 py-3 font-medium">Classe</th>
                  <th className="px-6 py-3 font-medium">Date de naissance</th>
                  <th className="px-6 py-3 font-medium">Contact tuteur</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-t border-line">
                    <td className="px-6 py-3 text-ink">{s.fullName}</td>
                    <td className="px-6 py-3 text-ink-soft">{s.classLabel || "—"}</td>
                    <td className="px-6 py-3 text-ink-soft">{s.birthDate || "—"}</td>
                    <td className="px-6 py-3 text-ink-soft">{s.guardianPhone || "—"}</td>
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

function NewStudentForm({ schoolId, onDone }) {
  const [form, setForm] = useState({
    fullName: "",
    classLabel: "",
    birthDate: "",
    guardianName: "",
    guardianPhone: "",
  });
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, "schools", schoolId, "students"), {
        ...form,
        createdAt: serverTimestamp(),
      });
      setForm({ fullName: "", classLabel: "", birthDate: "", guardianName: "", guardianPhone: "" });
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-line bg-surface p-6 flex flex-col gap-4"
    >
      <h2 className="font-display text-base text-ink">Inscrire un élève</h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Nom complet de l'élève">
          <TextInput required value={form.fullName} onChange={update("fullName")} />
        </FormField>
        <FormField label="Classe">
          <TextInput
            required
            value={form.classLabel}
            onChange={update("classLabel")}
            placeholder="Ex : CM2, 6ème A"
          />
        </FormField>
        <FormField label="Date de naissance">
          <TextInput type="date" value={form.birthDate} onChange={update("birthDate")} />
        </FormField>
        <FormField label="Nom du tuteur">
          <TextInput value={form.guardianName} onChange={update("guardianName")} />
        </FormField>
        <FormField label="Téléphone du tuteur">
          <TextInput value={form.guardianPhone} onChange={update("guardianPhone")} />
        </FormField>
      </div>

      <div className="flex items-center gap-3 mt-2">
        <button
          type="submit"
          disabled={submitting}
          className="text-sm bg-indigo-500 text-white rounded-lg px-4 py-2.5 disabled:opacity-60"
        >
          {submitting ? "Enregistrement" : "Enregistrer l'élève"}
        </button>
        <button type="button" onClick={onDone} className="text-sm text-ink-soft px-4 py-2.5">
          Annuler
        </button>
      </div>
    </form>
  );
}
