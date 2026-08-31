export default function KlassoLogo({ size = 32, withWordmark = true, className = "" }) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
        <rect width="100" height="100" rx="22" fill="#3B4FE0" />
        <rect x="20" y="66" width="14" height="18" rx="3" fill="#FFFFFF" />
        <rect x="43" y="50" width="14" height="34" rx="3" fill="#FFFFFF" />
        <rect x="66" y="30" width="14" height="54" rx="3" fill="#FFFFFF" />
        <circle cx="73" cy="21" r="7" fill="#C6703B" />
      </svg>
      {withWordmark && (
        <span
          className="font-display font-medium text-ink"
          style={{ fontSize: size * 0.68 }}
        >
          <span className="text-indigo-500">K</span>lasso
        </span>
      )}
    </div>
  );
}
