export default function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center text-center py-14 px-6">
      {Icon && (
        <div className="w-11 h-11 rounded-lg bg-indigo-50 flex items-center justify-center mb-4">
          <Icon className="w-5 h-5 text-indigo-500" />
        </div>
      )}
      <h3 className="font-display text-base text-ink">{title}</h3>
      {text && <p className="mt-1.5 text-sm text-ink-soft max-w-xs">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
