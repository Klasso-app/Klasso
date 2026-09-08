import { useEffect, useMemo, useState } from "react";
import { collection, doc, updateDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { logAction } from "../../lib/auditLog";
import { getAccessibleClasses } from "../../lib/scope";
import { nextClassName } from "../../lib/schoolLevels";
import { nextSchoolYear } from "../../lib/schoolYear";
import { IconLayers, IconShield } from "../../components/icons";
import EmptyState from "../../components/dashboard/EmptyState";
import FormField, { Select } from "../../components/auth/FormField";

const GRADUATE = "__graduate__";
const ADMIN_ROLES = ["directeur", "secretaire"];

export default function PromotionPage() {
  const { profile, firebaseUser } = useAuth();
  const schoolId = profile?.schoolId;

  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [tuitionFees, setTuitionFees] = useState({});
  const [loading, setLoading] = useState(true);
  const [classId, setClassId] = useState("");
  const [decisions, setDecisions] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    const unsubClasses = onSnapshot(collection(db, "schools", schoolId, "classes"), (snap) => {
      setClasses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    const unsubStudents = onSnapshot(collection(db, "schools", schoolId, "students"), (snap) =>
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubFees = onSnapshot(collection(db, "schools", schoolId, "tuitionFees"), (snap) => {
      const map = {};
      snap.docs.forEach((d) => { map[d.id] = d.data().amount; });
      setTuitionFees(map);
    });
    return () => {
      unsubClasses();
      unsubStudents();
      unsubFees();
    };
  }, [schoolId]);

  if (!ADMIN_ROLES.includes(profile?.role)) {
    return (
      <div className="rounded-xl border border-line bg-surface">
        <EmptyState
          icon={IconShield}
          title="Accès réservé"
          text="Le passage de classe est réservé au directeur et à la secrétaire."
        />
      </div>
    );
  }

  const accessibleClasses = useMemo(
    () => getAccessibleClasses({ profile, classes, assignments: [] }),
    [profile, classes]
  );
  const schoolClassNames = useMemo(() => classes.map((c) => c.name), [classes]);

  const selectedClass = classes.find((c) => c.id === classId);
  const classStudents = useMemo(
    () => students.filter((s) => s.classLabel === selectedClass?.name && (s.status || "Actif") === "Actif"),
    [students, selectedClass]
  );

  const suggestedNext = selectedClass ? nextClassName(selectedClass.name) : null;
  const isTerminale = selectedClass?.name === "Terminale";
  const targetYear = nextSchoolYear();

  function decisionOptionsFor(currentClassName) {
    const opts = [];
    if (suggestedNext && schoolClassNames.includes(suggestedNext)) {
      opts.push({ value: suggestedNext, label: `Passe en ${suggestedNext}` });
    }
    opts.push({ value: currentClassName, label: `Redouble (reste en ${currentClassName})` });
    schoolClassNames
      .filter((n) => n !== currentClassName && n !== suggestedNext)
      .forEach((n) => opts.push({ value: n, label: `Autre classe : ${n}` }));
    if (isTerminale) {
      opts.push({ value: GRADUATE, label: "Diplômé(e) — fin de scolarité" });
    }
    return opts;
  }

  function decisionFor(studentId) {
    if (decisions[studentId] !== undefined) return decisions[studentId];
    return suggestedNext && schoolClassNames.includes(suggestedNext) ? suggestedNext : selectedClass?.name;
  }

  function setDecision(studentId, value) {
    setDecisions((d) => ({ ...d, [studentId]: value }));
  }

  async function handleValidate() {
    if (!window.confirm(`Confirmer le passage de classe pour ${classStudents.length} élève(s) — année ${targetYear} ?`)) return;
    setSubmitting(true);
    let promoted = 0;
    let repeated = 0;
    let graduated = 0;
    try {
      await Promise.all(
        classStudents.map((s) => {
          const decision = decisionFor(s.id);
          if (decision === GRADUATE) {
            graduated++;
            return updateDoc(doc(db, "schools", schoolId, "students", s.id), {
              status: "Diplômé",
            });
          }
          if (decision === selectedClass.name) repeated++;
          else promoted++;
          const payload = {
            classLabel: decision,
            schoolYear: targetYear,
            status: "Actif",
          };
          if (tuitionFees[decision] !== undefined) payload.annualFees = tuitionFees[decision];
          return updateDoc(doc(db, "schools", schoolId, "students", s.id), payload);
        })
      );
      logAction(schoolId, {
        actorUid: firebaseUser?.uid,
        actorName: profile?.name,
        action: "Passage de classe",
        details: `${selectedClass.name} → ${targetYear} : ${promoted} admis, ${repeated} redoublant(s), ${graduated} diplômé(s)`,
      });
      setDone(true);
      setDecisions({});
    } finally {
      setSubmitting(false);
    }
  }

  if (!loading && accessibleClasses.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface">
        <EmptyState
          icon={IconLayers}
          title="Aucune classe disponible"
          text="Créez d'abord vos classes dans le module « Classes »."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-ink-soft max-w-lg">
        Choisissez une classe : chaque élève actif y est listé avec une proposition de
        passage en classe supérieure, modifiable au cas par cas (redoublement, autre
        classe, ou fin de scolarité pour la Terminale).
      </p>

      <div className="rounded-xl border border-line bg-surface p-6">
        <FormField label="Classe à traiter">
          <Select value={classId} onChange={(e) => { setClassId(e.target.value); setDecisions({}); setDone(false); }}>
            <option value="">Choisir une classe</option>
            {accessibleClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </FormField>
      </div>

      {selectedClass && (
        <div className="rounded-xl border border-line bg-surface">
          <div className="px-6 py-5">
            <h2 className="font-display text-base text-ink">
              {selectedClass.name} — passage vers l'année {targetYear}
            </h2>
            {suggestedNext && !schoolClassNames.includes(suggestedNext) && (
              <p className="text-xs text-warning mt-1">
                La classe suivante habituelle ({suggestedNext}) n'existe pas encore dans le
                module Classes — créez-la d'abord si vous voulez y faire passer des élèves.
              </p>
            )}
          </div>

          {classStudents.length === 0 ? (
            <EmptyState icon={IconLayers} title="Aucun élève actif dans cette classe" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-ink-soft border-t border-line">
                      <th className="px-6 py-3 font-medium">Élève</th>
                      <th className="px-6 py-3 font-medium">Décision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map((s) => (
                      <tr key={s.id} className="border-t border-line">
                        <td className="px-6 py-3 text-ink">{s.fullName}</td>
                        <td className="px-6 py-3">
                          <select
                            value={decisionFor(s.id)}
                            onChange={(e) => setDecision(s.id, e.target.value)}
                            className="w-full sm:w-64 rounded-lg border border-line px-3 py-1.5 text-sm focus:border-indigo-500"
                          >
                            {decisionOptionsFor(selectedClass.name).map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-5 flex items-center gap-3">
                <button
                  onClick={handleValidate}
                  disabled={submitting}
                  className="text-sm bg-indigo-500 text-white rounded-lg px-4 py-2.5 disabled:opacity-60"
                >
                  {submitting ? "Enregistrement" : `Confirmer le passage (${classStudents.length} élève${classStudents.length > 1 ? "s" : ""})`}
                </button>
                {done && <span className="text-sm text-success">Passage de classe enregistré</span>}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
