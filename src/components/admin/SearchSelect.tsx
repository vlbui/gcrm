"use client";

import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";

export interface SearchSelectOption {
  value: string;
  label: string;
}

interface SearchSelectProps {
  options: SearchSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchSelect({ options, value, onChange, placeholder = "Tìm kiếm..." }: SearchSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setQuery("");
    setOpen(false);
  };

  const handleFocus = () => {
    setOpen(true);
    setQuery("");
  };

  return (
    <div className="search-select" ref={wrapperRef}>
      <div className="search-select-input" onClick={() => { setOpen(true); inputRef.current?.focus(); }}>
        <Search size={14} className="search-select-icon" />
        <input
          ref={inputRef}
          type="text"
          placeholder={selected ? selected.label : placeholder}
          value={open ? query : ""}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={handleFocus}
          className={selected && !open ? "has-value" : ""}
        />
      </div>
      {open && (
        <div className="search-select-dropdown">
          {filtered.length === 0 ? (
            <div className="search-select-empty">Không tìm thấy</div>
          ) : (
            filtered.slice(0, 50).map((o) => (
              <div
                key={o.value}
                className={`search-select-option${o.value === value ? " active" : ""}`}
                onClick={() => handleSelect(o.value)}
              >
                {o.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
