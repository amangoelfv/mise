"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Close } from "./icons";

/** Native <dialog> as a centered sheet: focus trapping, Esc and backdrop for free. */
export function Dialog({
  open,
  onClose,
  title,
  children,
  wide = false,
  focusFirstField = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
  /** Off for tap-first forms, where focusing a number field pops the mobile keyboard. */
  focusFirstField?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // showModal() focuses the first focusable (the close button); prefer the first field.
      if (focusFirstField) dialog.querySelector<HTMLElement>("input, textarea, select")?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, focusFirstField]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={`sheet m-auto w-[calc(100%-2rem)] rounded-2xl border border-line bg-ink-2 p-0 text-paper ${wide ? "max-w-2xl" : "max-w-md"}`}
    >
      {open && (
        <div className="p-6 sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight [font-stretch:110%]">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid size-9 place-items-center rounded-[10px] text-paper/50 transition hover:bg-ink-3 hover:text-paper"
            >
              <Close size={18} />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
