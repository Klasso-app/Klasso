import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { LEVELS, CLASS_NAMES_BY_LEVEL } from "../../lib/schoolLevels";
import { IconPlus, IconWallet } from "../../components/icons";
import EmptyState from "../../components/dashboard/EmptyState";
import FormField, { TextInput, Select } from "../../components/auth/FormField";

const TABS = ["Frais de scolarité", "Autres frais"];

export default function TuitionFeesPage() {
  const [tab, setTab] = useState(TABS[0]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-1 rounded-lg border border-line p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-xs px-3 py-1.5 rounded-md ${tab === t ? "bg-indigo-50 text-indigo-600 font-medium" : "text-ink-soft"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Frais de scolarité" && <TuitionByClass />}
      {tab === "Autres frais" && <OtherFees />}
    </div>
  );
}

/* ---------- Frais de scolarité par classe ---------- */

function TuitionByClass() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId;

  const [fees, setFees] = useState({});
  const [amounts, setAmounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    const unsub = onSnapshot(collection(db, "schools", schoolId, "tuitionFees"), (snap) => {
      const map = {};
      snap.docs.forEach((d) => { map[d.id] = d.data().amount; });
      setFees(map);
      setAmounts(map);
      setLoading(false);
    });
    return unsub;
  }, [schoolId]);

  function updateAmount(className, value) {
    setSaved(false);
    setAmounts((a) => ({ ...a, [className]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const changed = Object.keys(amounts).filter((name) => amounts[name] !== fees[name]);
      await Promise.all(
        changed.map((className) => {
          const level = LEVELS.find((lvl) => CLASS_NAMES_BY_LEVEL[lvl].includes(className));
          return setDoc(
            doc(db, "schools", schoolId, "tuitionFees", className),
            {
              className,
              level,
              amount: amounts[className] === "" ? 0 : Number(amounts[className]),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        })
      );
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-ink-soft max-w-lg">
        Définissez le montant des frais de scolarité pour chaque classe. Ce montant se
        remplira automatiquement lorsqu'un élève est inscrit ou réinscrit dans cette classe
        (modifiable au cas par cas si besoin, par exemple pour une bourse).
      </p>

      {LEVELS.map((level) => (
        <div key={level} className="rounded-xl border border-line bg-surface">
          <div className="px-6 py-5">
            <h2 className="font-display text-base text-ink">{level}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-soft border-t border-line">
                  <th className="px-6 py-3 font-medium">Classe</th>
                  <th className="px-6 py-3 font-medium">Frais annuels (FCFA)</th>
                </tr>
              </thead>
              <tbody>
                {CLASS_NAMES_BY_LEVEL[level].map((className) => (
                  <tr key={className} className="border-t border-line">
                    <td className="px-6 py-3 text-ink">{className}</td>
                    <td className="px-6 py-3">
                      <TextInput
                        type="number"
                        min="0"
                        value={amounts[className] ?? ""}
                        onChange={(e) => updateAmount(className, e.target.value)}
                        placeholder="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm bg-indigo-500 text-white rounded-lg px-4 py-2.5 disabled:opacity-60"
        >
          {saving ? "Enregistrement" : "Enregistrer les tarifs"}
        </button>
        {saved && <span className="text-sm text-success">Tarifs enregistrés</span>}
      </div>
    </div>
  );
}

/* ---------- Autres frais (catalogue) ---------- */

const TIMINGS = ["À l'inscription", "À la rentrée", "En cours d'année"];

function OtherFees() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId;

  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    if (!schoolId) return;
    const q = query(collection(db, "schools", schoolId, "otherFees"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setFees(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [schoolId]);

  async function handleDelete(fee) {
    if (!window.confirm(`Supprimer « ${fee.name} » de la liste des autres frais ?`)) return;
    await deleteDoc(doc(db, "schools", schoolId, "otherFees", fee.id));
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-ink-soft max-w-lg">
        Répertoriez les frais que les élèves paient en dehors de la scolarité : frais
        d'inscription, tenue scolaire, examen blanc, carte d'identité scolaire, etc.
      </p>

      <div className="flex items-center justify-end">
        <button
          onClick={() => { setEditing(null); setShowForm((v) => !v); }}
          className="flex items-center gap-1.5 text-sm bg-indigo-500 text-white rounded-lg px-4 py-2"
        >
          <IconPlus className="w-4 h-4" />
          Nouveau frais
        </button>
      </div>

      {(showForm || editing) && (
        <OtherFeeForm schoolId={schoolId} editing={editing} onDone={closeForm} />
      )}

      <div className="rounded-xl border border-line bg-surface">
        {!loading && fees.length === 0 ? (
          <EmptyState
            icon={IconWallet}
            title="Aucun autre frais défini"
            text="Ajoutez les frais ponctuels ou annexes que vos élèves doivent régler."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-soft">
                  <th className="px-6 py-3 font-medium">Libellé</th>
                  <th className="px-6 py-3 font-medium">Montant</th>
                  <th className="px-6 py-3 font-medium">Moment</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {fees.map((f) => (
                  <tr key={f.id} className="border-t border-line">
                    <td className="px-6 py-3 text-ink">{f.name}</td>
                    <td className="px-6 py-3 text-ink-soft">
                      {new Intl.NumberFormat("fr-FR").format(f.amount)} FCFA
                    </td>
                    <td className="px-6 py-3 text-ink-soft">{f.timing}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <button onClick={() => { setShowForm(false); setEditing(f); }} className="text-xs text-indigo-600">
                          Modifier
                        </button>
                        <button onClick={() => handleDelete(f)} className="text-xs text-danger">
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

function OtherFeeForm({ schoolId, editing, onDone }) {
  const [form, setForm] = useState({
    name: editing?.name || "",
    amount: editing?.amount ?? "",
    timing: editing?.timing || TIMINGS[0],
  });
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, amount: form.amount === "" ? 0 : Number(form.amount) };
      if (editing) {
        await updateDoc(doc(db, "schools", schoolId, "otherFees", editing.id), payload);
      } else {
        await addDoc(collection(db, "schools", schoolId, "otherFees"), { ...payload, createdAt: serverTimestamp() });
      }
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-surface p-6 flex flex-col gap-4">
      <h2 className="font-display text-base text-ink">{editing ? "Modifier le frais" : "Ajouter un frais"}</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        <FormField label="Libellé">
          <TextInput required value={form.name} onChange={update("name")} placeholder="Ex : Frais d'inscription" />
        </FormField>
        <FormField label="Montant (FCFA)">
          <TextInput required type="number" min="0" value={form.amount} onChange={update("amount")} />
        </FormField>
        <FormField label="Moment du paiement">
          <Select value={form.timing} onChange={update("timing")}>
            {TIMINGS.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </FormField>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={submitting} className="text-sm bg-indigo-500 text-white rounded-lg px-4 py-2.5 disabled:opacity-60">
          {submitting ? "Enregistrement" : editing ? "Enregistrer les modifications" : "Ajouter"}
        </button>
        <button type="button" onClick={onDone} className="text-sm text-ink-soft px-4 py-2.5">Annuler</button>
      </div>
    </form>
  );
}
