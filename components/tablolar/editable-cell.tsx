"use client";

import { useState } from "react";

export function EditableCell({
  value,
  type = "text",
  onSave,
  align = "left",
}: {
  value: string | number;
  type?: "text" | "number";
  onSave: (value: string) => Promise<void> | void;
  align?: "left" | "right";
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [saving, setSaving] = useState(false);

  async function commit() {
    const changed = draft !== String(value);
    setEditing(false);
    if (!changed) return;
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <input
        autoFocus
        type={type}
        defaultValue={value}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(String(value));
            setEditing(false);
          }
        }}
        className={`w-full border-2 border-green bg-card px-1.5 py-[3px] text-[12.5px] outline-none ${
          align === "right" ? "text-right" : ""
        }`}
      />
    );
  }

  return (
    <div
      onDoubleClick={() => {
        setDraft(String(value));
        setEditing(true);
      }}
      title="Düzenlemek için çift tıklayın"
      className={`cursor-text px-1.5 py-1 hover:bg-green-soft ${saving ? "opacity-50" : ""} ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {value}
    </div>
  );
}
