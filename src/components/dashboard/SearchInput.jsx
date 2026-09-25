import { IconSearch } from "../icons";

export default function SearchInput({ value, onChange, placeholder = "Rechercher...", className = "" }) {
  return (
    <div className={`flex items-center gap-2 border border-line rounded-lg px-3 py-2 ${className}`}>
      <IconSearch className="w-4 h-4 text-ink-soft shrink-0" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="text-sm outline-none placeholder:text-ink-soft/60 w-full bg-transparent"
      />
    </div>
  );
}
