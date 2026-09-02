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
import { IconPlus, IconMessage } from "../../components/icons";
import EmptyState from "../../components/dashboard/EmptyState";
import FormField, { TextInput } from "../../components/auth/FormField";

const CAN_POST = ["directeur", "secretaire"];

export default function AnnouncementsPage() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId;
  const canPost = CAN_POST.includes(profile?.role);

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    const q = query(collection(db, "schools", schoolId, "announcements"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [schoolId]);

  async function handleDelete(a) {
    if (!window.confirm(`Supprimer l'annonce « ${a.title} » ?`)) return;
    await deleteDoc(doc(db, "schools", schoolId, "announcements", a.id));
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
            Nouvelle annonce
          </button>
        </div>
      )}

      {showForm && (
        <NewAnnouncementForm schoolId={schoolId} authorName={profile?.name} onDone={() => setShowForm(false)} />
      )}

      {!loading && announcements.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface">
          <EmptyState
            icon={IconMessage}
            title="Aucune annonce pour le moment"
            text="Les informations importantes de l'établissement apparaîtront ici."
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {announcements.map((a) => (
            <div key={a.id} className="rounded-xl border border-line bg-surface p-6">
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-display text-base text-ink">{a.title}</h2>
                {canPost && (
                  <button onClick={() => handleDelete(a)} className="text-xs text-danger shrink-0">
                    Supprimer
                  </button>
                )}
              </div>
              <p className="mt-2 text-sm text-ink-soft whitespace-pre-wrap">{a.body}</p>
              <p className="mt-4 text-xs text-ink-soft">Publié par {a.authorName}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewAnnouncementForm({ schoolId, authorName, onDone }) {
  const [form, setForm] = useState({ title: "", body: "" });
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, "schools", schoolId, "announcements"), {
        ...form,
        authorName: authorName || "École",
        createdAt: serverTimestamp(),
      });
      setForm({ title: "", body: "" });
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-surface p-6 flex flex-col gap-4">
      <h2 className="font-display text-base text-ink">Publier une annonce</h2>

      <FormField label="Titre">
        <TextInput required value={form.title} onChange={update("title")} />
      </FormField>
      <FormField label="Message">
        <textarea
          required
          value={form.body}
          onChange={update("body")}
          rows={4}
          className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-indigo-500"
        />
      </FormField>

      <div className="flex items-center gap-3 mt-2">
        <button
          type="submit"
          disabled={submitting}
          className="text-sm bg-indigo-500 text-white rounded-lg px-4 py-2.5 disabled:opacity-60"
        >
          {submitting ? "Publication" : "Publier"}
        </button>
        <button type="button" onClick={onDone} className="text-sm text-ink-soft px-4 py-2.5">
          Annuler
        </button>
      </div>
    </form>
  );
}
