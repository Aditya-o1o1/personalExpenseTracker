import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

const toIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const fromIsoDate = (value) => {
  if (!value) return null;
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const monthLabel = (date) =>
  new Intl.DateTimeFormat(undefined, { month: 'long' }).format(date);

const dateLabel = (value) => {
  const date = fromIsoDate(value);
  return date
    ? new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
    : '';
};

export default function DatePicker({
  id,
  value = '',
  onChange,
  min,
  max,
  required = false,
  ariaLabel = 'Choose date',
  className = '',
}) {
  const rootRef = useRef(null);
  const normalizedValue = value?.slice(0, 10) || '';
  const selectedDate = fromIsoDate(normalizedValue);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = selectedDate || new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const openPicker = () => {
    const current = fromIsoDate(normalizedValue) || new Date();
    setVisibleMonth(new Date(current.getFullYear(), current.getMonth(), 1));
    setOpen(true);
  };

  const changeMonth = (amount) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  const chooseDate = (date) => {
    onChange(toIsoDate(date));
    setOpen(false);
  };

  const today = toIsoDate(new Date());
  const offset = (visibleMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
    0,
  ).getDate();
  const currentYear = new Date().getFullYear();
  const minYear = min ? fromIsoDate(min)?.getFullYear() ?? 1900 : 1900;
  const maxYear = max ? fromIsoDate(max)?.getFullYear() ?? currentYear + 20 : currentYear + 20;
  const years = Array.from(
    { length: Math.max(0, maxYear - minYear + 1) },
    (_, index) => minYear + index,
  );
  const cells = [
    ...Array.from({ length: offset }, (_, index) => ({ key: `blank-${index}` })),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index + 1);
      return { key: toIsoDate(date), date, value: toIsoDate(date) };
    }),
  ];

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        className="field flex min-h-[44px] items-center justify-between gap-3 text-left"
        aria-label={normalizedValue ? `${ariaLabel}: ${dateLabel(normalizedValue)}` : ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-required={required}
        onClick={() => (open ? setOpen(false) : openPicker())}
      >
        <span className={value ? 'text-main' : 'text-muted'}>
          {normalizedValue ? dateLabel(normalizedValue) : 'Select date'}
          {required && !normalizedValue ? <span className="sr-only"> (required)</span> : null}
        </span>
        <CalendarDays size={17} className="shrink-0 text-muted" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose a date"
          className="absolute left-0 top-full z-50 mt-2 w-[min(19rem,calc(100vw-2rem))] rounded-2xl border border-line bg-[var(--surface)] p-4 text-main shadow-2xl"
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-xl text-muted transition hover:bg-violet/10 hover:text-violet"
              aria-label="Previous month"
              onClick={() => changeMonth(-1)}
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold">{monthLabel(visibleMonth)}</span>
              <select
                aria-label="Select year"
                className="cursor-pointer rounded-lg bg-transparent px-1 py-1 text-sm font-semibold text-main outline-none hover:bg-violet/10 focus:ring-2 focus:ring-violet/50"
                value={visibleMonth.getFullYear()}
                onChange={(event) => {
                  setVisibleMonth((current) =>
                    new Date(Number(event.target.value), current.getMonth(), 1),
                  );
                }}
              >
                {years.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-xl text-muted transition hover:bg-violet/10 hover:text-violet"
              aria-label="Next month"
              onClick={() => changeMonth(1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day, index) => (
              <span key={`${day}-${index}`} className="py-2 text-[11px] font-medium text-muted">
                {day}
              </span>
            ))}
            {cells.map((cell) => {
              if (!cell.date) return <span key={cell.key} />;
              const disabled = (min && cell.value < min) || (max && cell.value > max);
              const selected = cell.value === normalizedValue;
              const isToday = cell.value === today;
              return (
                <button
                  key={cell.key}
                  type="button"
                  disabled={disabled}
                  aria-pressed={selected}
                  aria-label={dateLabel(cell.value)}
                  onClick={() => chooseDate(cell.date)}
                  className={`grid aspect-square place-items-center rounded-xl text-xs transition ${
                    selected
                      ? 'bg-violet font-semibold text-white'
                      : isToday
                        ? 'ring-1 ring-violet/50 text-violet'
                        : 'text-main hover:bg-violet/10 hover:text-violet'
                  } disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-main`}
                >
                  {cell.date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            {!required && normalizedValue ? (
              <button
                type="button"
                className="text-xs font-medium text-muted hover:text-rose"
                onClick={() => {
                  onChange('');
                  setOpen(false);
                }}
              >
                Clear
              </button>
            ) : <span />}
            <button
              type="button"
              className="text-xs font-semibold text-violet hover:text-violet/80"
              onClick={() => {
                const date = new Date();
                if ((!min || today >= min) && (!max || today <= max)) chooseDate(date);
              }}
              disabled={(min && today < min) || (max && today > max)}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
