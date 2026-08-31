import EmptyState from "../../components/dashboard/EmptyState";

export default function ComingSoonPage({ icon, title, text }) {
  return (
    <div className="rounded-xl border border-line bg-surface">
      <EmptyState
        icon={icon}
        title={title}
        text={text || "Ce module est en cours de construction et arrivera dans une prochaine version de Klasso."}
      />
    </div>
  );
}
