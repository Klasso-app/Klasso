export default function StatCard({ icon: Icon, label, value, trend, trendDirection = "up" }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center gap-2 text-ink-soft">
        {Icon && <Icon className="w-4 h-4" />}
        <span className="text-sm">{label}</span>
      </div>
      <div className="mt-2.5 flex items-baseline gap-2">
        <span className="font-display text-2xl text-ink">{value}</span>
        {trend && (
          <span
            className={`text-xs px-1.5 py-0.5 rounded-md ${
              trendDirection === "up" ? "text-success bg-success-soft" : "text-danger bg-danger-soft"
            }`}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
