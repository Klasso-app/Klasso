import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  getCountFromServer,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { fetchAllGrades, schoolAverage } from "../../lib/grades";
import { currentSchoolYear } from "../../lib/schoolYear";
import { getAccessibleClasses } from "../../lib/scope";
import StatCard from "../../components/dashboard/StatCard";
import EmptyState from "../../components/dashboard/EmptyState";
import {
  IconUsers,
  IconClipboard,
  IconChart,
  IconLayers,
  IconPlus,
  IconSearch,
  IconFilter,
} from "../../components/icons";

export default function DirecteurHomePage() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId;

  const [counts, setCounts] = useState({ students: null, teachers: null, classes: null });
  const [avgGrade, setAvgGrade] = useState(null);
  const [recentStudents, setRecentStudents] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    if (!schoolId) return;

    // Un directeur rattaché à un seul niveau (maternelle, primaire ou
    // secondaire) ne voit que les chiffres de ce niveau.
    async function getScopedClassNames() {
      if (!profile?.level) return null; // null = pas de restriction
      const snap = await getDocs(collection(db, "schools", schoolId, "classes"));
      const classes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const accessible = getAccessibleClasses({ profile, classes, assignments: [] });
      return accessible.map((c) => c.name);
    }

    async function loadCounts(classNames) {
      const teachersCount = await getCountFromServer(collection(db, "schools", schoolId, "teachers"));

      if (classNames === null) {
        const [studentsCount, classesCount] = await Promise.all([
          getCountFromServer(collection(db, "schools", schoolId, "students")),
          getCountFromServer(collection(db, "schools", schoolId, "classes")),
        ]);
        setCounts({
          students: studentsCount.data().count,
          teachers: teachersCount.data().count,
          classes: classesCount.data().count,
        });
        return;
      }

      if (classNames.length === 0) {
        setCounts({ students: 0, teachers: teachersCount.data().count, classes: 0 });
        return;
      }

      const studentsSnap = await getDocs(
        query(collection(db, "schools", schoolId, "students"), where("classLabel", "in", classNames))
      );
      setCounts({
        students: studentsSnap.size,
        teachers: teachersCount.data().count,
        classes: classNames.length,
      });
    }

    async function loadAverage(classNames) {
      let studentsSnap;
      if (classNames === null) {
        studentsSnap = await getDocs(collection(db, "schools", schoolId, "students"));
      } else if (classNames.length === 0) {
        setAvgGrade(null);
        return;
      } else {
        studentsSnap = await getDocs(
          query(collection(db, "schools", schoolId, "students"), where("classLabel", "in", classNames))
        );
      }
      const grades = await fetchAllGrades(schoolId);
      const studentIds = studentsSnap.docs.map((d) => d.id);
      setAvgGrade(schoolAverage(grades, studentIds, currentSchoolYear()));
    }

    async function loadRecentStudents(classNames) {
      setLoadingList(true);
      if (classNames !== null && classNames.length === 0) {
        setRecentStudents([]);
        setLoadingList(false);
        return;
      }
      const q = classNames === null
        ? query(collection(db, "schools", schoolId, "students"), orderBy("createdAt", "desc"), limit(6))
        : query(
            collection(db, "schools", schoolId, "students"),
            where("classLabel", "in", classNames),
            orderBy("createdAt", "desc"),
            limit(6)
          );
      const snap = await getDocs(q);
      setRecentStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoadingList(false);
    }

    getScopedClassNames().then((classNames) => {
      loadCounts(classNames).catch(() => setCounts({ students: 0, teachers: 0, classes: 0 }));
      loadAverage(classNames).catch(() => setAvgGrade(null));
      loadRecentStudents(classNames).catch(() => setLoadingList(false));
    });
  }, [schoolId, profile?.level]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={IconUsers} label="Effectif total" value={fmt(counts.students)} />
        <StatCard icon={IconClipboard} label="Enseignants" value={fmt(counts.teachers)} />
        <StatCard icon={IconLayers} label="Classes" value={fmt(counts.classes)} />
        <StatCard icon={IconChart} label="Moyenne générale" value={avgGrade === null ? "—" : `${avgGrade} / 20`} />
      </div>

      <div className="rounded-xl border border-line bg-surface">
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="font-display text-base text-ink">Nouvelles inscriptions par mois</h2>
        </div>
        <div className="px-6 pb-6">
          {counts.students === 0 ? (
            <EmptyState
              icon={IconUsers}
              title="Aucune inscription pour le moment"
              text="Ce graphique se remplira automatiquement à mesure que des élèves seront inscrits dans l'établissement."
            />
          ) : (
            <MonthlyBars />
          )}
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-6 py-5">
          <h2 className="font-display text-base text-ink">Derniers élèves inscrits</h2>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 border border-line rounded-lg px-3 py-2">
              <IconSearch className="w-4 h-4 text-ink-soft" />
              <input
                placeholder="Rechercher..."
                className="text-sm outline-none placeholder:text-ink-soft/60 w-32"
              />
            </div>
            <button className="hidden sm:flex items-center gap-1.5 text-sm border border-line rounded-lg px-3 py-2 text-ink-soft">
              <IconFilter className="w-4 h-4" />
              Filtrer
            </button>
            <Link
              to="/app/eleves"
              className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 text-sm bg-indigo-500 text-white rounded-lg px-3 py-2"
            >
              <IconPlus className="w-4 h-4" />
              Nouvel élève
            </Link>
          </div>
        </div>

        {!loadingList && recentStudents.length === 0 ? (
          <EmptyState
            icon={IconClipboard}
            title="Aucun élève inscrit"
            text="Commencez par inscrire votre premier élève pour voir apparaître son dossier ici."
            action={
              <Link
                to="/app/eleves"
                className="inline-flex items-center gap-1.5 text-sm bg-indigo-500 text-white rounded-lg px-4 py-2"
              >
                <IconPlus className="w-4 h-4" />
                Inscrire un élève
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-soft border-t border-line">
                  <th className="px-6 py-3 font-medium">Nom</th>
                  <th className="px-6 py-3 font-medium">Classe</th>
                  <th className="px-6 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {recentStudents.map((s) => (
                  <tr key={s.id} className="border-t border-line">
                    <td className="px-6 py-3 text-ink">{s.fullName}</td>
                    <td className="px-6 py-3 text-ink-soft">{s.classLabel || "—"}</td>
                    <td className="px-6 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-md text-success bg-success-soft">
                        Inscrit
                      </span>
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

function fmt(n) {
  return n === null ? "—" : n;
}

function MonthlyBars() {
  const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
  return (
    <div className="flex items-end gap-2 h-40">
      {months.map((m) => (
        <div key={m} className="flex-1 flex flex-col items-center gap-2">
          <div className="w-full rounded-sm bg-indigo-100" style={{ height: "4px" }} />
          <span className="text-xs text-ink-soft">{m}</span>
        </div>
      ))}
    </div>
  );
}
