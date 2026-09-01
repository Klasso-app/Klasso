import { useEffect, useMemo, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { IconPlus, IconWallet } from "../../components/icons";
import EmptyState from "../../components/dashboard/EmptyState";
import StatCard from "../../components/dashboard/StatCard";
import FormField, { TextInput, Select } from "../../components/auth/FormField";

const METHODS = ["Espèces", "Virement", "Mobile Money", "Chèque"];

export default function FinancesPage() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId;

  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    const unsubPayments = onSnapshot(
      query(collection(db, "schools", schoolId, "payments"), orderBy("createdAt", "desc")),
      (snap) => {
        setPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }
    );
    const unsubStudents = onSnapshot(collection(db, "schools", schoolId, "students"), (snap) =>
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => {
      unsubPayments();
      unsubStudents();
    };
  }, [schoolId]);

  const total = useMemo(
    () => payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    [payments]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <StatCard icon={IconWallet} label="Total encaissé" value={formatAmount(total)} />
        <StatCard icon={IconWallet} label="Nombre de paiements" value={payments.length} />
      </div>

      <div className="flex items-center justify-end">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-sm bg-indigo-500 text-white rounded-lg px-4 py-2"
        >
          <IconPlus className="w-4 h-4" />
          Enregistrer un paiement
        </button>
      </div>

      {showForm && (
        <NewPaymentForm schoolId={schoolId} students={students} onDone={() => setShowForm(false)} />
      )}

      <div className="rounded-xl border border-line bg-surface">
        {!loading && payments.length === 0 ? (
          <EmptyState
            icon={IconWallet}
            title="Aucun paiement enregistré"
            text="Enregistrez les frais de scolarité au fur et à mesure des paiements des familles."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-soft">
                  <th className="px-6 py-3 font-medium">Élève</th>
                  <th className="px-6 py-3 font-medium">Montant</th>
                  <th className="px-6 py-3 font-medium">Moyen</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-line">
                    <td className="px-6 py-3 text-ink">{p.studentName}</td>
                    <td className="px-6 py-3 text-ink">{formatAmount(Number(p.amount) || 0)}</td>
                    <td className="px-6 py-3 text-ink-soft">{p.method}</td>
                    <td className="px-6 py-3 text-ink-soft">{p.date}</td>
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

function NewPaymentForm({ schoolId, students, onDone }) {
  const [form, setForm] = useState({
    studentId: "",
    amount: "",
    method: METHODS[0],
    date: new Date().toISOString().slice(0, 10),
  });
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const student = students.find((s) => s.id === form.studentId);
      await addDoc(collection(db, "schools", schoolId, "payments"), {
        studentId: form.studentId,
        studentName: student?.fullName || "Élève",
        amount: Number(form.amount),
        method: form.method,
        date: form.date,
        createdAt: serverTimestamp(),
      });
      setForm({ studentId: "", amount: "", method: METHODS[0], date: new Date().toISOString().slice(0, 10) });
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-surface p-6 flex flex-col gap-4">
      <h2 className="font-display text-base text-ink">Enregistrer un paiement</h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Élève">
          <Select required value={form.studentId} onChange={update("studentId")}>
            <option value="">Sélectionner un élève</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.fullName}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Montant (FCFA)">
          <TextInput required type="number" min="0" value={form.amount} onChange={update("amount")} />
        </FormField>
        <FormField label="Moyen de paiement">
          <Select value={form.method} onChange={update("method")}>
            {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
        </FormField>
        <FormField label="Date">
          <TextInput required type="date" value={form.date} onChange={update("date")} />
        </FormField>
      </div>

      <div className="flex items-center gap-3 mt-2">
        <button
          type="submit"
          disabled={submitting}
          className="text-sm bg-indigo-500 text-white rounded-lg px-4 py-2.5 disabled:opacity-60"
        >
          {submitting ? "Enregistrement" : "Enregistrer"}
        </button>
        <button type="button" onClick={onDone} className="text-sm text-ink-soft px-4 py-2.5">
          Annuler
        </button>
      </div>
    </form>
  );
}

function formatAmount(n) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}
