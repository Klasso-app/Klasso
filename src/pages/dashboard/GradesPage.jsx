import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { averageForStudent } from "../../lib/grades";
import EmptyState from "../../components/dashboard/EmptyState";
import FormField, { Select, TextInput } from "../../components/auth/FormField";
import { IconChart } from "../../components/icons";

const TERMS = ["Trimestre 1", "Trimestre 2", "Trimestre 3"];

export default function GradesPage() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId;

  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [classId, setClassId] = useState("");
  const [subject, setSubject] = useState("");
  const [term, setTerm] = useState(TERMS[0]);
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    const unsubClasses = onSnapshot(collection(db, "schools", schoolId, "classes"), (snap) =>
      setClasses(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubStudents = onSnapshot(collection(db, "schools", schoolId, "students"), (snap) => {
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => {
      unsubClasses();
      unsubStudents();
    };
  }, [schoolId]);

  const selectedClass = classes.find((c) => c.id === classId);
  const classStudents = useMemo(
    () => students.filter((s) => s.classLabel === selectedClass?.name),
    [students, selectedClass]
  );

  const gradeDocId = classId && subject && term
    ? `${classId}__${slugify(subject)}__${slugify(term)}`
    : null;

  useEffect(() => {
    setSaved(false);
    if (!gradeDocId || !schoolId) {
      setScores({});
      return;
    }
    getDoc(doc(db, "schools", schoolId, "grades", gradeDocId)).then((snap) => {
      setScores(snap.exists() ? snap.data().scores || {} : {});
    });
  }, [gradeDocId, schoolId]);

  function updateScore(studentId, value) {
    setScores((s) => ({ ...s, [studentId]: value === "" ? undefined : Number(value) }));
  }

  async function handleSave() {
    if (!gradeDocId) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, "schools", schoolId, "grades", gradeDocId),
        {
          classId,
          className: selectedClass?.name || "",
          subject,
          term,
          scores,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (!loading && classes.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface">
        <EmptyState
          icon={IconChart}
          title="Aucune classe disponible"
          text="Créez d'abord des classes dans le module « Classes » pour pouvoir y saisir des notes."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-line bg-surface p-6">
        <h2 className="font-display text-base text-ink mb-4">Sélectionner une évaluation</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <FormField label="Classe">
            <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Choisir une classe</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Matière">
            <TextInput
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex : Mathématiques"
            />
          </FormField>
          <FormField label="Trimestre">
            <Select value={term} onChange={(e) => setTerm(e.target.value)}>
              {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </FormField>
        </div>
      </div>

      {classId && subject && (
        <div className="rounded-xl border border-line bg-surface">
          <div className="flex items-center justify-between px-6 py-5">
            <h2 className="font-display text-base text-ink">
              {selectedClass?.name} — {subject} — {term}
            </h2>
            <div className="flex items-center gap-3">
              {saved && <span className="text-sm text-success">Notes enregistrées</span>}
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-sm bg-indigo-500 text-white rounded-lg px-4 py-2 disabled:opacity-60"
              >
                {saving ? "Enregistrement" : "Enregistrer les notes"}
              </button>
            </div>
          </div>

          {classStudents.length === 0 ? (
            <EmptyState
              icon={IconChart}
              title="Aucun élève dans cette classe"
              text="Inscrivez des élèves dans cette classe depuis le module Élèves."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-ink-soft border-t border-line">
                    <th className="px-6 py-3 font-medium">Élève</th>
                    <th className="px-6 py-3 font-medium">Note / 20</th>
                  </tr>
                </thead>
                <tbody>
                  {classStudents.map((s) => (
                    <tr key={s.id} className="border-t border-line">
                      <td className="px-6 py-3 text-ink">{s.fullName}</td>
                      <td className="px-6 py-3">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.5"
                          value={scores[s.id] ?? ""}
                          onChange={(e) => updateScore(s.id, e.target.value)}
                          className="w-20 rounded-lg border border-line px-3 py-1.5 text-sm focus:border-indigo-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {classId && (
        <ClassAverages schoolId={schoolId} students={classStudents} />
      )}
    </div>
  );
}

function ClassAverages({ schoolId, students }) {
  const [grades, setGrades] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "schools", schoolId, "grades"), (snap) =>
      setGrades(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, [schoolId]);

  if (students.length === 0) return null;

  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="px-6 py-5">
        <h2 className="font-display text-base text-ink">Moyennes générales de la classe</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-soft border-t border-line">
              <th className="px-6 py-3 font-medium">Élève</th>
              <th className="px-6 py-3 font-medium">Moyenne (toutes matières)</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const avg = averageForStudent(grades, s.id);
              return (
                <tr key={s.id} className="border-t border-line">
                  <td className="px-6 py-3 text-ink">{s.fullName}</td>
                  <td className="px-6 py-3 text-ink-soft">{avg === null ? "—" : `${avg} / 20`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
