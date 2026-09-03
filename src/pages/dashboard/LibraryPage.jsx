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
import { IconPlus, IconFile } from "../../components/icons";
import EmptyState from "../../components/dashboard/EmptyState";
import FormField, { TextInput, Select } from "../../components/auth/FormField";

const TABS = ["Catalogue", "Emprunts"];

export default function LibraryPage() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId;
  const [tab, setTab] = useState(TABS[0]);

  const [books, setBooks] = useState([]);
  const [loans, setLoans] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    const unsubs = [
      onSnapshot(query(collection(db, "schools", schoolId, "books"), orderBy("createdAt", "desc")), (snap) => {
        setBooks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }),
      onSnapshot(query(collection(db, "schools", schoolId, "loans"), orderBy("createdAt", "desc")), (snap) =>
        setLoans(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
      onSnapshot(collection(db, "schools", schoolId, "students"), (snap) =>
        setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, [schoolId]);

  const availability = useMemo(() => {
    const map = {};
    books.forEach((b) => { map[b.id] = b.quantity || 0; });
    loans.filter((l) => !l.returnedAt).forEach((l) => {
      if (map[l.bookId] !== undefined) map[l.bookId] -= 1;
    });
    return map;
  }, [books, loans]);

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

      {tab === "Catalogue" && (
        <Catalogue schoolId={schoolId} books={books} availability={availability} loading={loading} />
      )}
      {tab === "Emprunts" && (
        <Loans schoolId={schoolId} books={books} loans={loans} students={students} availability={availability} />
      )}
    </div>
  );
}

function Catalogue({ schoolId, books, availability, loading }) {
  const [showForm, setShowForm] = useState(false);

  async function handleDelete(book) {
    if (!window.confirm(`Retirer « ${book.title} » du catalogue ?`)) return;
    await deleteDoc(doc(db, "schools", schoolId, "books", book.id));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">{books.length} titre{books.length > 1 ? "s" : ""}</p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-sm bg-indigo-500 text-white rounded-lg px-4 py-2"
        >
          <IconPlus className="w-4 h-4" />
          Ajouter un livre
        </button>
      </div>

      {showForm && <NewBookForm schoolId={schoolId} onDone={() => setShowForm(false)} />}

      <div className="rounded-xl border border-line bg-surface">
        {!loading && books.length === 0 ? (
          <EmptyState icon={IconFile} title="Aucun livre au catalogue" text="Ajoutez les ouvrages disponibles pour les élèves." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-soft">
                  <th className="px-6 py-3 font-medium">Titre</th>
                  <th className="px-6 py-3 font-medium">Auteur</th>
                  <th className="px-6 py-3 font-medium">Exemplaires</th>
                  <th className="px-6 py-3 font-medium">Disponibles</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {books.map((b) => (
                  <tr key={b.id} className="border-t border-line">
                    <td className="px-6 py-3 text-ink">{b.title}</td>
                    <td className="px-6 py-3 text-ink-soft">{b.author || "—"}</td>
                    <td className="px-6 py-3 text-ink-soft">{b.quantity}</td>
                    <td className="px-6 py-3 text-ink-soft">{availability[b.id] ?? b.quantity}</td>
                    <td className="px-6 py-3">
                      <button onClick={() => handleDelete(b)} className="text-xs text-danger">Retirer</button>
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

function NewBookForm({ schoolId, onDone }) {
  const [form, setForm] = useState({ title: "", author: "", quantity: 1 });
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, "schools", schoolId, "books"), {
        ...form,
        quantity: Number(form.quantity) || 1,
        createdAt: serverTimestamp(),
      });
      setForm({ title: "", author: "", quantity: 1 });
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-surface p-6 flex flex-col gap-4">
      <h2 className="font-display text-base text-ink">Ajouter un livre</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        <FormField label="Titre">
          <TextInput required value={form.title} onChange={update("title")} />
        </FormField>
        <FormField label="Auteur">
          <TextInput value={form.author} onChange={update("author")} />
        </FormField>
        <FormField label="Nombre d'exemplaires">
          <TextInput type="number" min="1" value={form.quantity} onChange={update("quantity")} />
        </FormField>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={submitting} className="text-sm bg-indigo-500 text-white rounded-lg px-4 py-2.5 disabled:opacity-60">
          {submitting ? "Enregistrement" : "Ajouter"}
        </button>
        <button type="button" onClick={onDone} className="text-sm text-ink-soft px-4 py-2.5">Annuler</button>
      </div>
    </form>
  );
}

function Loans({ schoolId, books, loans, students, availability }) {
  const [showForm, setShowForm] = useState(false);
  const activeLoans = loans.filter((l) => !l.returnedAt);
  const pastLoans = loans.filter((l) => l.returnedAt);

  async function handleReturn(loan) {
    await updateDoc(doc(db, "schools", schoolId, "loans", loan.id), {
      returnedAt: new Date().toISOString().slice(0, 10),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-sm bg-indigo-500 text-white rounded-lg px-4 py-2"
        >
          <IconPlus className="w-4 h-4" />
          Nouvel emprunt
        </button>
      </div>

      {showForm && (
        <NewLoanForm schoolId={schoolId} books={books} students={students} availability={availability} onDone={() => setShowForm(false)} />
      )}

      <div className="rounded-xl border border-line bg-surface">
        <div className="px-6 py-5"><h2 className="font-display text-base text-ink">Emprunts en cours</h2></div>
        {activeLoans.length === 0 ? (
          <EmptyState icon={IconFile} title="Aucun emprunt en cours" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-soft border-t border-line">
                  <th className="px-6 py-3 font-medium">Livre</th>
                  <th className="px-6 py-3 font-medium">Élève</th>
                  <th className="px-6 py-3 font-medium">Emprunté le</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {activeLoans.map((l) => (
                  <tr key={l.id} className="border-t border-line">
                    <td className="px-6 py-3 text-ink">{l.bookTitle}</td>
                    <td className="px-6 py-3 text-ink-soft">{l.studentName}</td>
                    <td className="px-6 py-3 text-ink-soft">{l.borrowedAt}</td>
                    <td className="px-6 py-3">
                      <button onClick={() => handleReturn(l)} className="text-xs text-indigo-600">Marquer retourné</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pastLoans.length > 0 && (
        <div className="rounded-xl border border-line bg-surface">
          <div className="px-6 py-5"><h2 className="font-display text-base text-ink">Historique</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-soft border-t border-line">
                  <th className="px-6 py-3 font-medium">Livre</th>
                  <th className="px-6 py-3 font-medium">Élève</th>
                  <th className="px-6 py-3 font-medium">Retourné le</th>
                </tr>
              </thead>
              <tbody>
                {pastLoans.map((l) => (
                  <tr key={l.id} className="border-t border-line">
                    <td className="px-6 py-3 text-ink-soft">{l.bookTitle}</td>
                    <td className="px-6 py-3 text-ink-soft">{l.studentName}</td>
                    <td className="px-6 py-3 text-ink-soft">{l.returnedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function NewLoanForm({ schoolId, books, students, availability, onDone }) {
  const [form, setForm] = useState({ bookId: "", studentId: "", borrowedAt: new Date().toISOString().slice(0, 10) });
  const [submitting, setSubmitting] = useState(false);

  const availableBooks = books.filter((b) => (availability[b.id] ?? b.quantity) > 0);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const book = books.find((b) => b.id === form.bookId);
      const student = students.find((s) => s.id === form.studentId);
      await addDoc(collection(db, "schools", schoolId, "loans"), {
        bookId: form.bookId,
        bookTitle: book?.title || "",
        studentId: form.studentId,
        studentName: student?.fullName || "",
        borrowedAt: form.borrowedAt,
        returnedAt: null,
        createdAt: serverTimestamp(),
      });
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  if (availableBooks.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface">
        <EmptyState icon={IconFile} title="Aucun livre disponible" text="Tous les exemplaires sont actuellement empruntés, ou le catalogue est vide." />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-surface p-6 flex flex-col gap-4">
      <h2 className="font-display text-base text-ink">Enregistrer un emprunt</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        <FormField label="Livre">
          <Select required value={form.bookId} onChange={update("bookId")}>
            <option value="">Sélectionner</option>
            {availableBooks.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
          </Select>
        </FormField>
        <FormField label="Élève">
          <Select required value={form.studentId} onChange={update("studentId")}>
            <option value="">Sélectionner</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
          </Select>
        </FormField>
        <FormField label="Date d'emprunt">
          <TextInput required type="date" value={form.borrowedAt} onChange={update("borrowedAt")} />
        </FormField>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={submitting} className="text-sm bg-indigo-500 text-white rounded-lg px-4 py-2.5 disabled:opacity-60">
          {submitting ? "Enregistrement" : "Enregistrer l'emprunt"}
        </button>
        <button type="button" onClick={onDone} className="text-sm text-ink-soft px-4 py-2.5">Annuler</button>
      </div>
    </form>
  );
}
