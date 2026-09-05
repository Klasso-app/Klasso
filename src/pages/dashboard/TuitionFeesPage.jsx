import { useEffect, useState } from "react";
import { collection, doc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { LEVELS, CLASS_NAMES_BY_LEVEL } from "../../lib/schoolLevels";
import { TextInput } from "../../components/auth/FormField";

export default function TuitionFeesPage() {
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
