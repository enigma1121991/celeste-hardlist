"use client";

import React, { useState, useEffect, useMemo } from "react";
import { countries, getCountryCode } from "countries-list";
import { TwemojiFlag } from "@/components/utils/country";

type Country = { code: string; name: string };

interface CountrySelectProps {
  value?: string | null;
  onChange?: (code: string) => void;
}

export default function CountrySelect({ value, onChange }: CountrySelectProps) {
  const allCountries = useMemo(() => {
    return Object.entries(countries).map(([code, data]) => ({
      code,
      name: data.name,
    })) as Country[];
  }, []);
  
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(value ?? null);

  useEffect(() => {
    setSelected(value ?? null);
  }, [value])

  const filtered = useMemo(
    () =>
      allCountries.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      ),
    [allCountries, search]
  );

  const handleSelect = (code: string) => {
    setSelected(code);
    setOpen(false);
    onChange?.(code);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
          selected
            ? "bg-[var(--accent)] text-white font-bold"
            : "text-[var(--foreground-muted)] border border-[var(--border)] bg-[var(--background)]"
        }`}
        title={selected ? `Selected: ${selected}` : "Select country"}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? (
          <>
            <TwemojiFlag code={selected} />
            <span className="truncate">
              {allCountries.find((c) => c.code === selected)?.name || selected}
            </span>
          </>
        ) : (
          "Select Country"
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-56 rounded border border-[var(--border)] bg-[var(--background-elevated)] shadow-lg p-2">
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search countries..."
            className="w-full mb-2 px-2 py-1 text-xs rounded border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none"
            aria-label="Search countries"
          />
          <div
            role="listbox"
            aria-activedescendant={selected ?? undefined}
            className="max-h-48 overflow-y-auto text-xs"
          >
            {filtered.map((country) => (
              <button
                key={country.code}
                onClick={() => handleSelect(country.code)}
                className={`flex items-center gap-2 w-full text-left px-2 py-1 rounded hover:bg-[var(--background-hover)] ${
                  selected === country.code
                    ? "bg-[var(--accent)] text-white font-bold"
                    : "text-[var(--foreground)]"
                }`}
                role="option"
                aria-selected={selected === country.code}
              >
                <TwemojiFlag code={country.code} />
                <span className="truncate">{country.name}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="text-[var(--foreground-muted)] text-center py-2">
                No results
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}