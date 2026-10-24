"use client";

import { useEffect, useId, useRef } from "react";
import type { ModelInfo } from "@/lib/ranking-types";
import { taskBadgeLabel } from "@/lib/format";

type Option = { label: string; value: string };

export function OptionDialog({
  model,
  options,
  value,
  onSelect,
  onClose,
  returnFocusRef,
}: {
  model: ModelInfo;
  options: Option[];
  value: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  returnFocusRef: React.RefObject<HTMLElement | null>;
}) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const restoreTarget = returnFocusRef.current ?? prev;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      restoreTarget?.focus?.();
    };
  }, [onClose, returnFocusRef]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-3 sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="animate-rise flex max-h-[88vh] w-full max-w-lg flex-col rounded-[var(--radius)] border border-line bg-sand shadow-[var(--shadow-soft)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-leaf">
              Configure preference
            </p>
            <h2
              id={titleId}
              className="mt-1 font-[family-name:var(--font-display)] text-2xl text-ink"
            >
              {model.name}
            </h2>
            <p id={descId} className="mt-1 text-sm text-ink/60">
              {taskBadgeLabel(model.task)} · pick one option
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius)] border border-line text-ink hover:bg-fog"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <div
          role="radiogroup"
          aria-labelledby={titleId}
          className="flex-1 overflow-y-auto px-3 py-3"
        >
          {options.map((o) => {
            const active = value === o.value;
            const id = `${model.id}-${o.value.slice(0, 24)}`;
            return (
              <label
                key={o.value}
                htmlFor={id}
                className={`mb-2 flex min-h-14 cursor-pointer gap-3 rounded-[var(--radius)] border px-4 py-3 transition ${
                  active
                    ? "border-leaf-deep bg-fog"
                    : "border-transparent hover:border-line hover:bg-fog/60"
                }`}
              >
                <input
                  id={id}
                  type="radio"
                  name={`option-${model.id}`}
                  className="mt-1 size-4 accent-leaf-deep"
                  checked={active}
                  onChange={() => onSelect(o.value)}
                />
                <span className="min-w-0">
                  <span className="block text-base font-medium leading-snug text-ink">
                    {o.label}
                    {active ? (
                      <span className="ml-2 text-xs font-semibold text-leaf-deep">
                        Selected
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-ink/60">
                    {o.value}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        <div className="border-t border-line px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-[var(--radius)] px-3 text-sm font-medium text-ink/70 hover:text-ink"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
