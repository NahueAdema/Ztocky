"use client";

type SimpleToggleProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
};

export function SimpleToggle({ checked, onChange, label }: SimpleToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
    >
      <span
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`}
        />
      </span>
      {label && <span>{label}</span>}
    </button>
  );
}
