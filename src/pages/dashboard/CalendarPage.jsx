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
import { IconPlus, IconCalendar } from "../../components/icons";
import EmptyState from "../../components/dashboard/EmptyState";
import FormField, { TextInput } from "../../components/auth/FormField";

const CAN_POST = ["directeur", "secretaire"];

export default function CalendarPage() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId;
  const canPost = CAN_POST.includes(profile?.role);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    const q = query(collection(db, "schools", schoolId, "events"), orderBy("date", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [schoolId]);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((e) => e.date >= today);
  const past = events.filter((e) => e.date < today);

  async function handleDelete(ev) {
    if (!window.confirm(`Supprimer l'événement « ${ev.title} » ?`)) return;
    await deleteDoc(doc(db, "schools", schoolId, "events", ev.id));
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
            Nouvel événement
          </button>
        </div>
      )}

      {showForm && <NewEventForm schoolId={schoolId} onDone={() => setShowForm(false)} />}

      <div className="rounded-xl border border-line bg-surface">
        <div className="px-6 py-5"><h2 className="font-display text-base text-ink">À venir</h2></div>
        {!loading && upcoming.length === 0 ? (
          <EmptyState icon={IconCalendar} title="Aucun événement à venir" text="Les prochaines réunions, examens et sorties apparaîtront ici." />
        ) : (
          <div className="flex flex-col divide-y divide-line">
            {upcoming.map((ev) => (
              <div key={ev.id} className="px-6 py-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-ink">{ev.title}</p>
                  <p className="text-xs text-ink-soft mt-0.5">{formatDate(ev.date)}</p>
                  {ev.description && <p className="text-sm text-ink-soft mt-1.5">{ev.description}</p>}
                </div>
                {canPost && (
                  <button onClick={() => handleDelete(ev)} className="text-xs text-danger shrink-0">Supprimer</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {past.length > 0 && (
        <div className="rounded-xl border border-line bg-surface">
          <div className="px-6 py-5"><h2 className="font-display text-base text-ink">Passés</h2></div>
          <div className="flex flex-col divide-y divide-line">
            {past.slice().reverse().map((ev) => (
              <div key={ev.id} className="px-6 py-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-ink-soft">{ev.title}</p>
                  <p className="text-xs text-ink-soft mt-0.5">{formatDate(ev.date)}</p>
                </div>
                {canPost && (
                  <button onClick={() => handleDelete(ev)} className="text-xs text-danger shrink-0">Supprimer</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NewEventForm({ schoolId, onDone }) {
  const [form, setForm] = useState({ title: "", date: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, "schools", schoolId, "events"), { ...form, createdAt: serverTimestamp() });
      setForm({ title: "", date: "", description: "" });
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-surface p-6 flex flex-col gap-4">
      <h2 className="font-display text-base text-ink">Ajouter un événement</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Titre">
          <TextInput required value={form.title} onChange={update("title")} placeholder="Ex : Réunion parents-enseignants" />
        </FormField>
        <FormField label="Date">
          <TextInput required type="date" value={form.date} onChange={update("date")} />
        </FormField>
      </div>
      <FormField label="Description (optionnel)">
        <TextInput value={form.description} onChange={update("description")} />
      </FormField>
      <div className="flex items-center gap-3 mt-2">
        <button type="submit" disabled={submitting} className="text-sm bg-indigo-500 text-white rounded-lg px-4 py-2.5 disabled:opacity-60">
          {submitting ? "Enregistrement" : "Ajouter au calendrier"}
        </button>
        <button type="button" onClick={onDone} className="text-sm text-ink-soft px-4 py-2.5">Annuler</button>
      </div>
    </form>
  );
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
