import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, X } from "lucide-react";

/**
 * Contextual tooltip for an onboarding step.
 * - Click trigger to open, ESC / outside-click / X to dismiss.
 * - Dismissing marks the step complete via onDismiss().
 */
export function StepTooltip({
  trigger,
  title,
  body,
  to,
  ctaLabel,
  onDismiss,
}: {
  trigger: ReactNode;
  title: string;
  body: string;
  to: string;
  ctaLabel: string;
  onDismiss: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") close(); }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function close() {
    setOpen(false);
    onDismiss();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="w-full text-left"
      >
        {trigger}
      </button>
      {open && (
        <div
          role="dialog"
          className="absolute left-0 right-0 top-full z-30 mt-2 rounded-xl border border-[color:var(--ds-border)] bg-[color:var(--ds-surface)] p-4 shadow-2xl sm:left-auto sm:right-0 sm:w-[320px]"
        >
          <button
            onClick={close}
            aria-label="Dismiss"
            className="absolute right-3 top-3 text-[color:var(--ds-muted)] hover:text-[color:var(--ds-fg)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <div className="pr-6 font-display text-base leading-tight">{title}</div>
          <p className="mt-2 text-[12px] leading-relaxed text-[color:var(--ds-muted)]">{body}</p>
          <Link
            to={to as never}
            onClick={close}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--ds-accent)] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[color:var(--ds-accent-fg)]"
          >
            {ctaLabel} <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
