import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { averageForStudent } from "../../lib/grades";
import { exportToCsv } from "../../lib/csv";
import EmptyState from "../../components/dashboard/EmptyState";
import { IconChart } from "../../components/icons";

export default function StatsPage() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId;

  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    const unsubs = [
      onSnapshot(collection(db, "schools", schoolId, "classes"), (snap) =>
        setClasses(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
      onSnapshot(collection(db, "schools", schoolId, "students"), (snap) => {
        setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }),
      onSnapshot(collection(db, "schools", schoolId, "grades"), (snap) =>
        setGrades(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
      onSnapshot(collection(db, "schools", schoolId, "absences"), (snap) =>
        setAbsences(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, [schoolId]);

  const classStats = useMemo(() => {
    return classes.map((c) => {
      const classStudents = students.filter((s) => s.classLabel === c.name);
      const averages = classStudents
        .map((s) => averageForStudent(grades, s.id))
        .filter((v) => v !== null);
      const classAverage = averages.length
        ? Math.round((averages.reduce((a, b) => a + b, 0) / averages.length) * 100) / 100
        : null;
      const classAbsences = absences.filter((a) => a.classLabel === c.name).length;
      return { name: c.name, effectif: classStudents.length, average: classAverage, absences: classAbsences };
    });
  }, [classes, students, grades, absences]);

  const subjectStats = useMemo(() => {
    const bySubject = {};
    grades.forEach((g) => {
      if (!g.subject) return;
      const scores = Object.values(g.scores || {}).filter((v) => typeof v === "number");
      if (scores.length === 0) return;
      if (!bySubject[g.subject]) bySubject[g.subject] = [];
      bySubject[g.subject].push(...scores);
    });
    return Object.entries(bySubject).map(([subject, scores]) => ({
      subject,
      average: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100,
      count: scores.length,
    }));
  }, [grades]);

  if (!loading && classes.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface">
        <EmptyState
          icon={IconChart}
          title="Aucune donnée à afficher"
          text="Les statistiques apparaîtront ici une fois des classes, élèves et notes enregistrés."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-line bg-surface">
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="font-display text-base text-ink">Statistiques par classe</h2>
          <button
            onClick={() => exportToCsv("statistiques-classes-klasso", classStats.map((c) => ({
              Classe: c.name,
              Effectif: c.effectif,
              "Moyenne générale": c.average ?? "—",
              "Absences enregistrées": c.absences,
            })))}
            className="text-xs text-indigo-600 border border-indigo-200 rounded-md px-3 py-2"
          >
            Exporter en CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-soft border-t border-line">
                <th className="px-6 py-3 font-medium">Classe</th>
                <th className="px-6 py-3 font-medium">Effectif</th>
                <th className="px-6 py-3 font-medium">Moyenne générale</th>
                <th className="px-6 py-3 font-medium">Absences enregistrées</th>
              </tr>
            </thead>
            <tbody>
              {classStats.map((c) => (
                <tr key={c.name} className="border-t border-line">
                  <td className="px-6 py-3 text-ink">{c.name}</td>
                  <td className="px-6 py-3 text-ink-soft">{c.effectif}</td>
                  <td className="px-6 py-3 text-ink-soft">{c.average === null ? "—" : `${c.average} / 20`}</td>
                  <td className="px-6 py-3 text-ink-soft">{c.absences}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface">
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="font-display text-base text-ink">Statistiques par matière</h2>
          {subjectStats.length > 0 && (
            <button
              onClick={() => exportToCsv("statistiques-matieres-klasso", subjectStats.map((s) => ({
                Matière: s.subject,
                "Moyenne toutes classes": s.average,
                "Nombre de notes": s.count,
              })))}
              className="text-xs text-indigo-600 border border-indigo-200 rounded-md px-3 py-2"
            >
              Exporter en CSV
            </button>
          )}
        </div>
        {subjectStats.length === 0 ? (
          <EmptyState icon={IconChart} title="Aucune note enregistrée" text="Les statistiques par matière apparaîtront dès que des notes seront saisies." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-soft border-t border-line">
                  <th className="px-6 py-3 font-medium">Matière</th>
                  <th className="px-6 py-3 font-medium">Moyenne toutes classes</th>
                  <th className="px-6 py-3 font-medium">Nombre de notes</th>
                </tr>
              </thead>
              <tbody>
                {subjectStats.map((s) => (
                  <tr key={s.subject} className="border-t border-line">
                    <td className="px-6 py-3 text-ink">{s.subject}</td>
                    <td className="px-6 py-3 text-ink-soft">{s.average} / 20</td>
                    <td className="px-6 py-3 text-ink-soft">{s.count}</td>
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
