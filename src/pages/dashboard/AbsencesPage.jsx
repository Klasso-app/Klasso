import { useEffect, useMemo, useState } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { getAccessibleClasses } from "../../lib/scope";
import { IconCalendar, IconUsers } from "../../components/icons";
import EmptyState from "../../components/dashboard/EmptyState";
import FormField, { Select, TextInput } from "../../components/auth/FormField";

export default function AbsencesPage() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId;

  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [classId, setClassId] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [selected, setSelected] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    const unsubClasses = onSnapshot(collection(db, "schools", schoolId, "classes"), (snap) =>
      setClasses(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubStudents = onSnapshot(collection(db, "schools", schoolId, "students"), (snap) =>
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubAbsences = onSnapshot(
      query(collection(db, "schools", schoolId, "absences"), orderBy("date", "desc")),
      (snap) => {
        setAbsences(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }
    );
    const unsubAssignments = onSnapshot(
      collection(db, "schools", schoolId, "classSubjectTeachers"),
      (snap) => setAssignments(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubSubjects = onSnapshot(
      collection(db, "schools", schoolId, "subjects"),
      (snap) => setSubjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => {
      unsubClasses();
      unsubStudents();
      unsubAbsences();
      unsubAssignments();
      unsubSubjects();
    };
  }, [schoolId]);

  const accessibleClasses = useMemo(
    () => getAccessibleClasses({ profile, classes, assignments }),
    [profile, classes, assignments]
  );

  const selectedClass = classes.find((c) => c.id === classId);
  const isSecondaire = selectedClass?.level === "Secondaire";

  const classStudents = useMemo(
    () => students.filter((s) => s.classLabel === selectedClass?.name),
    [students, selectedClass]
  );

  // Au secondaire, un enseignant ne peut enregistrer l'absence que pour la
  // matière qu'il donne à cette classe. Le personnel administratif voit
  // toutes les matières.
  const availableSubjects = useMemo(() => {
    if (!isSecondaire) return [];
    if (profile?.role !== "enseignant") return subjects;
    const mySubjectNames = assignments
      .filter((a) => a.classId === classId && a.teacherId === profile.id)
      .map((a) => a.subject);
    return subjects.filter((s) => mySubjectNames.includes(s.name));
  }, [isSecondaire, subjects, assignments, classId, profile]);

  useEffect(() => {
    setSubject("");
  }, [classId]);

  function toggle(studentId) {
    setSelected((s) => ({ ...s, [studentId]: !s[studentId] }));
  }

  async function handleSave() {
    const toRecord = classStudents.filter((s) => selected[s.id]);
    if (toRecord.length === 0) return;
    setSaving(true);
    try {
      const selectedSubject = availableSubjects.find((s) => s.name === subject);
      await Promise.all(
        toRecord.map((s) =>
          addDoc(collection(db, "schools", schoolId, "absences"), {
            studentId: s.id,
            studentName: s.fullName,
            classId,
            classLabel: s.classLabel,
            subject: isSecondaire ? subject : "",
            subjectId: isSecondaire ? selectedSubject?.id || null : null,
            date,
            justified: false,
            createdAt: serverTimestamp(),
          })
        )
      );
      setSelected({});
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(absence) {
    if (!window.confirm(`Annuler l'absence de ${absence.studentName} le ${absence.date} ?`)) return;
    await deleteDoc(doc(db, "schools", schoolId, "absences", absence.id));
  }

  if (!loading && accessibleClasses.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface">
        <EmptyState
          icon={IconCalendar}
          title="Aucune classe disponible"
          text={
            profile?.role === "enseignant"
              ? "Aucune classe ne vous est encore attribuée. Contactez la direction."
              : "Créez d'abord des classes dans le module « Classes » pour pouvoir y enregistrer des absences."
          }
        />
      </div>
    );
  }

  const canShowChecklist = classId && (!isSecondaire || subject);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-line bg-surface p-6">
        <h2 className="font-display text-base text-ink mb-4">Enregistrer les absences</h2>
        <div className={`grid gap-4 mb-4 ${isSecondaire ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          <FormField label="Classe">
            <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Choisir une classe</option>
              {accessibleClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </FormField>

          {isSecondaire && (
            <FormField label="Matière (cours)">
              {availableSubjects.length > 0 ? (
                <Select value={subject} onChange={(e) => setSubject(e.target.value)}>
                  <option value="">Choisir une matière</option>
                  {availableSubjects.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </Select>
              ) : (
                <p className="text-xs text-ink-soft py-2.5">
                  Aucune matière ne vous est attribuée pour cette classe.
                </p>
              )}
            </FormField>
          )}

          <FormField label="Date">
            <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </FormField>
        </div>

        {canShowChecklist && classStudents.length > 0 && (
          <>
            <div className="flex flex-col gap-2 mb-4">
              {classStudents.map((s) => (
                <label key={s.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-line text-sm">
                  <input
                    type="checkbox"
                    checked={!!selected[s.id]}
                    onChange={() => toggle(s.id)}
                    className="w-4 h-4"
                  />
                  {s.fullName}
                </label>
              ))}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-sm bg-indigo-500 text-white rounded-lg px-4 py-2.5 disabled:opacity-60"
            >
              {saving ? "Enregistrement" : "Enregistrer les absences cochées"}
            </button>
          </>
        )}
      </div>

      <div className="rounded-xl border border-line bg-surface">
        <div className="px-6 py-5">
          <h2 className="font-display text-base text-ink">Historique des absences</h2>
        </div>
        {!loading && absences.length === 0 ? (
          <EmptyState
            icon={IconUsers}
            title="Aucune absence enregistrée"
            text="L'historique apparaîtra ici au fur et à mesure des enregistrements."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-soft border-t border-line">
                  <th className="px-6 py-3 font-medium">Élève</th>
                  <th className="px-6 py-3 font-medium">Classe</th>
                  <th className="px-6 py-3 font-medium">Matière</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {absences.map((a) => (
                  <tr key={a.id} className="border-t border-line">
                    <td className="px-6 py-3 text-ink">{a.studentName}</td>
                    <td className="px-6 py-3 text-ink-soft">{a.classLabel}</td>
                    <td className="px-6 py-3 text-ink-soft">{a.subject || "—"}</td>
                    <td className="px-6 py-3 text-ink-soft">{a.date}</td>
                    <td className="px-6 py-3">
                      <button onClick={() => handleDelete(a)} className="text-xs text-danger">
                        Annuler
                      </button>
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
