import React from "react";

// filepath: src/components/DropdownComponent.tsx

type OptionValue = string | number;

interface Option {
  value: OptionValue;
  label?: string;
}

interface DropdownProps {
  /**
   * The data-field attribute used by SettingsPanel's focus/scroll logic.
   */
  "data-field"?: string;
  value: OptionValue;
  onChange: (val: OptionValue) => void;
  options: Option[];
  /**
   * Forwarded focus/blur handlers from SettingsPanel so the store capture logic works.
   * They will be called when the custom control receives/loses focus.
   */
  onFocus?: React.FocusEventHandler<HTMLSelectElement>;
  onBlur?: React.FocusEventHandler<HTMLSelectElement>;
  className?: string;
  id?: string;
  ariaLabel?: string;
}

/**
 * Fully custom dropdown that does not rely on a native <select>. Implements
 * accessible listbox patterns (button + role="listbox"/role="option") and
 * forwards focus/blur events (by casting) so existing SettingsPanel logic can work.
 */
const DropdownComponent: React.FC<DropdownProps> = ({
  "data-field": dataField,
  value,
  onChange,
  options,
  onFocus,
  onBlur,
  className = "",
  id,
  ariaLabel,
}) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const listRef = React.useRef<HTMLDivElement | null>(null);

  const displayLabel = React.useMemo(() => {
    const key = String(value);
    const found = options.find((o) => String(o.value) === key);
    return found ? found.label ?? String(found.value) : String(value);
  }, [options, value]);

  const [isOpen, setIsOpen] = React.useState(false);
  const selectedIndex = options.findIndex((o) => String(o.value) === String(value));
  const [highlightedIndex, setHighlightedIndex] = React.useState<number>(
    selectedIndex >= 0 ? selectedIndex : 0
  );

  // keep highlight synced to value when closed or value changes
  React.useEffect(() => {
    const idx = options.findIndex((o) => String(o.value) === String(value));
    setHighlightedIndex(idx >= 0 ? idx : 0);
  }, [options, value]);

  // close on outside click
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // ids for accessibility
  const buttonId = id ? `${id}-button` : undefined;
  const listId = id ? `${id}-list` : undefined;

  const openAndFocusList = (openFromKey?: "first" | "last" | "selected") => {
    setIsOpen(true);
    // set highlighted depending on context
    if (openFromKey === "first") setHighlightedIndex(0);
    else if (openFromKey === "last") setHighlightedIndex(options.length - 1);
    else {
      const idx = options.findIndex((o) => String(o.value) === String(value));
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
    // focus the list after state update
    window.setTimeout(() => listRef.current?.focus(), 0);
  };

  const toggleOpen = () => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      openAndFocusList("selected");
    }
  };

  const selectIndex = (idx: number) => {
    const opt = options[idx];
    if (!opt) return;
    onChange(opt.value);
    setIsOpen(false);
  };

  const onButtonKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      openAndFocusList("first");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      openAndFocusList("last");
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggleOpen();
    }
  };

  const onListKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, options.length - 1));
      scrollHighlightedIntoView();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
      scrollHighlightedIntoView();
    } else if (e.key === "Home") {
      e.preventDefault();
      setHighlightedIndex(0);
      scrollHighlightedIntoView();
    } else if (e.key === "End") {
      e.preventDefault();
      setHighlightedIndex(options.length - 1);
      scrollHighlightedIntoView();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectIndex(highlightedIndex);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      // return focus to the button
      containerRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    } else if (e.key.length === 1) {
      // typeahead: simple prefix match
      const char = e.key.toLowerCase();
      const start = (highlightedIndex + 1) % options.length;
      let idx = -1;
      for (let i = 0; i < options.length; i++) {
        const j = (start + i) % options.length;
        const label = (options[j].label ?? String(options[j].value)).toLowerCase();
        if (label.startsWith(char)) {
          idx = j;
          break;
        }
      }
      if (idx >= 0) {
        setHighlightedIndex(idx);
        scrollHighlightedIntoView();
      }
    }
  };

  const scrollHighlightedIntoView = () => {
    const list = listRef.current;
    if (!list) return;
    const el = list.querySelector(`#${optionId(highlightedIndex)}`);
    if (el) (el as HTMLElement).scrollIntoView({ block: "nearest" });
  };

  const optionId = (idx: number) => (id ? `${id}-opt-${idx}` : `dropdown-opt-${idx}`);

  // focus/blur forwarding to preserve SettingsPanel behaviour.
  // We cast the event to the expected type (HTMLSelectElement) because consumers expect that signature.
  const handleFocusCapture = (e: React.FocusEvent<HTMLDivElement>) => {
    if (onFocus) onFocus(e as unknown as React.FocusEvent<HTMLSelectElement>);
  };
  const handleBlurCapture = (e: React.FocusEvent<HTMLDivElement>) => {
    // only call onBlur when focus leaves the whole control
    const related = e.relatedTarget as Node | null;
    if (!containerRef.current || (related && containerRef.current.contains(related))) {
      return;
    }
    if (onBlur) onBlur(e as unknown as React.FocusEvent<HTMLSelectElement>);
  };

  return (
    <div
      ref={containerRef}
      data-field={dataField}
      className={`relative inline-block w-full ${className}`}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
    >
      {/* Visible button control */}
      <button
        id={buttonId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={toggleOpen}
        onKeyDown={onButtonKeyDown}
        className="w-full flex items-center justify-between px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-100"
      >
        <span className="truncate text-left">{displayLabel}</span>
        <svg
          className="ml-2 w-4 h-4 text-slate-300"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path d="M6 7l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Popover listbox */}
      {isOpen && (
        <div
          id={listId}
          role="listbox"
          aria-labelledby={buttonId}
          tabIndex={0}
          ref={listRef}
          onKeyDown={onListKeyDown}
          className="absolute z-20 mt-1 w-full max-h-48 overflow-auto rounded bg-slate-800 border border-slate-700 text-slate-100"
        >
          {options.map((opt, idx) => {
            const selected = idx === selectedIndex;
            const highlighted = idx === highlightedIndex;
            return (
              <div
                key={String(opt.value)}
                id={optionId(idx)}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setHighlightedIndex(idx)}
                onMouseDown={(e) => {
                  // prevent the list's blur before click registers
                  e.preventDefault();
                }}
                onClick={() => selectIndex(idx)}
                className={`px-2 py-1 cursor-pointer ${
                  highlighted ? "bg-slate-700" : ""
                } ${selected ? "font-medium" : ""}`}
              >
                {opt.label ?? String(opt.value)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DropdownComponent;