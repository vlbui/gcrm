"use client";

import { useState, useEffect, useRef } from "react";
import { CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { isoToVi, parseViDate } from "@/lib/utils/date";

interface DateInputProps {
  value?: string; // ISO yyyy-mm-dd
  onChange?: (iso: string) => void;
  placeholder?: string;
}

/**
 * Date input that displays dd/mm/yyyy format with a native date picker button.
 * Accepts and emits ISO yyyy-mm-dd strings.
 */
export default function DateInput({ value, onChange, placeholder = "dd/mm/yyyy" }: DateInputProps) {
  const [display, setDisplay] = useState(() => isoToVi(value));
  const pickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplay(isoToVi(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/[^\d/]/g, "");

    // Auto-insert slashes
    const digits = v.replace(/\//g, "");
    if (digits.length >= 4 && !v.includes("/")) {
      v = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4, 8);
    } else if (digits.length >= 2 && v.split("/").length < 2) {
      v = digits.slice(0, 2) + "/" + digits.slice(2);
    }

    if (v.length > 10) v = v.slice(0, 10);
    setDisplay(v);

    // Emit ISO when complete
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
      onChange?.(parseViDate(v));
    } else if (v === "") {
      onChange?.("");
    }
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const iso = e.target.value; // yyyy-mm-dd
    if (iso) {
      setDisplay(isoToVi(iso));
      onChange?.(iso);
    }
  };

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <Input
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={display}
        onChange={handleChange}
        style={{ paddingRight: 36 }}
      />
      <button
        type="button"
        onClick={() => pickerRef.current?.showPicker()}
        style={{
          position: "absolute",
          right: 8,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 2,
          display: "flex",
          alignItems: "center",
          color: "var(--muted-foreground, #888)",
        }}
      >
        <CalendarDays size={16} />
      </button>
      <input
        ref={pickerRef}
        type="date"
        value={value || ""}
        onChange={handlePickerChange}
        style={{
          position: "absolute",
          right: 8,
          width: 20,
          height: 20,
          opacity: 0,
          pointerEvents: "none",
        }}
        tabIndex={-1}
      />
    </div>
  );
}
