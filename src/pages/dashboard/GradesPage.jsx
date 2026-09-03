import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { averageForStudent } from "../../lib/grades";
import { downloadBulletin } from "../../lib/bulletin";
import EmptyState from "../../components/dashboard/EmptyState";
import FormField, { Select, TextInput } from "../../components/auth/FormField";
import { IconChart, IconFile } from "../../components/icons";

const TERMS = ["Trimestre 1", "Trimestre 2", "Trimestre 3"];

export default function GradesPage() {
  const { profile, school } = useAuth();
  const schoolId = profile?.schoolId;

  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [classId, setClassId] = useState("");
  const [subject, setSubject] = useState("");
  const [term, setTerm] = useState(TERMS[0]);
  const [coefficient, setCoefficient] = useState(1);
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
    const unsubSubjects = onSnapshot(
      query(collection(db, "schools", schoolId, "subjects"), orderBy("name", "asc")),
      (snap) => setSubjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => {
      unsubClasses();
      unsubStudents();
      unsubSubjects();
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
      if (snap.exists()) {
        setScores(snap.data().scores || {});
        setCoefficient(snap.data().coefficient || 1);
      } else {
        setScores({});
        setCoefficient(1);
      }
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
          coefficient: Number(coefficient) || 1,
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
        <div className="grid sm:grid-cols-4 gap-4">
          <FormField label="Classe">
            <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Choisir une classe</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Matière">
            {subjects.length > 0 ? (
              <Select value={subject} onChange={(e) => setSubject(e.target.value)}>
                <option value="">Choisir une matière</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </Select>
            ) : (
              <TextInput
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex : Mathématiques"
              />
            )}
          </FormField>
          <FormField label="Trimestre">
            <Select value={term} onChange={(e) => setTerm(e.target.value)}>
              {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </FormField>
          <FormField label="Coefficient">
            <TextInput
              type="number"
              min="1"
              step="1"
              value={coefficient}
              onChange={(e) => setCoefficient(e.target.value)}
            />
          </FormField>
        </div>
        {subjects.length === 0 && (
          <p className="text-xs text-ink-soft mt-3">
            Astuce : créez vos matières dans le module « Matières » pour pouvoir les
            sélectionner directement ici.
          </p>
        )}
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
        <ClassAverages schoolId={schoolId} school={school} students={classStudents} classId={classId} />
      )}
    </div>
  );
}

function ClassAverages({ schoolId, school, students, classId }) {
  const [grades, setGrades] = useState([]);
  const [appreciations, setAppreciations] = useState({});
  const [bulletinTerm, setBulletinTerm] = useState("Toutes les périodes");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "schools", schoolId, "grades"), (snap) =>
      setGrades(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, [schoolId]);

  const appreciationDocId = classId && bulletinTerm !== "Toutes les périodes"
    ? `${classId}__${slugify(bulletinTerm)}`
    : null;

  useEffect(() => {
    if (!appreciationDocId) {
      setAppreciations({});
      return;
    }
    getDoc(doc(db, "schools", schoolId, "appreciations", appreciationDocId)).then((snap) => {
      setAppreciations(snap.exists() ? snap.data().texts || {} : {});
    });
  }, [appreciationDocId, schoolId]);

  async function saveAppreciation(studentId, text) {
    if (!appreciationDocId) return;
    const next = { ...appreciations, [studentId]: text };
    setAppreciations(next);
    await setDoc(
      doc(db, "schools", schoolId, "appreciations", appreciationDocId),
      { classId, term: bulletinTerm, texts: next, updatedAt: serverTimestamp() },
      { merge: true }
    );
  }

  if (students.length === 0) return null;

  const relevantGrades = bulletinTerm === "Toutes les périodes"
    ? grades
    : grades.filter((g) => g.term === bulletinTerm);

  const ranked = students
    .map((s) => ({ student: s, average: averageForStudent(relevantGrades, s.id) }))
    .sort((a, b) => (b.average ?? -1) - (a.average ?? -1));

  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5">
        <h2 className="font-display text-base text-ink">Moyennes générales de la classe</h2>
        <div className="w-full sm:w-56">
          <Select value={bulletinTerm} onChange={(e) => setBulletinTerm(e.target.value)}>
            <option>Toutes les périodes</option>
            {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-soft border-t border-line">
              <th className="px-6 py-3 font-medium">Rang</th>
              <th className="px-6 py-3 font-medium">Élève</th>
              <th className="px-6 py-3 font-medium">Moyenne pondérée</th>
              {appreciationDocId && <th className="px-6 py-3 font-medium">Appréciation</th>}
              <th className="px-6 py-3 font-medium">Bulletin</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map(({ student: s, average: avg }, index) => (
              <tr key={s.id} className="border-t border-line">
                <td className="px-6 py-3 text-ink-soft">{avg === null ? "—" : index + 1}</td>
                <td className="px-6 py-3 text-ink">{s.fullName}</td>
                <td className="px-6 py-3 text-ink-soft">{avg === null ? "—" : `${avg} / 20`}</td>
                {appreciationDocId && (
                  <td className="px-6 py-3">
                    <AppreciationInput
                      value={appreciations[s.id] || ""}
                      onSave={(text) => saveAppreciation(s.id, text)}
                    />
                  </td>
                )}
                <td className="px-6 py-3">
                  <button
                    onClick={() => downloadBulletin({
                      school,
                      student: s,
                      grades,
                      term: bulletinTerm,
                      rank: avg === null ? null : index + 1,
                      totalStudents: students.length,
                      appreciation: appreciations[s.id] || "",
                    })}
                    className="flex items-center gap-1.5 text-xs text-indigo-600 border border-indigo-200 rounded-md px-2.5 py-1.5"
                  >
                    <IconFile className="w-3.5 h-3.5" />
                    Télécharger
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AppreciationInput({ value, onSave }) {
  const [text, setText] = useState(value);

  return (
    <input
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => { if (text !== value) onSave(text); }}
      placeholder="Ajouter..."
      className="w-40 text-xs rounded-md border border-line px-2 py-1.5 focus:border-indigo-500"
    />
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
