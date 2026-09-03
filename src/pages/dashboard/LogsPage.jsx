import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { IconShield } from "../../components/icons";
import EmptyState from "../../components/dashboard/EmptyState";

export default function LogsPage() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId;

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    const q = query(collection(db, "schools", schoolId, "auditLogs"), orderBy("createdAt", "desc"), limit(200));
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [schoolId]);

  if (profile?.role !== "directeur") {
    return (
      <div className="rounded-xl border border-line bg-surface">
        <EmptyState icon={IconShield} title="Accès réservé" text="L'historique des actions est réservé au directeur." />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-surface">
      {!loading && logs.length === 0 ? (
        <EmptyState icon={IconShield} title="Aucune action enregistrée" text="Les suppressions et modifications sensibles apparaîtront ici." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-soft">
                <th className="px-6 py-3 font-medium">Action</th>
                <th className="px-6 py-3 font-medium">Détails</th>
                <th className="px-6 py-3 font-medium">Auteur</th>
                <th className="px-6 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t border-line">
                  <td className="px-6 py-3 text-ink">{l.action}</td>
                  <td className="px-6 py-3 text-ink-soft">{l.details}</td>
                  <td className="px-6 py-3 text-ink-soft">{l.actorName}</td>
                  <td className="px-6 py-3 text-ink-soft">{formatTimestamp(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatTimestamp(ts) {
  if (!ts?.toDate) return "—";
  return ts.toDate().toLocaleString("fr-FR");
}
