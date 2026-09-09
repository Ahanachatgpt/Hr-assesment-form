"use client";

import { useEffect, useState } from "react";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function ordinal(n: number) {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return `${n}st`;
  if (j === 2 && k !== 12) return `${n}nd`;
  if (j === 3 && k !== 13) return `${n}rd`;
  return `${n}th`;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function parseIso(value: unknown) {
  const raw = String(value ?? "").trim();
  const m3 = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (m3) return { year: m3[1], month: String(Number(m3[2])), day: String(Number(m3[3])) };
  const m2 = /^(\d{4})-(\d{2})$/.exec(raw);
  if (m2) return { year: m2[1], month: String(Number(m2[2])), day: "" };
  return { year: "", month: "", day: "" };
}

function daysInMonth(year: string, month: string) {
  if (!year || !month) return 31;
  return new Date(Number(year), Number(month), 0).getDate();
}

function yearRange(label: string) {
  const now = new Date().getFullYear();
  const dob = /birth/i.test(label);
  const minY = dob ? now - 80 : 1970;
  const maxY = dob ? now - 15 : now + 2;
  const years: number[] = [];
  for (let y = maxY; y >= minY; y--) years.push(y);
  return years;
}

function toIso(year: string, month: string, day: string) {
  if (!year || !month || !day) return "";
  const dim = daysInMonth(year, month);
  const d = Math.min(Number(day), dim);
  return `${year}-${pad(Number(month))}-${pad(d)}`;
}

export function DateDropdowns({
  value,
  onChange,
  disabled,
  error,
  label = "",
  compact = false,
  hideDay = false,
}: {
  value: unknown;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  label?: string;
  compact?: boolean;
  hideDay?: boolean;
}) {
  const fromValue = parseIso(value);
  const [year, setYear] = useState(fromValue.year);
  const [month, setMonth] = useState(fromValue.month);
  const [day, setDay] = useState(fromValue.day);

  useEffect(() => {
    const p = parseIso(value);
    if (p.year && p.month) {
      setYear(p.year);
      setMonth(p.month);
      if (p.day) setDay(p.day);
    }
  }, [String(value ?? "")]);

  const years = yearRange(label);
  const dim = daysInMonth(year, month);
  const dayValue = day && Number(day) > dim ? String(dim) : day;
  const invalid = error ? "field-invalid" : undefined;

  function update(part: "year" | "month" | "day", next: string) {
    const y = part === "year" ? next : year;
    const m = part === "month" ? next : month;
    let d = part === "day" ? next : day;
    const max = daysInMonth(y, m);
    if (d && Number(d) > max) d = String(max);
    setYear(y);
    setMonth(m);
    setDay(d);
    if (hideDay) {
      onChange(y && m ? `${y}-${pad(Number(m))}` : "");
    } else {
      onChange(toIso(y, m, d));
    }
  }

  const monthNames = compact ? MONTHS_SHORT : MONTHS;

  if (hideDay) {
    return (
      <div className={`grid min-w-0 grid-cols-2 ${compact ? "gap-1.5" : "gap-2"}`}>
        <select
          aria-label="Month"
          disabled={disabled}
          className={`min-w-0 max-w-full ${invalid || ""} ${compact ? "!px-1.5 sm:!px-2" : ""}`.trim()}
          value={month}
          onChange={(e) => update("month", e.target.value)}
        >
          <option value="">Month</option>
          {monthNames.map((name, i) => (
            <option key={MONTHS[i]} value={String(i + 1)}>
              {name}
            </option>
          ))}
        </select>
        <select
          aria-label="Year"
          disabled={disabled}
          className={`min-w-0 max-w-full ${invalid || ""} ${compact ? "!px-1.5 sm:!px-2" : ""}`.trim()}
          value={year}
          onChange={(e) => update("year", e.target.value)}
        >
          <option value="">Year</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={`grid min-w-0 grid-cols-3 ${compact ? "gap-1.5" : "gap-2"}`}>
      <select
        aria-label="Day"
        disabled={disabled}
        className={`min-w-0 max-w-full ${invalid || ""} ${compact ? "!px-1.5 sm:!px-2" : ""}`.trim()}
        value={dayValue}
        onChange={(e) => update("day", e.target.value)}
      >
        <option value="">Day</option>
        {Array.from({ length: dim }, (_, i) => i + 1).map((n) => (
          <option key={n} value={String(n)}>
            {ordinal(n)}
          </option>
        ))}
      </select>
      <select
        aria-label="Month"
        disabled={disabled}
        className={`min-w-0 max-w-full ${invalid || ""} ${compact ? "!px-1.5 sm:!px-2" : ""}`.trim()}
        value={month}
        onChange={(e) => update("month", e.target.value)}
      >
        <option value="">Month</option>
        {monthNames.map((name, i) => (
          <option key={MONTHS[i]} value={String(i + 1)}>
            {name}
          </option>
        ))}
      </select>
      <select
        aria-label="Year"
        disabled={disabled}
        className={`min-w-0 max-w-full ${invalid || ""} ${compact ? "!px-1.5 sm:!px-2" : ""}`.trim()}
        value={year}
        onChange={(e) => update("year", e.target.value)}
      >
        <option value="">Year</option>
        {years.map((y) => (
          <option key={y} value={String(y)}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
