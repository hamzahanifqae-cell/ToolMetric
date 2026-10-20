import { useState, type ReactNode } from "react";
import { secondaryButtonClass } from "./inputClasses.js";

interface ResultCardProps {
  label: string;
  children: ReactNode;
  copyText?: string;
}

export function ResultCard({ label, children, copyText }: ResultCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-lg border border-teal-200 bg-teal-50 p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">{label}</p>
        {copyText && (
          <button type="button" onClick={handleCopy} className={secondaryButtonClass + " !py-1 !px-2 text-xs"}>
            {copied ? "Copied!" : "Copy"}
          </button>
        )}
      </div>
      <div className="mt-2 text-navy-900">{children}</div>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-800">
      {message}
    </div>
  );
}
