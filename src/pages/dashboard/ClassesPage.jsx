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
import { logAction } from "../../lib/auditLog";
import { LEVELS, CLASS_NAMES_BY_LEVEL } from "../../lib/schoolLevels";
import { IconPlus, IconLayers } from "../../components/icons";
import EmptyState from "../../components/dashboard/EmptyState";
import FormField, { Select } from "../../components/auth/FormField";

export default function ClassesPage() {
  const { profile, firebaseUser } = useAuth();
  const schoolId = profile?.schoolId;

  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    if (!schoolId) return;

    const unsubClasses = onSnapshot(
      query(collection(db, "schools", schoolId, "classes"), orderBy("createdAt", "desc")),
      (snap) => {
        setClasses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }
    );
    const unsubTeachers = onSnapshot(
      collection(db, "schools", schoolId, "teachers"),
      (snap) => setTeachers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubStudents = onSnapshot(
      collection(db, "schools", schoolId, "students"),
      (snap) => setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubClasses();
      unsubTeachers();
      unsubStudents();
    };
  }, [schoolId]);

  function studentCount(className) {
    return students.filter((s) => s.classLabel === className).length;
  }

  async function handleDelete(klass) {
    const count = studentCount(klass.name);
    const message = count > 0
      ? `${count} élève(s) sont actuellement dans « ${klass.name} ». Supprimer la classe ne supprime pas ces élèves, mais elle n'apparaîtra plus dans les listes. Continuer ?`
      : `Supprimer la classe « ${klass.name} » ?`;
    if (!window.confirm(message)) return;
    await deleteDoc(doc(db, "schools", schoolId, "classes", klass.id));
    logAction(schoolId, {
      actorUid: firebaseUser?.uid,
      actorName: profile?.name,
      action: "Suppression d'une classe",
      details: klass.name,
    });
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">
          {classes.length} classe{classes.length > 1 ? "s" : ""}
        </p>
        <button
          onClick={() => { setEditing(null); setShowForm((v) => !v); }}
          className="flex items-center gap-1.5 text-sm bg-indigo-500 text-white rounded-lg px-4 py-2"
        >
          <IconPlus className="w-4 h-4" />
          Nouvelle classe
        </button>
      </div>

      {(showForm || editing) && (
        <ClassForm schoolId={schoolId} teachers={teachers} editing={editing} onDone={closeForm} />
      )}

      <div className="rounded-xl border border-line bg-surface">
        {!loading && classes.length === 0 ? (
          <EmptyState
            icon={IconLayers}
            title="Aucune classe créée"
            text="Créez vos classes (ex : CP, CM2, 6ème A) pour pouvoir y inscrire des élèves et affecter des enseignants."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-soft">
                  <th className="px-6 py-3 font-medium">Classe</th>
                  <th className="px-6 py-3 font-medium">Niveau</th>
                  <th className="px-6 py-3 font-medium">Enseignant principal</th>
                  <th className="px-6 py-3 font-medium">Effectif</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {classes.map((c) => (
                  <tr key={c.id} className="border-t border-line">
                    <td className="px-6 py-3 text-ink">{c.name}</td>
                    <td className="px-6 py-3 text-ink-soft">{c.level || "—"}</td>
                    <td className="px-6 py-3 text-ink-soft">{c.headTeacherName || "—"}</td>
                    <td className="px-6 py-3 text-ink-soft">{studentCount(c.name)}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => { setShowForm(false); setEditing(c); }}
                          className="text-xs text-indigo-600"
                        >
                          Modifier
                        </button>
                        <button onClick={() => handleDelete(c)} className="text-xs text-danger">
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

function ClassForm({ schoolId, teachers, editing, onDone }) {
  const [form, setForm] = useState({
    name: editing?.name || "",
    level: editing?.level || "",
    headTeacherId: editing?.headTeacherId || "",
  });
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const headTeacher = teachers.find((t) => t.id === form.headTeacherId);
      const payload = {
        name: form.name,
        level: form.level,
        headTeacherId: form.headTeacherId || null,
        headTeacherName: headTeacher?.fullName || "",
      };
      if (editing) {
        await updateDoc(doc(db, "schools", schoolId, "classes", editing.id), payload);
      } else {
        await addDoc(collection(db, "schools", schoolId, "classes"), {
          ...payload,
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
        {editing ? "Modifier la classe" : "Créer une classe"}
      </h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Niveau">
          <Select
            required
            value={form.level}
            onChange={(e) => setForm((f) => ({ ...f, level: e.target.value, name: "" }))}
          >
            <option value="">Sélectionner un niveau</option>
            {LEVELS.map((lvl) => <option key={lvl} value={lvl}>{lvl}</option>)}
            {form.level && !LEVELS.includes(form.level) && (
              <option value={form.level}>{form.level}</option>
            )}
          </Select>
        </FormField>
        <FormField label="Classe">
          <Select
            required
            value={form.name}
            onChange={update("name")}
            disabled={!form.level}
          >
            <option value="">
              {form.level ? "Sélectionner une classe" : "Choisissez d'abord un niveau"}
            </option>
            {(CLASS_NAMES_BY_LEVEL[form.level] || []).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
            {form.name && !(CLASS_NAMES_BY_LEVEL[form.level] || []).includes(form.name) && (
              <option value={form.name}>{form.name}</option>
            )}
          </Select>
        </FormField>
        <FormField label="Enseignant principal">
          <Select value={form.headTeacherId} onChange={update("headTeacherId")}>
            <option value="">Aucun pour le moment</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.fullName}</option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="flex items-center gap-3 mt-2">
        <button
          type="submit"
          disabled={submitting}
          className="text-sm bg-indigo-500 text-white rounded-lg px-4 py-2.5 disabled:opacity-60"
        >
          {submitting ? "Enregistrement" : editing ? "Enregistrer les modifications" : "Créer la classe"}
        </button>
        <button type="button" onClick={onDone} className="text-sm text-ink-soft px-4 py-2.5">
          Annuler
        </button>
      </div>
    </form>
  );
}
