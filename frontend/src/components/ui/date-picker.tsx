import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

type Props = {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  placement?: "top" | "bottom";
};

export default function DatePicker({
  value,
  onChange,
  placeholder = "Select deadline",
  placement = "bottom",
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
    <div ref={wrapperRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full h-[50px] items-center justify-between rounded-2xl border border-slate-300 bg-slate-50 px-4 text-left text-slate-900 outline-none transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:border-slate-500"
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
        <div 
          className={`absolute left-0 z-50 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900 ${
            placement === "top" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          <DayPicker
            mode="single"
            selected={value ?? undefined}
            onSelect={(date) => {
              onChange(date ?? null);
              setOpen(false);
            }}
            disabled={{ before: new Date() }}
            className="clientflow-daypicker"
            modifiersClassNames={{
              selected: "bg-blue-600 text-white hover:bg-blue-700 font-bold",
              today: "border border-blue-500 text-blue-600",
            }}
            showOutsideDays
          />
        </div>
      )}
    </div>
  );
}