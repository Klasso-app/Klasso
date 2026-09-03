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
import { seedDefaultSubjects } from "../../lib/subjects";
import { IconPlus, IconChart } from "../../components/icons";
import EmptyState from "../../components/dashboard/EmptyState";
import FormField, { TextInput, Select } from "../../components/auth/FormField";

const CYCLES = ["Collège", "Lycée", "Les deux"];

export default function SubjectsPage() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId;

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    const q = query(collection(db, "schools", schoolId, "subjects"), orderBy("name", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setSubjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [schoolId]);

  async function handleSeed() {
    setSeeding(true);
    try {
      await seedDefaultSubjects(schoolId);
    } finally {
      setSeeding(false);
    }
  }

  async function handleDelete(subject) {
    if (!window.confirm(`Retirer « ${subject.name} » de la liste des matières ?`)) return;
    await deleteDoc(doc(db, "schools", schoolId, "subjects", subject.id));
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          {subjects.length} matière{subjects.length > 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-2">
          {subjects.length === 0 && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="text-xs text-indigo-600 border border-indigo-200 rounded-md px-3 py-2 disabled:opacity-60"
            >
              {seeding ? "Chargement..." : "Charger la liste type (Bénin)"}
            </button>
          )}
          <button
            onClick={() => { setEditing(null); setShowForm((v) => !v); }}
            className="flex items-center gap-1.5 text-sm bg-indigo-500 text-white rounded-lg px-4 py-2"
          >
            <IconPlus className="w-4 h-4" />
            Nouvelle matière
          </button>
        </div>
      </div>

      {(showForm || editing) && (
        <SubjectForm schoolId={schoolId} editing={editing} onDone={closeForm} />
      )}

      <div className="rounded-xl border border-line bg-surface">
        {!loading && subjects.length === 0 ? (
          <EmptyState
            icon={IconChart}
            title="Aucune matière enregistrée"
            text="Chargez la liste type des matières enseignées au Bénin, puis ajustez-la selon votre établissement, ou ajoutez vos matières une par une."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-soft">
                  <th className="px-6 py-3 font-medium">Matière</th>
                  <th className="px-6 py-3 font-medium">Cycle</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s.id} className="border-t border-line">
                    <td className="px-6 py-3 text-ink">{s.name}</td>
                    <td className="px-6 py-3 text-ink-soft">{s.cycle || "—"}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <button onClick={() => { setShowForm(false); setEditing(s); }} className="text-xs text-indigo-600">
                          Modifier
                        </button>
                        <button onClick={() => handleDelete(s)} className="text-xs text-danger">
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

function SubjectForm({ schoolId, editing, onDone }) {
  const [form, setForm] = useState({
    name: editing?.name || "",
    cycle: editing?.cycle || CYCLES[2],
  });
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await updateDoc(doc(db, "schools", schoolId, "subjects", editing.id), form);
      } else {
        await addDoc(collection(db, "schools", schoolId, "subjects"), { ...form, createdAt: serverTimestamp() });
      }
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-surface p-6 flex flex-col gap-4">
      <h2 className="font-display text-base text-ink">{editing ? "Modifier la matière" : "Ajouter une matière"}</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Nom de la matière">
          <TextInput required value={form.name} onChange={update("name")} placeholder="Ex : Mathématiques" />
        </FormField>
        <FormField label="Cycle concerné">
          <Select value={form.cycle} onChange={update("cycle")}>
            {CYCLES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </FormField>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={submitting} className="text-sm bg-indigo-500 text-white rounded-lg px-4 py-2.5 disabled:opacity-60">
          {submitting ? "Enregistrement" : editing ? "Enregistrer les modifications" : "Ajouter"}
        </button>
        <button type="button" onClick={onDone} className="text-sm text-ink-soft px-4 py-2.5">Annuler</button>
      </div>
    </form>
  );
}
