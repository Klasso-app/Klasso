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
import FormField, { TextInput } from "../../components/auth/FormField";

export default function TeachersPage() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId;

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    if (!schoolId) return;
    const q = query(
      collection(db, "schools", schoolId, "teachers"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setTeachers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [schoolId]);

  async function handleDelete(teacher) {
    if (!window.confirm(`Supprimer ${teacher.fullName} de la liste des enseignants ?`)) return;
    await deleteDoc(doc(db, "schools", schoolId, "teachers", teacher.id));
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">
          {teachers.length} enseignant{teachers.length > 1 ? "s" : ""}
        </p>
        <button
          onClick={() => { setEditing(null); setShowForm((v) => !v); }}
          className="flex items-center gap-1.5 text-sm bg-indigo-500 text-white rounded-lg px-4 py-2"
        >
          <IconPlus className="w-4 h-4" />
          Nouvel enseignant
        </button>
      </div>

      {(showForm || editing) && (
        <TeacherForm schoolId={schoolId} editing={editing} onDone={closeForm} />
      )}

      <div className="rounded-xl border border-line bg-surface">
        {!loading && teachers.length === 0 ? (
          <EmptyState
            icon={IconClipboard}
            title="Aucun enseignant enregistré"
            text="Ajoutez vos enseignants pour pouvoir ensuite les affecter à des classes et matières."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-soft">
                  <th className="px-6 py-3 font-medium">Nom</th>
                  <th className="px-6 py-3 font-medium">Matière(s)</th>
                  <th className="px-6 py-3 font-medium">Téléphone</th>
                  <th className="px-6 py-3 font-medium">E-mail</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t.id} className="border-t border-line">
                    <td className="px-6 py-3 text-ink">{t.fullName}</td>
                    <td className="px-6 py-3 text-ink-soft">{t.subjects || "—"}</td>
                    <td className="px-6 py-3 text-ink-soft">{t.phone || "—"}</td>
                    <td className="px-6 py-3 text-ink-soft">{t.email || "—"}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => { setShowForm(false); setEditing(t); }}
                          className="text-xs text-indigo-600"
                        >
                          Modifier
                        </button>
                        <button onClick={() => handleDelete(t)} className="text-xs text-danger">
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

function TeacherForm({ schoolId, editing, onDone }) {
  const [form, setForm] = useState({
    fullName: editing?.fullName || "",
    subjects: editing?.subjects || "",
    phone: editing?.phone || "",
    email: editing?.email || "",
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
        await updateDoc(doc(db, "schools", schoolId, "teachers", editing.id), form);
      } else {
        await addDoc(collection(db, "schools", schoolId, "teachers"), {
          ...form,
          createdAt: serverTimestamp(),
        });
      }
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-surface p-6 flex flex-col gap-4">
      <h2 className="font-display text-base text-ink">
        {editing ? "Modifier l'enseignant" : "Ajouter un enseignant"}
      </h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Nom complet">
          <TextInput required value={form.fullName} onChange={update("fullName")} />
        </FormField>
        <FormField label="Matière(s) enseignée(s)">
          <TextInput
            value={form.subjects}
            onChange={update("subjects")}
            placeholder="Ex : Mathématiques, Physique"
          />
        </FormField>
        <FormField label="Téléphone">
          <TextInput value={form.phone} onChange={update("phone")} />
        </FormField>
        <FormField label="E-mail">
          <TextInput type="email" value={form.email} onChange={update("email")} />
        </FormField>
      </div>

      <div className="flex items-center gap-3 mt-2">
        <button
          type="submit"
          disabled={submitting}
          className="text-sm bg-indigo-500 text-white rounded-lg px-4 py-2.5 disabled:opacity-60"
        >
          {submitting ? "Enregistrement" : editing ? "Enregistrer les modifications" : "Enregistrer"}
        </button>
        <button type="button" onClick={onDone} className="text-sm text-ink-soft px-4 py-2.5">
          Annuler
        </button>
      </div>
    </form>
  );
}
