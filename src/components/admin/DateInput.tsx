"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { isoToVi, parseViDate } from "@/lib/utils/date";

interface DateInputProps {
  value?: string; // ISO yyyy-mm-dd
  onChange?: (iso: string) => void;
  placeholder?: string;
}

/**
 * Date input that displays dd/mm/yyyy format.
 * Accepts and emits ISO yyyy-mm-dd strings.
 */
export default function DateInput({ value, onChange, placeholder = "dd/mm/yyyy" }: DateInputProps) {
  const [display, setDisplay] = useState(() => isoToVi(value));

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

  return (
    <Input
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={display}
      onChange={handleChange}
    />
  );
}
