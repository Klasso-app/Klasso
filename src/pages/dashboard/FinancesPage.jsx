import { useEffect, useMemo, useState } from "react";
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
import { downloadReceipt } from "../../lib/receipt";
import { exportToCsv } from "../../lib/csv";
import { IconPlus, IconWallet, IconFile } from "../../components/icons";
import EmptyState from "../../components/dashboard/EmptyState";
import StatCard from "../../components/dashboard/StatCard";
import FormField, { TextInput, Select } from "../../components/auth/FormField";

const METHODS = ["Espèces", "Virement", "Mobile Money", "Chèque"];
const EXPENSE_CATEGORIES = ["Salaires", "Fournitures", "Entretien", "Électricité / Eau", "Transport", "Autre"];

export default function FinancesPage() {
  const { profile, school } = useAuth();
  const schoolId = profile?.schoolId;

  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    const unsubPayments = onSnapshot(
      query(collection(db, "schools", schoolId, "payments"), orderBy("createdAt", "desc")),
      (snap) => {
        setPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }
    );
    const unsubExpenses = onSnapshot(
      query(collection(db, "schools", schoolId, "expenses"), orderBy("createdAt", "desc")),
      (snap) => setExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubStudents = onSnapshot(collection(db, "schools", schoolId, "students"), (snap) =>
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => {
      unsubPayments();
      unsubExpenses();
      unsubStudents();
    };
  }, [schoolId]);

  const totalIncome = useMemo(
    () => payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    [payments]
  );
  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [expenses]
  );

  const balances = useMemo(() => {
    return students.map((s) => {
      const due = (Number(s.annualFees) || 0) * (1 - (Number(s.discountPercent) || 0) / 100);
      const paid = payments
        .filter((p) => p.studentId === s.id)
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      return { student: s, due, paid, remaining: Math.max(due - paid, 0) };
    });
  }, [students, payments]);

  const totalDue = balances.reduce((s, b) => s + b.due, 0);
  const totalUnpaid = balances.reduce((s, b) => s + b.remaining, 0);

  async function handleDeletePayment(p) {
    if (!window.confirm(`Supprimer ce paiement de ${p.studentName} ?`)) return;
    await deleteDoc(doc(db, "schools", schoolId, "payments", p.id));
  }

  async function handleDeleteExpense(e) {
    if (!window.confirm(`Supprimer la dépense « ${e.label} » ?`)) return;
    await deleteDoc(doc(db, "schools", schoolId, "expenses", e.id));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={IconWallet} label="Total encaissé" value={formatAmount(totalIncome)} />
        <StatCard icon={IconWallet} label="Total dépenses" value={formatAmount(totalExpenses)} />
        <StatCard icon={IconWallet} label="Solde net" value={formatAmount(totalIncome - totalExpenses)} />
        <StatCard icon={IconWallet} label="Impayés (frais dus)" value={formatAmount(totalUnpaid)} />
      </div>

      {/* Échéancier / soldes par élève */}
      <div className="rounded-xl border border-line bg-surface">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5">
          <h2 className="font-display text-base text-ink">Échéancier par élève</h2>
          <button
            onClick={() => exportToCsv("echeancier-klasso", balances.map((b) => ({
              Matricule: b.student.matricule || "",
              Élève: b.student.fullName,
              Classe: b.student.classLabel || "",
              "Frais dus (FCFA)": Math.round(b.due),
              "Payé (FCFA)": b.paid,
              "Solde restant (FCFA)": Math.round(b.remaining),
            })))}
            className="text-xs text-indigo-600 border border-indigo-200 rounded-md px-3 py-2 self-start"
          >
            Exporter en CSV
          </button>
        </div>
        {balances.length === 0 ? (
          <EmptyState icon={IconWallet} title="Aucun élève inscrit" text="Les soldes apparaîtront ici une fois des élèves inscrits." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-soft border-t border-line">
                  <th className="px-6 py-3 font-medium">Élève</th>
                  <th className="px-6 py-3 font-medium">Frais dus</th>
                  <th className="px-6 py-3 font-medium">Payé</th>
                  <th className="px-6 py-3 font-medium">Solde</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {balances.map(({ student, due, paid, remaining }) => (
                  <tr key={student.id} className="border-t border-line">
                    <td className="px-6 py-3 text-ink">{student.fullName}</td>
                    <td className="px-6 py-3 text-ink-soft">{formatAmount(due)}</td>
                    <td className="px-6 py-3 text-ink-soft">{formatAmount(paid)}</td>
                    <td className="px-6 py-3">
                      <span className={remaining > 0 ? "text-danger font-medium" : "text-success"}>
                        {formatAmount(remaining)}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {remaining > 0 && student.guardianPhone && (
                        <a
                          href={buildReminderLink(student, remaining)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-indigo-600 border border-indigo-200 rounded-md px-2.5 py-1.5"
                        >
                          Relancer
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paiements */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base text-ink">Paiements enregistrés</h2>
        <button
          onClick={() => setShowPaymentForm((v) => !v)}
          className="flex items-center gap-1.5 text-sm bg-indigo-500 text-white rounded-lg px-4 py-2"
        >
          <IconPlus className="w-4 h-4" />
          Enregistrer un paiement
        </button>
      </div>

      {showPaymentForm && (
        <NewPaymentForm schoolId={schoolId} students={students} onDone={() => setShowPaymentForm(false)} />
      )}

      <div className="rounded-xl border border-line bg-surface">
        {!loading && payments.length === 0 ? (
          <EmptyState icon={IconWallet} title="Aucun paiement enregistré" text="Enregistrez les frais de scolarité au fur et à mesure des paiements." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-soft">
                  <th className="px-6 py-3 font-medium">Élève</th>
                  <th className="px-6 py-3 font-medium">Montant</th>
                  <th className="px-6 py-3 font-medium">Moyen</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-line">
                    <td className="px-6 py-3 text-ink">{p.studentName}</td>
                    <td className="px-6 py-3 text-ink">{formatAmount(Number(p.amount) || 0)}</td>
                    <td className="px-6 py-3 text-ink-soft">{p.method}</td>
                    <td className="px-6 py-3 text-ink-soft">{p.date}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => downloadReceipt({ school, payment: p })}
                          className="flex items-center gap-1 text-xs text-indigo-600"
                        >
                          <IconFile className="w-3.5 h-3.5" />
                          Reçu
                        </button>
                        <button onClick={() => handleDeletePayment(p)} className="text-xs text-danger">
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

      {/* Dépenses */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base text-ink">Dépenses de l'établissement</h2>
        <button
          onClick={() => setShowExpenseForm((v) => !v)}
          className="flex items-center gap-1.5 text-sm bg-indigo-500 text-white rounded-lg px-4 py-2"
        >
          <IconPlus className="w-4 h-4" />
          Ajouter une dépense
        </button>
      </div>

      {showExpenseForm && (
        <NewExpenseForm schoolId={schoolId} onDone={() => setShowExpenseForm(false)} />
      )}

      <div className="rounded-xl border border-line bg-surface">
        {expenses.length === 0 ? (
          <EmptyState icon={IconWallet} title="Aucune dépense enregistrée" text="Suivez ici les sorties d'argent de l'établissement (salaires, fournitures, entretien...)." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-soft">
                  <th className="px-6 py-3 font-medium">Libellé</th>
                  <th className="px-6 py-3 font-medium">Catégorie</th>
                  <th className="px-6 py-3 font-medium">Montant</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-t border-line">
                    <td className="px-6 py-3 text-ink">{e.label}</td>
                    <td className="px-6 py-3 text-ink-soft">{e.category}</td>
                    <td className="px-6 py-3 text-ink">{formatAmount(Number(e.amount) || 0)}</td>
                    <td className="px-6 py-3 text-ink-soft">{e.date}</td>
                    <td className="px-6 py-3">
                      <button onClick={() => handleDeleteExpense(e)} className="text-xs text-danger">
                        Supprimer
                      </button>
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
            {students.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
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
        <button type="submit" disabled={submitting} className="text-sm bg-indigo-500 text-white rounded-lg px-4 py-2.5 disabled:opacity-60">
          {submitting ? "Enregistrement" : "Enregistrer"}
        </button>
        <button type="button" onClick={onDone} className="text-sm text-ink-soft px-4 py-2.5">Annuler</button>
      </div>
    </form>
  );
}

function NewExpenseForm({ schoolId, onDone }) {
  const [form, setForm] = useState({
    label: "",
    category: EXPENSE_CATEGORIES[0],
    amount: "",
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
      await addDoc(collection(db, "schools", schoolId, "expenses"), {
        ...form,
        amount: Number(form.amount),
        createdAt: serverTimestamp(),
      });
      setForm({ label: "", category: EXPENSE_CATEGORIES[0], amount: "", date: new Date().toISOString().slice(0, 10) });
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-surface p-6 flex flex-col gap-4">
      <h2 className="font-display text-base text-ink">Ajouter une dépense</h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Libellé">
          <TextInput required value={form.label} onChange={update("label")} placeholder="Ex : Salaire enseignants — janvier" />
        </FormField>
        <FormField label="Catégorie">
          <Select value={form.category} onChange={update("category")}>
            {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </FormField>
        <FormField label="Montant (FCFA)">
          <TextInput required type="number" min="0" value={form.amount} onChange={update("amount")} />
        </FormField>
        <FormField label="Date">
          <TextInput required type="date" value={form.date} onChange={update("date")} />
        </FormField>
      </div>

      <div className="flex items-center gap-3 mt-2">
        <button type="submit" disabled={submitting} className="text-sm bg-indigo-500 text-white rounded-lg px-4 py-2.5 disabled:opacity-60">
          {submitting ? "Enregistrement" : "Enregistrer"}
        </button>
        <button type="button" onClick={onDone} className="text-sm text-ink-soft px-4 py-2.5">Annuler</button>
      </div>
    </form>
  );
}

function buildReminderLink(student, remaining) {
  const phone = (student.guardianPhone || "").replace(/[^0-9+]/g, "");
  const message = `Bonjour, nous vous rappelons que le solde des frais de scolarité de ${student.fullName} s'élève à ${formatAmount(remaining)}. Merci de régulariser dès que possible.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function formatAmount(n) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
}
