import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

type Props = {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
};

export default function DatePicker({
  value,
  onChange,
  placeholder = "Select deadline",
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-left text-slate-900 outline-none transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:border-slate-500"
      >
        <span className={value ? "" : "text-slate-500 dark:text-slate-400"}>
          {value ? format(value, "yyyy-MM-dd") : placeholder}
        </span>

        <CalendarDays
          className="shrink-0 text-slate-600 dark:text-white"
          size={18}
        />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <DayPicker
            mode="single"
            selected={value ?? undefined}
            onSelect={(date) => {
              onChange(date ?? null);
              setOpen(false);
            }}
            disabled={{ before: new Date() }}
            className="clientflow-daypicker"
            showOutsideDays
          />
        </div>
      )}
    </div>
  );
}