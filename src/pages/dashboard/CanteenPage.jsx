import { useEffect, useState } from "react";
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
import { IconPlus, IconClipboard } from "../../components/icons";
import EmptyState from "../../components/dashboard/EmptyState";
import FormField, { TextInput } from "../../components/auth/FormField";

const CAN_POST = ["directeur", "secretaire"];

export default function CanteenPage() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId;
  const canPost = CAN_POST.includes(profile?.role);

  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    const q = query(collection(db, "schools", schoolId, "canteenMenus"), orderBy("date", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setMenus(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [schoolId]);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = menus.filter((m) => m.date >= today);

  async function handleDelete(menu) {
    if (!window.confirm(`Supprimer le menu du ${formatDate(menu.date)} ?`)) return;
    await deleteDoc(doc(db, "schools", schoolId, "canteenMenus", menu.id));
  }

  return (
    <div className="flex flex-col gap-6">
      {canPost && (
        <div className="flex items-center justify-end">
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 text-sm bg-indigo-500 text-white rounded-lg px-4 py-2"
          >
            <IconPlus className="w-4 h-4" />
            Ajouter un menu
          </button>
        </div>
      )}

      {showForm && <NewMenuForm schoolId={schoolId} onDone={() => setShowForm(false)} />}

      <div className="rounded-xl border border-line bg-surface">
        {!loading && upcoming.length === 0 ? (
          <EmptyState icon={IconClipboard} title="Aucun menu programmé" text="Le menu de la cantine apparaîtra ici." />
        ) : (
          <div className="flex flex-col divide-y divide-line">
            {upcoming.map((m) => (
              <div key={m.id} className="px-6 py-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-ink">{formatDate(m.date)}</p>
                  <p className="text-sm text-ink-soft mt-1 whitespace-pre-wrap">{m.menu}</p>
                </div>
                {canPost && (
                  <button onClick={() => handleDelete(m)} className="text-xs text-danger shrink-0">Supprimer</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NewMenuForm({ schoolId, onDone }) {
  const [form, setForm] = useState({ date: "", menu: "" });
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, "schools", schoolId, "canteenMenus"), { ...form, createdAt: serverTimestamp() });
      setForm({ date: "", menu: "" });
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-surface p-6 flex flex-col gap-4">
      <h2 className="font-display text-base text-ink">Ajouter un menu</h2>
      <FormField label="Date">
        <TextInput required type="date" value={form.date} onChange={update("date")} />
      </FormField>
      <FormField label="Menu">
        <textarea
          required
          value={form.menu}
          onChange={update("menu")}
          rows={3}
          placeholder="Ex : Riz au poisson, salade, fruit"
          className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-indigo-500"
        />
      </FormField>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={submitting} className="text-sm bg-indigo-500 text-white rounded-lg px-4 py-2.5 disabled:opacity-60">
          {submitting ? "Enregistrement" : "Ajouter"}
        </button>
        <button type="button" onClick={onDone} className="text-sm text-ink-soft px-4 py-2.5">Annuler</button>
      </div>
    </form>
  );
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}
