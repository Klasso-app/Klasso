import { useEffect, useMemo, useState } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { getAccessibleClasses } from "../../lib/scope";
import { IconPlus, IconCalendar } from "../../components/icons";
import EmptyState from "../../components/dashboard/EmptyState";
import FormField, { TextInput, Select } from "../../components/auth/FormField";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const ADMIN_ROLES = ["directeur", "secretaire"];

export default function SchedulePage() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId;
  const isAdmin = ADMIN_ROLES.includes(profile?.role);
  const isTeacher = profile?.role === "enseignant";
  const isParent = profile?.role === "parent";

  const [slots, setSlots] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [childrenClassNames, setChildrenClassNames] = useState([]);
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
    const unsubAssignments = onSnapshot(
      collection(db, "schools", schoolId, "classSubjectTeachers"),
      (snap) => setAssignments(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => {
      unsubSlots();
      unsubClasses();
      unsubTeachers();
      unsubAssignments();
    };
  }, [schoolId]);

  // Pour un parent, on retrouve la ou les classes de ses enfants afin de ne
  // lui montrer que l'emploi du temps qui les concerne.
  useEffect(() => {
    if (!isParent || !schoolId || !profile?.parentOf?.length) {
      setChildrenClassNames([]);
      return;
    }
    Promise.all(
      profile.parentOf.map((studentId) =>
        getDoc(doc(db, "schools", schoolId, "students", studentId))
      )
    ).then((snaps) => {
      setChildrenClassNames(snaps.filter((s) => s.exists()).map((s) => s.data().classLabel));
    });
  }, [isParent, schoolId, profile]);

  const accessibleClasses = useMemo(
    () => getAccessibleClasses({ profile, classes, assignments }),
    [profile, classes, assignments]
  );

  // Emploi du temps visible selon le rôle :
  //  - administration : tout ce qui est dans son périmètre (niveau assigné
  //    éventuel) ;
  //  - enseignant : uniquement ses propres heures de cours ;
  //  - parent : uniquement la ou les classes de ses enfants.
  const visibleSlots = useMemo(() => {
    if (isTeacher) return slots.filter((s) => s.teacherId === profile.id);
    if (isParent) return slots.filter((s) => childrenClassNames.includes(s.className));
    const accessibleNames = new Set(accessibleClasses.map((c) => c.name));
    return slots.filter((s) => accessibleNames.has(s.className));
  }, [slots, isTeacher, isParent, profile, childrenClassNames, accessibleClasses]);

  async function handleDelete(slot) {
    if (!window.confirm(`Supprimer le créneau du ${slot.day} (${slot.className}) ?`)) return;
    await deleteDoc(doc(db, "schools", schoolId, "schedule", slot.id));
  }

  const title = isTeacher
    ? "Mes heures de cours"
    : isParent
    ? "Emploi du temps"
    : `${visibleSlots.length} créneau${visibleSlots.length > 1 ? "x" : ""} programmé${visibleSlots.length > 1 ? "s" : ""}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">{title}</p>
        {isAdmin && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 text-sm bg-indigo-500 text-white rounded-lg px-4 py-2"
          >
            <IconPlus className="w-4 h-4" />
            Nouveau créneau
          </button>
        )}
      </div>

      {isAdmin && showForm && (
        <NewSlotForm
          schoolId={schoolId}
          classes={accessibleClasses}
          teachers={teachers}
          onDone={() => setShowForm(false)}
        />
      )}

      <div className="rounded-xl border border-line bg-surface">
        {!loading && visibleSlots.length === 0 ? (
          <EmptyState
            icon={IconCalendar}
            title={
              isTeacher
                ? "Aucun cours ne vous est encore attribué"
                : isParent
                ? "Aucun créneau programmé pour le moment"
                : "Aucun créneau programmé"
            }
            text={
              isAdmin
                ? "Ajoutez les créneaux de cours pour construire l'emploi du temps de vos classes."
                : "L'établissement n'a pas encore renseigné cet emploi du temps."
            }
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
                  {isAdmin && <th className="px-6 py-3 font-medium"></th>}
                </tr>
              </thead>
              <tbody>
                {visibleSlots.map((s) => (
                  <tr key={s.id} className="border-t border-line">
                    <td className="px-6 py-3 text-ink">{s.day}</td>
                    <td className="px-6 py-3 text-ink-soft">{s.startTime} – {s.endTime}</td>
                    <td className="px-6 py-3 text-ink-soft">{s.className}</td>
                    <td className="px-6 py-3 text-ink-soft">{s.subject}</td>
                    <td className="px-6 py-3 text-ink-soft">{s.teacherName || "—"}</td>
                    {isAdmin && (
                      <td className="px-6 py-3">
                        <button onClick={() => handleDelete(s)} className="text-xs text-danger">
                          Supprimer
                        </button>
                      </td>
                    )}
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
