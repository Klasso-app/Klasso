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
import { IconPlus, IconCalendar } from "../../components/icons";
import EmptyState from "../../components/dashboard/EmptyState";
import FormField, { TextInput, Select } from "../../components/auth/FormField";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export default function SchedulePage() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId;

  const [slots, setSlots] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    const unsubSlots = onSnapshot(
      query(collection(db, "schools", schoolId, "schedule"), orderBy("day"), orderBy("startTime")),
      (snap) => {
        setSlots(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }
    );
    const unsubClasses = onSnapshot(collection(db, "schools", schoolId, "classes"), (snap) =>
      setClasses(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubTeachers = onSnapshot(collection(db, "schools", schoolId, "teachers"), (snap) =>
      setTeachers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => {
      unsubSlots();
      unsubClasses();
      unsubTeachers();
    };
  }, [schoolId]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">
          {slots.length} créneau{slots.length > 1 ? "x" : ""} programmé{slots.length > 1 ? "s" : ""}
        </p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-sm bg-indigo-500 text-white rounded-lg px-4 py-2"
        >
          <IconPlus className="w-4 h-4" />
          Nouveau créneau
        </button>
      </div>

      {showForm && (
        <NewSlotForm
          schoolId={schoolId}
          classes={classes}
          teachers={teachers}
          onDone={() => setShowForm(false)}
        />
      )}

      <div className="rounded-xl border border-line bg-surface">
        {!loading && slots.length === 0 ? (
          <EmptyState
            icon={IconCalendar}
            title="Aucun créneau programmé"
            text="Ajoutez les créneaux de cours pour construire l'emploi du temps de vos classes."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-soft">
                  <th className="px-6 py-3 font-medium">Jour</th>
                  <th className="px-6 py-3 font-medium">Horaire</th>
                  <th className="px-6 py-3 font-medium">Classe</th>
                  <th className="px-6 py-3 font-medium">Matière</th>
                  <th className="px-6 py-3 font-medium">Enseignant</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((s) => (
                  <tr key={s.id} className="border-t border-line">
                    <td className="px-6 py-3 text-ink">{s.day}</td>
                    <td className="px-6 py-3 text-ink-soft">{s.startTime} – {s.endTime}</td>
                    <td className="px-6 py-3 text-ink-soft">{s.className}</td>
                    <td className="px-6 py-3 text-ink-soft">{s.subject}</td>
                    <td className="px-6 py-3 text-ink-soft">{s.teacherName || "—"}</td>
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

function NewSlotForm({ schoolId, classes, teachers, onDone }) {
  const [form, setForm] = useState({
    day: DAYS[0],
    startTime: "08:00",
    endTime: "09:00",
    classId: "",
    subject: "",
    teacherId: "",
  });
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const klass = classes.find((c) => c.id === form.classId);
      const teacher = teachers.find((t) => t.id === form.teacherId);
      await addDoc(collection(db, "schools", schoolId, "schedule"), {
        day: form.day,
        startTime: form.startTime,
        endTime: form.endTime,
        classId: form.classId,
        className: klass?.name || "",
        subject: form.subject,
        teacherId: form.teacherId || null,
        teacherName: teacher?.fullName || "",
        createdAt: serverTimestamp(),
      });
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-surface p-6 flex flex-col gap-4">
      <h2 className="font-display text-base text-ink">Ajouter un créneau</h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Jour">
          <Select value={form.day} onChange={update("day")}>
            {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
        </FormField>
        <FormField label="Classe">
          <Select required value={form.classId} onChange={update("classId")}>
            <option value="">Sélectionner une classe</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </FormField>
        <FormField label="Heure de début">
          <TextInput required type="time" value={form.startTime} onChange={update("startTime")} />
        </FormField>
        <FormField label="Heure de fin">
          <TextInput required type="time" value={form.endTime} onChange={update("endTime")} />
        </FormField>
        <FormField label="Matière">
          <TextInput required value={form.subject} onChange={update("subject")} />
        </FormField>
        <FormField label="Enseignant">
          <Select value={form.teacherId} onChange={update("teacherId")}>
            <option value="">Non assigné</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
          </Select>
        </FormField>
      </div>

      <div className="flex items-center gap-3 mt-2">
        <button
          type="submit"
          disabled={submitting}
          className="text-sm bg-indigo-500 text-white rounded-lg px-4 py-2.5 disabled:opacity-60"
        >
          {submitting ? "Enregistrement" : "Ajouter au planning"}
        </button>
        <button type="button" onClick={onDone} className="text-sm text-ink-soft px-4 py-2.5">
          Annuler
        </button>
      </div>
    </form>
  );
}
