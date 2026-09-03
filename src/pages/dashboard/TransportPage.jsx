import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { IconPlus, IconMapPin } from "../../components/icons";
import EmptyState from "../../components/dashboard/EmptyState";
import FormField, { TextInput } from "../../components/auth/FormField";

export default function TransportPage() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId;

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    if (!schoolId) return;
    const q = query(collection(db, "schools", schoolId, "busRoutes"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setRoutes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [schoolId]);

  async function handleDelete(route) {
    if (!window.confirm(`Supprimer le circuit « ${route.name} » ?`)) return;
    await deleteDoc(doc(db, "schools", schoolId, "busRoutes", route.id));
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">{routes.length} circuit{routes.length > 1 ? "s" : ""}</p>
        <button
          onClick={() => { setEditing(null); setShowForm((v) => !v); }}
          className="flex items-center gap-1.5 text-sm bg-indigo-500 text-white rounded-lg px-4 py-2"
        >
          <IconPlus className="w-4 h-4" />
          Nouveau circuit
        </button>
      </div>

      {(showForm || editing) && (
        <RouteForm schoolId={schoolId} editing={editing} onDone={closeForm} />
      )}

      {!loading && routes.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface">
          <EmptyState icon={IconMapPin} title="Aucun circuit configuré" text="Ajoutez les circuits de bus desservant votre établissement." />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {routes.map((r) => (
            <div key={r.id} className="rounded-xl border border-line bg-surface p-6">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-base text-ink">{r.name}</h3>
                <div className="flex items-center gap-3 shrink-0">
                  <button onClick={() => { setShowForm(false); setEditing(r); }} className="text-xs text-indigo-600">Modifier</button>
                  <button onClick={() => handleDelete(r)} className="text-xs text-danger">Supprimer</button>
                </div>
              </div>
              <p className="text-sm text-ink-soft mt-2">Chauffeur : {r.driverName || "—"}</p>
              <p className="text-sm text-ink-soft">Téléphone : {r.driverPhone || "—"}</p>
              {r.stops && <p className="text-sm text-ink-soft mt-2 whitespace-pre-wrap">Arrêts : {r.stops}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RouteForm({ schoolId, editing, onDone }) {
  const [form, setForm] = useState({
    name: editing?.name || "",
    driverName: editing?.driverName || "",
    driverPhone: editing?.driverPhone || "",
    stops: editing?.stops || "",
  });
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await updateDoc(doc(db, "schools", schoolId, "busRoutes", editing.id), form);
      } else {
        await addDoc(collection(db, "schools", schoolId, "busRoutes"), { ...form, createdAt: serverTimestamp() });
      }
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-surface p-6 flex flex-col gap-4">
      <h2 className="font-display text-base text-ink">{editing ? "Modifier le circuit" : "Nouveau circuit"}</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Nom du circuit">
          <TextInput required value={form.name} onChange={update("name")} placeholder="Ex : Circuit Nord" />
        </FormField>
        <FormField label="Chauffeur">
          <TextInput value={form.driverName} onChange={update("driverName")} />
        </FormField>
        <FormField label="Téléphone du chauffeur">
          <TextInput value={form.driverPhone} onChange={update("driverPhone")} />
        </FormField>
      </div>
      <FormField label="Arrêts (un par ligne)">
        <textarea
          value={form.stops}
          onChange={update("stops")}
          rows={3}
          className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-indigo-500"
        />
      </FormField>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={submitting} className="text-sm bg-indigo-500 text-white rounded-lg px-4 py-2.5 disabled:opacity-60">
          {submitting ? "Enregistrement" : editing ? "Enregistrer les modifications" : "Créer le circuit"}
        </button>
        <button type="button" onClick={onDone} className="text-sm text-ink-soft px-4 py-2.5">Annuler</button>
      </div>
    </form>
  );
}
