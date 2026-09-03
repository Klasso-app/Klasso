import { useEffect, useMemo, useState } from "react";
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
import { createParentInvitation } from "../../lib/invitations";
import { generateMatricule } from "../../lib/students";
import { exportToCsv } from "../../lib/csv";
import { currentSchoolYear, nextSchoolYear } from "../../lib/schoolYear";
import { logAction } from "../../lib/auditLog";
import { IconPlus, IconUsers } from "../../components/icons";
import EmptyState from "../../components/dashboard/EmptyState";
import FormField, { TextInput, Select } from "../../components/auth/FormField";

const FILTERS = ["Actifs", "Anciens / transférés", "Tous"];

export default function StudentsPage() {
  const { profile, firebaseUser } = useAuth();
  const schoolId = profile?.schoolId;

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [reenrolling, setReenrolling] = useState(null);
  const [filter, setFilter] = useState(FILTERS[0]);

  useEffect(() => {
    if (!schoolId) return;
    const q = query(
      collection(db, "schools", schoolId, "students"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    const unsubClasses = onSnapshot(
      collection(db, "schools", schoolId, "classes"),
      (snap) => setClasses(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => {
      unsub();
      unsubClasses();
    };
  }, [schoolId]);

  const visibleStudents = useMemo(() => {
    if (filter === "Tous") return students;
    if (filter === "Actifs") return students.filter((s) => (s.status || "Actif") === "Actif");
    return students.filter((s) => (s.status || "Actif") !== "Actif");
  }, [students, filter]);

  async function handleDelete(student) {
    if (!window.confirm(`Supprimer définitivement le dossier de ${student.fullName} ?`)) return;
    await deleteDoc(doc(db, "schools", schoolId, "students", student.id));
    logAction(schoolId, {
      actorUid: firebaseUser?.uid,
      actorName: profile?.name,
      action: "Suppression d'un élève",
      details: student.fullName,
    });
  }

  async function handleTransfer(student) {
    if (!window.confirm(`Marquer ${student.fullName} comme parti(e) / transféré(e) ? Le dossier reste consultable mais sort des listes actives.`)) return;
    await updateDoc(doc(db, "schools", schoolId, "students", student.id), { status: "Transféré" });
    logAction(schoolId, {
      actorUid: firebaseUser?.uid,
      actorName: profile?.name,
      action: "Élève marqué transféré",
      details: student.fullName,
    });
  }

  async function handleReactivate(student) {
    await updateDoc(doc(db, "schools", schoolId, "students", student.id), { status: "Actif" });
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-line p-1 w-fit">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-md ${filter === f ? "bg-indigo-50 text-indigo-600 font-medium" : "text-ink-soft"}`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCsv("eleves-klasso", visibleStudents.map((s) => ({
              Matricule: s.matricule || "",
              Nom: s.fullName,
              Classe: s.classLabel || "",
              Statut: s.status || "Actif",
              "Année scolaire": s.schoolYear || "",
              "Date de naissance": s.birthDate || "",
              Tuteur: s.guardianName || "",
              "Téléphone tuteur": s.guardianPhone || "",
            })))}
            className="text-xs text-indigo-600 border border-indigo-200 rounded-md px-3 py-2"
          >
            Exporter en CSV
          </button>
          <button
            onClick={() => { setEditing(null); setShowForm((v) => !v); }}
            className="flex items-center gap-1.5 text-sm bg-indigo-500 text-white rounded-lg px-4 py-2"
          >
            <IconPlus className="w-4 h-4" />
            Nouvel élève
          </button>
        </div>
      </div>

      {(showForm || editing) && (
        <StudentForm schoolId={schoolId} classes={classes} editing={editing} onDone={closeForm} />
      )}

      {reenrolling && (
        <ReenrollForm
          schoolId={schoolId}
          classes={classes}
          student={reenrolling}
          onDone={() => setReenrolling(null)}
        />
      )}

      <div className="rounded-xl border border-line bg-surface">
        {!loading && visibleStudents.length === 0 ? (
          <EmptyState
            icon={IconUsers}
            title="Aucun élève dans cette liste"
            text="Utilisez le bouton « Nouvel élève » pour commencer les inscriptions de votre établissement."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-soft">
                  <th className="px-6 py-3 font-medium">Matricule</th>
                  <th className="px-6 py-3 font-medium">Nom complet</th>
                  <th className="px-6 py-3 font-medium">Classe</th>
                  <th className="px-6 py-3 font-medium">Année</th>
                  <th className="px-6 py-3 font-medium">Statut</th>
                  <th className="px-6 py-3 font-medium">Compte parent</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {visibleStudents.map((s) => {
                  const status = s.status || "Actif";
                  return (
                    <tr key={s.id} className="border-t border-line">
                      <td className="px-6 py-3 text-ink-soft font-mono text-xs">{s.matricule || "—"}</td>
                      <td className="px-6 py-3 text-ink">{s.fullName}</td>
                      <td className="px-6 py-3 text-ink-soft">{s.classLabel || "—"}</td>
                      <td className="px-6 py-3 text-ink-soft">{s.schoolYear || "—"}</td>
                      <td className="px-6 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-md ${status === "Actif" ? "text-success bg-success-soft" : "text-ink-soft bg-surface-tint"}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <ParentCodeCell schoolId={schoolId} student={s} />
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <button onClick={() => { setShowForm(false); setEditing(s); }} className="text-xs text-indigo-600">
                            Modifier
                          </button>
                          {status === "Actif" ? (
                            <>
                              <button onClick={() => setReenrolling(s)} className="text-xs text-indigo-600">
                                Réinscrire
                              </button>
                              <button onClick={() => handleTransfer(s)} className="text-xs text-warning">
                                Marquer transféré
                              </button>
                            </>
                          ) : (
                            <button onClick={() => handleReactivate(s)} className="text-xs text-success">
                              Réactiver
                            </button>
                          )}
                          <button onClick={() => handleDelete(s)} className="text-xs text-danger">
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ParentCodeCell({ schoolId, student }) {
  const [generating, setGenerating] = useState(false);
  const existingCode = student.parentInviteCode;

  async function handleGenerate() {
    setGenerating(true);
    try {
      const newCode = await createParentInvitation({
        schoolId,
        studentId: student.id,
        studentName: student.fullName,
      });
      await updateDoc(doc(db, "schools", schoolId, "students", student.id), {
        parentInviteCode: newCode,
      });
    } finally {
      setGenerating(false);
    }
  }

  if (existingCode) {
    return <span className="font-mono text-indigo-600 font-medium">{existingCode}</span>;
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={generating}
      className="text-xs text-indigo-600 border border-indigo-200 rounded-md px-2.5 py-1 disabled:opacity-60"
    >
      {generating ? "..." : "Générer un code"}
    </button>
  );
}

function ReenrollForm({ schoolId, classes, student, onDone }) {
  const [classLabel, setClassLabel] = useState(student.classLabel || "");
  const [submitting, setSubmitting] = useState(false);
  const targetYear = nextSchoolYear();

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateDoc(doc(db, "schools", schoolId, "students", student.id), {
        classLabel,
        schoolYear: targetYear,
        status: "Actif",
      });
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-surface p-6 flex flex-col gap-4">
      <h2 className="font-display text-base text-ink">
        Réinscrire {student.fullName} pour {targetYear}
      </h2>
      <FormField label="Nouvelle classe">
        {classes.length > 0 ? (
          <Select required value={classLabel} onChange={(e) => setClassLabel(e.target.value)}>
            <option value="">Sélectionner une classe</option>
            {classes.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </Select>
        ) : (
          <TextInput required value={classLabel} onChange={(e) => setClassLabel(e.target.value)} />
        )}
      </FormField>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={submitting} className="text-sm bg-indigo-500 text-white rounded-lg px-4 py-2.5 disabled:opacity-60">
          {submitting ? "Enregistrement" : "Confirmer la réinscription"}
        </button>
        <button type="button" onClick={onDone} className="text-sm text-ink-soft px-4 py-2.5">Annuler</button>
      </div>
    </form>
  );
}

function StudentForm({ schoolId, classes, editing, onDone }) {
  const [form, setForm] = useState({
    fullName: editing?.fullName || "",
    classLabel: editing?.classLabel || "",
    birthDate: editing?.birthDate || "",
    guardianName: editing?.guardianName || "",
    guardianPhone: editing?.guardianPhone || "",
    annualFees: editing?.annualFees ?? "",
    discountPercent: editing?.discountPercent ?? "",
  });
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        annualFees: form.annualFees === "" ? 0 : Number(form.annualFees),
        discountPercent: form.discountPercent === "" ? 0 : Number(form.discountPercent),
      };
      if (editing) {
        await updateDoc(doc(db, "schools", schoolId, "students", editing.id), payload);
      } else {
        const matricule = await generateMatricule(schoolId);
        await addDoc(collection(db, "schools", schoolId, "students"), {
          ...payload,
          matricule,
          status: "Actif",
          schoolYear: currentSchoolYear(),
          createdAt: serverTimestamp(),
        });
      }
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-line bg-surface p-6 flex flex-col gap-4"
    >
      <h2 className="font-display text-base text-ink">
        {editing ? "Modifier l'élève" : "Inscrire un élève"}
      </h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Nom complet de l'élève">
          <TextInput required value={form.fullName} onChange={update("fullName")} />
        </FormField>
        <FormField label="Classe">
          {classes.length > 0 ? (
            <Select required value={form.classLabel} onChange={update("classLabel")}>
              <option value="">Sélectionner une classe</option>
              {classes.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </Select>
          ) : (
            <TextInput
              required
              value={form.classLabel}
              onChange={update("classLabel")}
              placeholder="Ex : CM2, 6ème A"
            />
          )}
        </FormField>
        <FormField label="Date de naissance">
          <TextInput type="date" value={form.birthDate} onChange={update("birthDate")} />
        </FormField>
        <FormField label="Nom du tuteur">
          <TextInput value={form.guardianName} onChange={update("guardianName")} />
        </FormField>
        <FormField label="Téléphone du tuteur">
          <TextInput value={form.guardianPhone} onChange={update("guardianPhone")} />
        </FormField>
        <FormField label="Frais annuels (FCFA)">
          <TextInput
            type="number"
            min="0"
            value={form.annualFees}
            onChange={update("annualFees")}
            placeholder="Ex : 150000"
          />
        </FormField>
        <FormField label="Réduction / bourse (%)">
          <TextInput
            type="number"
            min="0"
            max="100"
            value={form.discountPercent}
            onChange={update("discountPercent")}
            placeholder="0"
          />
        </FormField>
      </div>

      {classes.length === 0 && (
        <p className="text-xs text-ink-soft -mt-2">
          Astuce : créez d'abord vos classes dans le module « Classes » pour pouvoir les
          sélectionner directement ici.
        </p>
      )}

      <div className="flex items-center gap-3 mt-2">
        <button
          type="submit"
          disabled={submitting}
          className="text-sm bg-indigo-500 text-white rounded-lg px-4 py-2.5 disabled:opacity-60"
        >
          {submitting ? "Enregistrement" : editing ? "Enregistrer les modifications" : "Enregistrer l'élève"}
        </button>
        <button type="button" onClick={onDone} className="text-sm text-ink-soft px-4 py-2.5">
          Annuler
        </button>
      </div>
    </form>
  );
}
