import { forwardRef, useState } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { type Copy, type Lang, months, weekDays } from "../../lib/i18n";
import { today } from "../../lib/format";

export const TextInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }>(({ label, error, ...props }, ref) => <label className="field"><span>{label}</span><input ref={ref} {...props} className="control" />{error && <small className="error">{error}</small>}</label>);
TextInput.displayName = "TextInput";

export function PhoneInput({ value, onChange, error, label }: { value: string; onChange: (value: string) => void; error?: string; label: string }) {
  const digits = value.replace(/\D/g, "").replace(/^998/, "").slice(0, 9);
  const shown = digits.replace(/(\d{2})(\d{0,3})(\d{0,2})(\d{0,2})/, (_match, a, b, c, d) => `${a}${b ? ` ${b}` : ""}${c ? ` ${c}` : ""}${d ? ` ${d}` : ""}`);
  return <label className="field"><span>{label}</span><div className="phone-control"><b>+998</b><input aria-label={label} className="phone-number" inputMode="numeric" placeholder="90 123 45 67" value={shown} onChange={(event) => onChange(`+998${event.target.value.replace(/\D/g, "").slice(0, 9)}`)} /></div>{error && <small className="error">{error}</small>}</label>;
}

export function MoneyInput({ value, onChange, label, error, lang }: { value: number; onChange: (value: number) => void; label: string; error?: string; lang: Lang }) {
  return <label className="field"><span>{label}</span><div className="relative"><input className="control pr-14" inputMode="numeric" value={value ? new Intl.NumberFormat(lang === "ru" ? "ru-RU" : "uz-UZ").format(value) : ""} onChange={(event) => onChange(Number(event.target.value.replace(/\D/g, "")) || 0)} /><b className="pointer-events-none absolute right-3 top-3 text-sm text-slate-500">{lang === "ru" ? "сум" : "so'm"}</b></div>{error && <small className="error">{error}</small>}</label>;
}

export type SelectOption = { value: string | number; label: string; hint?: string };
export function CustomSelect({ label, value, onChange, options, placeholder, error, copy, searchable = true }: { label: string; value: string | number; onChange: (value: string) => void; options: SelectOption[]; placeholder: string; error?: string; copy: Copy; searchable?: boolean }) {
  const [open, setOpen] = useState(false), [query, setQuery] = useState("");
  const selected = options.find((option) => String(option.value) === String(value));
  const shown = options.filter((option) => `${option.label} ${option.hint ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="field select-root"><span>{label}</span><button type="button" className="control select-trigger" aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen(!open)}>{selected ? <span><b>{selected.label}</b>{selected.hint && <small>{selected.hint}</small>}</span> : <span className="text-slate-400">{placeholder}</span>}<ChevronDown size={18} /></button>{open && <div className="select-menu" role="listbox">{searchable && <div className="select-search"><Search size={17} /><input autoFocus placeholder={copy.search} value={query} onChange={(event) => setQuery(event.target.value)} /></div>}<div className="max-h-52 overflow-auto">{shown.map((option) => <button type="button" className="select-option" role="option" key={option.value} onClick={() => { onChange(String(option.value)); setQuery(""); setOpen(false); }}><span><b>{option.label}</b>{option.hint && <small>{option.hint}</small>}</span>{String(option.value) === String(value) && <Check size={17} />}</button>)}{!shown.length && <p className="p-3 text-sm text-slate-500">{copy.noResults}</p>}</div></div>}{error && <small className="error">{error}</small>}</div>;
}

export function GroupCombobox({ value, onChange, groups, error, copy }: { value: string; onChange: (value: string) => void; groups: string[]; error?: string; copy: Copy }) {
  const [open, setOpen] = useState(false), [creating, setCreating] = useState(false), [draft, setDraft] = useState("");
  const filtered = groups.filter((group) => group.toLowerCase().includes(draft.toLowerCase()));
  const choose = (group: string) => { onChange(group); setOpen(false); setCreating(false); setDraft(""); };
  return <div className="field select-root"><span>{copy.group}</span><button type="button" className="control select-trigger" aria-expanded={open} onClick={() => setOpen(!open)}>{value ? <b>{value}</b> : <span className="text-slate-400">{copy.selectGroup}</span>}<ChevronDown size={18} /></button>{open && <div className="select-menu"><button type="button" className="new-group" onClick={() => setCreating(true)}>+ {copy.createGroup}</button>{creating ? <div className="group-create"><input autoFocus className="control" placeholder={copy.newGroupName} value={draft} onChange={(event) => setDraft(event.target.value)} /><button type="button" className="btn-primary" disabled={!draft.trim()} onClick={() => choose(draft.trim())}>{copy.add}</button></div> : <><div className="select-search"><Search size={17} /><input autoFocus placeholder={copy.searchGroup} value={draft} onChange={(event) => setDraft(event.target.value)} /></div><div className="mt-2 max-h-48 overflow-auto">{filtered.map((group) => <button type="button" className="select-option" key={group} onClick={() => choose(group)}><b>{group}</b>{group === value && <Check size={17} />}</button>)}{!filtered.length && <p className="p-3 text-sm text-slate-500">{copy.noGroups}</p>}</div></>}</div>}{error && <small className="error">{error}</small>}</div>;
}

export function DatePicker({ value, onChange, error, lang, copy }: { value: string; onChange: (value: string) => void; error?: string; lang: Lang; copy: Copy }) {
  const [open, setOpen] = useState(false), [shown, setShown] = useState((value || today()).slice(0, 7));
  const [year, month] = shown.split("-").map(Number), offset = (new Date(year, month - 1, 1).getDay() + 6) % 7, days = new Date(year, month, 0).getDate(), max = today();
  const move = (delta: number) => { const next = year * 12 + month - 1 + delta; setShown(`${Math.floor(next / 12)}-${String((next % 12) + 1).padStart(2, "0")}`); };
  const choose = (day: number) => { onChange(`${shown}-${String(day).padStart(2, "0")}`); setOpen(false); };
  const dateText = value ? new Date(`${value}T00:00:00`).toLocaleDateString(lang === "ru" ? "ru-RU" : "uz-UZ") : copy.selectDate;
  return <div className="field relative"><span>{copy.selectDate}</span><button type="button" className="control select-trigger" aria-expanded={open} onClick={() => setOpen(!open)}>{dateText}<ChevronDown size={18} /></button>{open && <div className="date-menu"><div className="flex items-center justify-between"><button className="icon" type="button" aria-label={copy.previousMonth} onClick={() => move(-1)}><ChevronLeft size={19} /></button><b>{months[lang][month - 1]} {year}</b><button className="icon" type="button" aria-label={copy.nextMonth} onClick={() => move(1)}><ChevronRight size={19} /></button></div><div className="calendar">{weekDays[lang].map((day) => <span className="weekday" key={day}>{day}</span>)}{Array.from({ length: offset }, (_, index) => <i key={index} />)}{Array.from({ length: days }, (_, index) => { const day = index + 1, date = `${shown}-${String(day).padStart(2, "0")}`; return <button type="button" key={date} disabled={date > max} onClick={() => choose(day)} className={`day ${date === value ? "selected" : ""}`}>{day}</button>; })}</div><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" className="btn-soft" onClick={() => { onChange(today()); setOpen(false); }}>{copy.today}</button><button type="button" className="btn-soft" onClick={() => { const date = new Date(); date.setDate(date.getDate() - 1); onChange(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent", year: "numeric", month: "2-digit", day: "2-digit" }).format(date)); setOpen(false); }}>{copy.yesterday}</button></div></div>}{error && <small className="error">{error}</small>}</div>;
}
