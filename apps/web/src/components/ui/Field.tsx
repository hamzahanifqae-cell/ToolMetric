import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, hint, error, children }: FieldProps) {
  const errorId = error ? `${htmlFor}-error` : undefined;
  const hintId = hint ? `${htmlFor}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-navy-800">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={hintId} className="text-xs text-navy-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function fieldDescribedBy(htmlFor: string, hint?: string, error?: string): string | undefined {
  if (error) return `${htmlFor}-error`;
  if (hint) return `${htmlFor}-hint`;
  return undefined;
}
