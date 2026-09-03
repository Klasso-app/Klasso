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
import { logAction } from "../../lib/auditLog";
import { IconPlus, IconClipboard, IconCalendar, IconChart } from "../../components/icons";
import EmptyState from "../../components/dashboard/EmptyState";
import FormField, { TextInput, Select } from "../../components/auth/FormField";

const TABS = ["Fiches", "Pointage", "Évaluations", "Congés"];
const CONTRACT_TYPES = ["CDI", "CDD", "Vacataire"];

export default function TeachersPage() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId;
  const [tab, setTab] = useState(TABS[0]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    const q = query(collection(db, "schools", schoolId, "teachers"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setTeachers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [schoolId]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-1 rounded-lg border border-line p-1 w-fit overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-xs px-3 py-1.5 rounded-md whitespace-nowrap ${tab === t ? "bg-indigo-50 text-indigo-600 font-medium" : "text-ink-soft"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Fiches" && <TeacherRecords schoolId={schoolId} teachers={teachers} loading={loading} />}
      {tab === "Pointage" && <TeacherAttendance schoolId={schoolId} teachers={teachers} />}
      {tab === "Évaluations" && <TeacherEvaluations schoolId={schoolId} teachers={teachers} />}
      {tab === "Congés" && <TeacherLeaves schoolId={schoolId} teachers={teachers} />}
    </div>
  );
}

/* ---------- Fiches ---------- */

function TeacherRecords({ schoolId, teachers, loading }) {
  const { profile, firebaseUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  async function handleDelete(teacher) {
    if (!window.confirm(`Supprimer ${teacher.fullName} de la liste des enseignants ?`)) return;
    await deleteDoc(doc(db, "schools", schoolId, "teachers", teacher.id));
    logAction(schoolId, {
      actorUid: firebaseUser?.uid,
      actorName: profile?.name,
      action: "Suppression d'un enseignant",
      details: teacher.fullName,
    });
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">{teachers.length} enseignant{teachers.length > 1 ? "s" : ""}</p>
        <button
          onClick={() => { setEditing(null); setShowForm((v) => !v); }}
          className="flex items-center gap-1.5 text-sm bg-indigo-500 text-white rounded-lg px-4 py-2"
        >
          <IconPlus className="w-4 h-4" />
          Nouvel enseignant
        </button>
      </div>

      {(showForm || editing) && (
        <TeacherForm schoolId={schoolId} editing={editing} onDone={closeForm} />
      )}

      <div className="rounded-xl border border-line bg-surface">
        {!loading && teachers.length === 0 ? (
          <EmptyState
            icon={IconClipboard}
            title="Aucun enseignant enregistré"
            text="Ajoutez vos enseignants pour pouvoir ensuite les affecter à des classes et matières."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-soft">
                  <th className="px-6 py-3 font-medium">Nom</th>
                  <th className="px-6 py-3 font-medium">Matière(s)</th>
                  <th className="px-6 py-3 font-medium">Contrat</th>
                  <th className="px-6 py-3 font-medium">Salaire mensuel</th>
                  <th className="px-6 py-3 font-medium">Téléphone</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t.id} className="border-t border-line">
                    <td className="px-6 py-3 text-ink">{t.fullName}</td>
                    <td className="px-6 py-3 text-ink-soft">{t.subjects || "—"}</td>
                    <td className="px-6 py-3 text-ink-soft">{t.contractType || "—"}</td>
                    <td className="px-6 py-3 text-ink-soft">
                      {t.monthlySalary ? `${new Intl.NumberFormat("fr-FR").format(t.monthlySalary)} FCFA` : "—"}
                    </td>
                    <td className="px-6 py-3 text-ink-soft">{t.phone || "—"}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <button onClick={() => { setShowForm(false); setEditing(t); }} className="text-xs text-indigo-600">
                          Modifier
                        </button>
                        <button onClick={() => handleDelete(t)} className="text-xs text-danger">
                          Supprimer
                        </button>
                      </div>
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

function TeacherForm({ schoolId, editing, onDone }) {
  const [form, setForm] = useState({
    fullName: editing?.fullName || "",
    subjects: editing?.subjects || "",
    phone: editing?.phone || "",
    email: editing?.email || "",
    contractType: editing?.contractType || CONTRACT_TYPES[0],
    monthlySalary: editing?.monthlySalary ?? "",
  });
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, monthlySalary: form.monthlySalary === "" ? 0 : Number(form.monthlySalary) };
      if (editing) {
        await updateDoc(doc(db, "schools", schoolId, "teachers", editing.id), payload);
      } else {
        await addDoc(collection(db, "schools", schoolId, "teachers"), { ...payload, createdAt: serverTimestamp() });
      }
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-surface p-6 flex flex-col gap-4">
      <h2 className="font-display text-base text-ink">{editing ? "Modifier l'enseignant" : "Ajouter un enseignant"}</h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Nom complet">
          <TextInput required value={form.fullName} onChange={update("fullName")} />
        </FormField>
        <FormField label="Matière(s) enseignée(s)">
          <TextInput value={form.subjects} onChange={update("subjects")} placeholder="Ex : Mathématiques, Physique" />
        </FormField>
        <FormField label="Téléphone">
          <TextInput value={form.phone} onChange={update("phone")} />
        </FormField>
        <FormField label="E-mail">
          <TextInput type="email" value={form.email} onChange={update("email")} />
        </FormField>
        <FormField label="Type de contrat">
          <Select value={form.contractType} onChange={update("contractType")}>
            {CONTRACT_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </FormField>
        <FormField label="Salaire mensuel (FCFA)">
          <TextInput type="number" min="0" value={form.monthlySalary} onChange={update("monthlySalary")} />
        </FormField>
      </div>

      <div className="flex items-center gap-3 mt-2">
        <button type="submit" disabled={submitting} className="text-sm bg-indigo-500 text-white rounded-lg px-4 py-2.5 disabled:opacity-60">
          {submitting ? "Enregistrement" : editing ? "Enregistrer les modifications" : "Enregistrer"}
        </button>
        <button type="button" onClick={onDone} className="text-sm text-ink-soft px-4 py-2.5">Annuler</button>
      </div>
    </form>
  );
}

/* ---------- Pointage ---------- */

function TeacherAttendance({ schoolId, teachers }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState({});
  const [records, setRecords] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "schools", schoolId, "teacherAttendance"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, [schoolId]);

  function setTeacherStatus(teacherId, value) {
    setStatus((s) => ({ ...s, [teacherId]: value }));
  }

  async function handleSave() {
    const entries = Object.entries(status).filter(([, v]) => v);
    if (entries.length === 0) return;
    setSaving(true);
    try {
      await Promise.all(entries.map(([teacherId, value]) => {
        const teacher = teachers.find((t) => t.id === teacherId);
        return addDoc(collection(db, "schools", schoolId, "teacherAttendance"), {
          teacherId,
          teacherName: teacher?.fullName || "",
          date,
          status: value,
          createdAt: serverTimestamp(),
        });
      }));
      setStatus({});
    } finally {
      setSaving(false);
    }
  }

  if (teachers.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface">
        <EmptyState icon={IconCalendar} title="Aucun enseignant à pointer" text="Ajoutez des enseignants dans l'onglet Fiches." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-line bg-surface p-6">
        <h2 className="font-display text-base text-ink mb-4">Pointage du jour</h2>
        <div className="mb-4 max-w-xs">
          <FormField label="Date">
            <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </FormField>
        </div>
        <div className="flex flex-col gap-2 mb-4">
          {teachers.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-line">
              <span className="text-sm text-ink">{t.fullName}</span>
              <div className="flex items-center gap-1">
                {["Présent", "Absent", "Retard"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setTeacherStatus(t.id, opt)}
                    className={`text-xs px-2.5 py-1 rounded-md ${status[t.id] === opt ? "bg-indigo-500 text-white" : "border border-line text-ink-soft"}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button onClick={handleSave} disabled={saving} className="text-sm bg-indigo-500 text-white rounded-lg px-4 py-2.5 disabled:opacity-60">
          {saving ? "Enregistrement" : "Enregistrer le pointage"}
        </button>
      </div>

      <div className="rounded-xl border border-line bg-surface">
        <div className="px-6 py-5"><h2 className="font-display text-base text-ink">Historique</h2></div>
        {records.length === 0 ? (
          <EmptyState icon={IconCalendar} title="Aucun pointage enregistré" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-soft border-t border-line">
                  <th className="px-6 py-3 font-medium">Enseignant</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-t border-line">
                    <td className="px-6 py-3 text-ink">{r.teacherName}</td>
                    <td className="px-6 py-3 text-ink-soft">{r.date}</td>
                    <td className="px-6 py-3 text-ink-soft">{r.status}</td>
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

/* ---------- Évaluations ---------- */

function TeacherEvaluations({ schoolId, teachers }) {
  const { profile } = useAuth();
  const [evaluations, setEvaluations] = useState([]);
  const [teacherId, setTeacherId] = useState("");
  const [rating, setRating] = useState(3);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "schools", schoolId, "teacherEvaluations"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => setEvaluations(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, [schoolId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const teacher = teachers.find((t) => t.id === teacherId);
      await addDoc(collection(db, "schools", schoolId, "teacherEvaluations"), {
        teacherId,
        teacherName: teacher?.fullName || "",
        rating: Number(rating),
        comments,
        evaluatorName: profile?.name || "",
        date: new Date().toISOString().slice(0, 10),
        createdAt: serverTimestamp(),
      });
      setTeacherId("");
      setRating(3);
      setComments("");
    } finally {
      setSubmitting(false);
    }
  }

  if (teachers.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface">
        <EmptyState icon={IconChart} title="Aucun enseignant à évaluer" text="Ajoutez des enseignants dans l'onglet Fiches." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-surface p-6 flex flex-col gap-4">
        <h2 className="font-display text-base text-ink">Nouvelle évaluation</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="Enseignant">
            <Select required value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              <option value="">Sélectionner</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </Select>
          </FormField>
          <FormField label="Note (sur 5)">
            <Select value={rating} onChange={(e) => setRating(e.target.value)}>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} / 5</option>)}
            </Select>
          </FormField>
        </div>
        <FormField label="Commentaire">
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-indigo-500"
          />
        </FormField>
        <button type="submit" disabled={submitting} className="text-sm bg-indigo-500 text-white rounded-lg px-4 py-2.5 disabled:opacity-60 self-start">
          {submitting ? "Enregistrement" : "Enregistrer l'évaluation"}
        </button>
      </form>

      <div className="rounded-xl border border-line bg-surface">
        <div className="px-6 py-5"><h2 className="font-display text-base text-ink">Historique des évaluations</h2></div>
        {evaluations.length === 0 ? (
          <EmptyState icon={IconChart} title="Aucune évaluation enregistrée" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-soft border-t border-line">
                  <th className="px-6 py-3 font-medium">Enseignant</th>
                  <th className="px-6 py-3 font-medium">Note</th>
                  <th className="px-6 py-3 font-medium">Commentaire</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {evaluations.map((ev) => (
                  <tr key={ev.id} className="border-t border-line">
                    <td className="px-6 py-3 text-ink">{ev.teacherName}</td>
                    <td className="px-6 py-3 text-ink-soft">{ev.rating} / 5</td>
                    <td className="px-6 py-3 text-ink-soft">{ev.comments || "—"}</td>
                    <td className="px-6 py-3 text-ink-soft">{ev.date}</td>
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

/* ---------- Congés ---------- */

function TeacherLeaves({ schoolId, teachers }) {
  const [leaves, setLeaves] = useState([]);
  const [form, setForm] = useState({ teacherId: "", startDate: "", endDate: "", reason: "", replacementId: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "schools", schoolId, "leaves"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => setLeaves(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, [schoolId]);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const teacher = teachers.find((t) => t.id === form.teacherId);
      const replacement = teachers.find((t) => t.id === form.replacementId);
      await addDoc(collection(db, "schools", schoolId, "leaves"), {
        teacherId: form.teacherId,
        teacherName: teacher?.fullName || "",
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
        replacementId: form.replacementId || null,
        replacementName: replacement?.fullName || "",
        createdAt: serverTimestamp(),
      });
      setForm({ teacherId: "", startDate: "", endDate: "", reason: "", replacementId: "" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(leave) {
    if (!window.confirm("Supprimer ce congé ?")) return;
    await deleteDoc(doc(db, "schools", schoolId, "leaves", leave.id));
  }

  if (teachers.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface">
        <EmptyState icon={IconCalendar} title="Aucun enseignant" text="Ajoutez des enseignants dans l'onglet Fiches." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-surface p-6 flex flex-col gap-4">
        <h2 className="font-display text-base text-ink">Déclarer un congé</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="Enseignant">
            <Select required value={form.teacherId} onChange={update("teacherId")}>
              <option value="">Sélectionner</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </Select>
          </FormField>
          <FormField label="Remplaçant (optionnel)">
            <Select value={form.replacementId} onChange={update("replacementId")}>
              <option value="">Aucun</option>
              {teachers.filter((t) => t.id !== form.teacherId).map((t) => (
                <option key={t.id} value={t.id}>{t.fullName}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Du">
            <TextInput required type="date" value={form.startDate} onChange={update("startDate")} />
          </FormField>
          <FormField label="Au">
            <TextInput required type="date" value={form.endDate} onChange={update("endDate")} />
          </FormField>
        </div>
        <FormField label="Motif">
          <TextInput value={form.reason} onChange={update("reason")} placeholder="Ex : Congé maladie" />
        </FormField>
        <button type="submit" disabled={submitting} className="text-sm bg-indigo-500 text-white rounded-lg px-4 py-2.5 disabled:opacity-60 self-start">
          {submitting ? "Enregistrement" : "Enregistrer le congé"}
        </button>
      </form>

      <div className="rounded-xl border border-line bg-surface">
        <div className="px-6 py-5"><h2 className="font-display text-base text-ink">Congés déclarés</h2></div>
        {leaves.length === 0 ? (
          <EmptyState icon={IconCalendar} title="Aucun congé déclaré" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-soft border-t border-line">
                  <th className="px-6 py-3 font-medium">Enseignant</th>
                  <th className="px-6 py-3 font-medium">Période</th>
                  <th className="px-6 py-3 font-medium">Motif</th>
                  <th className="px-6 py-3 font-medium">Remplaçant</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l) => (
                  <tr key={l.id} className="border-t border-line">
                    <td className="px-6 py-3 text-ink">{l.teacherName}</td>
                    <td className="px-6 py-3 text-ink-soft">{l.startDate} → {l.endDate}</td>
                    <td className="px-6 py-3 text-ink-soft">{l.reason || "—"}</td>
                    <td className="px-6 py-3 text-ink-soft">{l.replacementName || "—"}</td>
                    <td className="px-6 py-3">
                      <button onClick={() => handleDelete(l)} className="text-xs text-danger">Supprimer</button>
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
