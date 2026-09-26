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
import { uploadImageToCloudinary } from "../../lib/cloudinary";
import { useAuth } from "../../context/AuthContext";
import { IconPlus, IconBell, IconFile } from "../../components/icons";
import EmptyState from "../../components/dashboard/EmptyState";
import SearchInput from "../../components/dashboard/SearchInput";
import FormField, { TextInput } from "../../components/auth/FormField";

const CAN_POST = ["directeur", "secretaire"];

export default function AnnouncementsPage() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId;
  const canPost = CAN_POST.includes(profile?.role);

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const visibleAnnouncements = search.trim()
    ? announcements.filter((a) =>
        [a.title, a.body, a.authorName].some((v) => (v || "").toLowerCase().includes(search.trim().toLowerCase()))
      )
    : announcements;

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher une annonce..."
          className="sm:w-64"
        />
        {canPost && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 text-sm bg-indigo-500 text-white rounded-lg px-4 py-2"
          >
            <IconPlus className="w-4 h-4" />
            Nouvelle annonce
          </button>
        )}
      </div>

      {showForm && (
        <NewAnnouncementForm schoolId={schoolId} authorName={profile?.name} onDone={() => setShowForm(false)} />
      )}

      {!loading && visibleAnnouncements.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface">
          <EmptyState
            icon={IconBell}
            title={announcements.length === 0 ? "Aucune annonce pour le moment" : "Aucun résultat"}
            text={announcements.length === 0 ? "Les informations importantes de l'établissement apparaîtront ici." : "Aucune annonce ne correspond à cette recherche."}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {visibleAnnouncements.map((a) => (
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
              {a.posterUrl && (
                <img
                  src={a.posterUrl}
                  alt={`Affiche — ${a.title}`}
                  className="mt-4 rounded-lg border border-line max-w-full h-auto"
                />
              )}
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
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState("");
  const [posterError, setPosterError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handlePosterChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPosterError("Merci de choisir un fichier image (PNG ou JPG).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPosterError("L'affiche ne doit pas dépasser 2 Mo.");
      return;
    }

    setPosterError("");
    if (posterPreview) URL.revokeObjectURL(posterPreview);
    setPosterFile(file);
    setPosterPreview(URL.createObjectURL(file));
  }

  function removePoster() {
    if (posterPreview) URL.revokeObjectURL(posterPreview);
    setPosterFile(null);
    setPosterPreview("");
    setPosterError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setPosterError("");
    try {
      // L'affiche est optionnelle : si son envoi échoue, on prévient
      // clairement sans bloquer la publication du message lui-même —
      // l'annonce doit pouvoir passer avec ou sans affiche.
      let posterUrl = "";
      if (posterFile) {
        try {
          posterUrl = await uploadImageToCloudinary(posterFile);
        } catch (err) {
          setPosterError("L'envoi de l'affiche a échoué (annonce non publiée, réessayez).");
          setSubmitting(false);
          return;
        }
      }

      await addDoc(collection(db, "schools", schoolId, "announcements"), {
        ...form,
        posterUrl,
        authorName: authorName || "École",
        createdAt: serverTimestamp(),
      });
      if (posterPreview) URL.revokeObjectURL(posterPreview);
      setForm({ title: "", body: "" });
      setPosterFile(null);
      setPosterPreview("");
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

      <FormField label="Affiche (optionnel)">
        {posterPreview ? (
          <div className="flex items-start gap-3">
            <img src={posterPreview} alt="Aperçu de l'affiche" className="w-24 h-24 rounded-lg border border-line object-cover" />
            <button type="button" onClick={removePoster} className="text-xs text-danger">
              Retirer l'affiche
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-2 text-sm text-indigo-600 border border-indigo-200 rounded-lg px-4 py-2.5 cursor-pointer w-fit">
            <IconFile className="w-4 h-4" />
            Joindre une affiche
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={handlePosterChange}
              className="hidden"
            />
          </label>
        )}
        <p className="text-xs text-ink-soft mt-1">Format PNG ou JPG, 2 Mo maximum.</p>
      </FormField>

      {posterError && <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{posterError}</p>}

      <div className="flex items-center gap-3 mt-2">
        <button
          type="submit"
          disabled={submitting}
          className="text-sm bg-indigo-500 text-white rounded-lg px-4 py-2.5 disabled:opacity-60"
        >
          {submitting ? (posterFile ? "Envoi de l'affiche..." : "Publication") : "Publier"}
        </button>
        <button type="button" onClick={onDone} className="text-sm text-ink-soft px-4 py-2.5">
          Annuler
        </button>
      </div>
    </form>
  );
}
