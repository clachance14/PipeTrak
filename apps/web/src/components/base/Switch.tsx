"use client";

export function Switch({
  options,
  value,
  onChange,
  className,
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      className={`${className} flex justify-center rounded-xl bg-zinc-100 p-1 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300`}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`block flex-1 rounded-lg px-6 py-1.5 text-xs ${
            option.value === value
              ? "bg-white font-bold text-zinc-900 dark:bg-zinc-900 dark:text-white"
              : ""
          }`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
