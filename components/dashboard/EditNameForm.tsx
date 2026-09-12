"use client";

import { useState } from "react";
import { updateDisplayName } from "@/app/[locale]/konto/actions";

export function EditNameForm({
  currentName,
  label,
  placeholder,
  saveLabel,
  cancelLabel,
}: {
  currentName: string;
  label: string;
  placeholder: string;
  saveLabel: string;
  cancelLabel: string;
}) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className="text-xs text-muted underline decoration-dotted hover:text-foreground">
        {label}
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await updateDisplayName(formData);
        setEditing(false);
      }}
      className="flex items-center gap-2"
    >
      <input
        type="text"
        name="displayName"
        defaultValue={currentName}
        placeholder={placeholder}
        maxLength={60}
        autoFocus
        className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-foreground placeholder:text-muted outline-none focus:border-white/25"
      />
      <button type="submit" className="rounded-full bg-gradient-accent px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-90">
        {saveLabel}
      </button>
      <button type="button" onClick={() => setEditing(false)} className="text-xs text-muted hover:text-foreground">
        {cancelLabel}
      </button>
    </form>
  );
}
