import { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { averageForStudent } from "../../lib/grades";
import EmptyState from "../../components/dashboard/EmptyState";
import { IconUsers } from "../../components/icons";

export default function ParentHomePage() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId;
  const childIds = profile?.parentOf || [];

  const [children, setChildren] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId || childIds.length === 0) {
      setLoading(false);
      return;
    }

    async function load() {
      const childDocs = await Promise.all(
        childIds.map((id) => getDoc(doc(db, "schools", schoolId, "students", id)))
      );
      setChildren(childDocs.filter((d) => d.exists()).map((d) => ({ id: d.id, ...d.data() })));

      const gradesSnap = await getDocs(collection(db, "schools", schoolId, "grades"));
      setGrades(gradesSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      setLoading(false);
    }

    load();
  }, [schoolId, childIds.join(",")]);

  if (!loading && children.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface">
        <EmptyState
          icon={IconUsers}
          title="Aucun enfant lié à votre compte"
          text="Contactez l'établissement pour obtenir un code d'invitation lié à votre enfant."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {children.map((child) => {
        const avg = averageForStudent(grades, child.id);
        return (
          <div key={child.id} className="rounded-xl border border-line bg-surface p-6">
            <h2 className="font-display text-lg text-ink">{child.fullName}</h2>
            <p className="text-sm text-ink-soft mt-1">Classe : {child.classLabel || "—"}</p>
            <div className="mt-4 rounded-lg bg-surface-tint px-4 py-3 inline-block">
              <p className="text-xs text-ink-soft">Moyenne générale</p>
              <p className="font-display text-xl text-ink mt-1">
                {avg === null ? "—" : `${avg} / 20`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
