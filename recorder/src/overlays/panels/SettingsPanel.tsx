import React, { useEffect, useRef, useState } from "react";
import { OverlayId, useUIStore } from "../../stores/UIStore";
import { useMicrophoneStore } from "../../stores/MicrophoneStore"; // import the mic store
import { useInputStore } from "../../stores/inputStore";
import DropdownComponent from "../../components/DropdownComponent";

export const SettingsPanel: React.FC = () => {
  const addScrollListener = useInputStore((state) => state.addListener);
  const capture = useInputStore((state) => state.setCaptured);
  const overlays: Array<{ id: OverlayId; label: string }> = [
    { id: "microphone", label: "Microphone Status" },
    { id: "error", label: "Error Messages" },
    { id: "recordings", label: "Recordings Panel" },
  ];
  const showComponent = useUIStore((s) => s.show);
  const hideComponent = useUIStore((s) => s.hide);
  const visible = useUIStore((s) => s.visible);

  // local state to control enter/exit animation
  const [isShown, setIsShown] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const ANIM_DURATION = 300; // ms - keep in sync with Tailwind transition duration

  // Microphone store access
  const micConfig = useMicrophoneStore((s) => s.micConfig);
  const setMicConfig = useMicrophoneStore((s) => s.setMicConfig);

  // Local cache for editable settings (doesn't write to store until Save)
  const [localConfig, setLocalConfig] = useState({
    sampleRate: micConfig.sampleRate,
    channelCount: micConfig.channelCount,
    secondsPerChunk: micConfig.secondsPerChunk,
    // keep bytesPerSample in sync from store but not editable in UI for now
    bytesPerSample: micConfig.bytesPerSample,
  });

  // focused component tracking
  const focusedRef = useRef(false);
  // store focused element and info needed for scroll-based change
  const focusedElementRef = useRef<HTMLElement | null>(null);
  const focusedFieldRef = useRef<string | null>(null);
  const focusedTypeRef = useRef<"number" | "select" | null>(null);
  const scrollUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // trigger enter animation after mount
    // slight next-tick ensures CSS transition runs
    const t = window.setTimeout(() => setIsShown(true), 10);
    return () => {
      clearTimeout(t);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // cleanup any scroll listener and restore capture on unmount
      if (scrollUnsubRef.current) {
        scrollUnsubRef.current();
        scrollUnsubRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the underlying mic config changes (e.g. from another part of the app),
  // update our local cache so the UI reflects current values when opened.
  useEffect(() => {
    setLocalConfig((prev) => ({
      ...prev,
      sampleRate: micConfig.sampleRate,
      channelCount: micConfig.channelCount,
      secondsPerChunk: micConfig.secondsPerChunk,
      bytesPerSample: micConfig.bytesPerSample,
    }));
  }, [
    micConfig.sampleRate,
    micConfig.channelCount,
    micConfig.secondsPerChunk,
    micConfig.bytesPerSample,
  ]);

  const closeWithAnimation = () => {
    // start exit animation, then call hideComponent after animation completes
    setIsShown(false);
    // clear any previous timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      hideComponent("settings");
      timeoutRef.current = null;
    }, ANIM_DURATION);
  };

  // Helper to toggle overlay visibility using UIStore
  const toggleOverlay = (id: OverlayId, enabled: boolean) => {
    if (enabled) {
      showComponent(id);
    } else {
      hideComponent(id);
    }
  };

  const onSave = () => {
    // Persist only the mic-relevant fields to the MicrophoneStore
    setMicConfig({
      sampleRate: Number(localConfig.sampleRate),
      channelCount: Number(localConfig.channelCount),
      secondsPerChunk: Number(localConfig.secondsPerChunk),
      // preserve bytesPerSample from local cache (or derive if you add format handling)
      bytesPerSample: localConfig.bytesPerSample,
    });
    closeWithAnimation();
  };

  // ---------- Scroll-to-change focused field logic ----------
  // helper to compute step for a given field
  const stepForField = (field: string) => {
    if (field === "sampleRate") return 100;
    if (field === "secondsPerChunk") return 1;
    return 1;
  };

  const handleFocus = (e: React.FocusEvent<HTMLElement>) => {
    const el = e.target as HTMLElement;
    focusedElementRef.current = el;

    // determine which field this element corresponds to via data-field attribute
    const field = (el.getAttribute && el.getAttribute("data-field")) || null;
    focusedFieldRef.current = field;

    // detect number inputs first
    if (el instanceof HTMLInputElement && el.type === "number") {
      focusedTypeRef.current = "number";
    } else if (field) {
      // treat native <select> or our custom DropdownComponent (which forwards focus)
      // as "select" type for scroll-based changes
      focusedTypeRef.current = "select";
    } else {
      focusedTypeRef.current = null;
    }

    // capture scroll input so the rest of the app doesn't also scroll
    try {
      capture(true, ["scroll"]);
    } catch {
      // ignore if store behaves differently
    }

    // install scroll listener via the input store
    // addScrollListener is expected to return an unsubscribe function.
    const cb = (ev: WheelEvent | Event) => {
      if ("deltaY" in ev === false) return;

      // Ensure we have a focused field and element
      const fieldName = focusedFieldRef.current;
      const focusedType = focusedTypeRef.current;
      const focusedEl = focusedElementRef.current as HTMLElement | null;
      if (!fieldName || !focusedEl || !focusedType) return;

      // standardize delta; wheel up -> negative deltaY
      const delta = ev?.deltaY || ev?.deltaX || 0;
      // direction: up scroll -> increment (dir = 1), down -> decrement (dir = -1)
      const dir = delta < 0 ? 1 : -1;
      ev.preventDefault();

      if (focusedType === "number") {
        const step = stepForField(fieldName);
        setLocalConfig((prev) => {
          const cur = Number(prev[fieldName] ?? 0);
          let next = cur + dir * step;
          // simple bounds: don't go below 0
          if (next < 0) next = 0;
          return { ...prev, [fieldName]: next };
        });
      } else if (focusedType === "select") {
        // For native select we'd use the element directly; for our custom dropdown
        // the focused element is the container with data-field. We update localConfig
        // by stepping between known option values.
        if (fieldName === "channelCount") {
          const options = [1, 2];
          const cur = Number(localConfig.channelCount);
          let idx = options.indexOf(cur);
          if (idx === -1) idx = 0;
          idx += dir;
          if (idx < 0) idx = 0;
          if (idx >= options.length) idx = options.length - 1;
          const newVal = options[idx];
          setLocalConfig((prev) => ({ ...prev, channelCount: Number(newVal) }));
        } else {
          // fallback: try to treat focusedEl as a native select
          const sel = focusedEl as HTMLSelectElement;
          if (!sel || !sel.options) return;
          const len = sel.options.length;
          if (len === 0) return;
          let newIndex = sel.selectedIndex + dir;
          if (newIndex < 0) newIndex = 0;
          if (newIndex >= len) newIndex = len - 1;
          if (newIndex === sel.selectedIndex) return;
          const newVal = sel.options[newIndex].value;
          setLocalConfig((prev) => {
            if (fieldName === "channelCount") {
              return { ...prev, channelCount: Number(newVal) };
            }
            return { ...prev, [fieldName]: newVal };
          });
        }
      }
    };

    const unsub = addScrollListener(cb, ["wheel"]);
    scrollUnsubRef.current = unsub;

    focusedRef.current = true;
  };

  const handleBlur = () => {
    focusedRef.current = false;
    focusedElementRef.current = null;
    focusedFieldRef.current = null;
    focusedTypeRef.current = null;

    // remove scroll listener and restore input capture
    if (scrollUnsubRef.current) {
      try {
        scrollUnsubRef.current();
      } catch {
        // ignore
      }
      scrollUnsubRef.current = null;
    }
    try {
      capture(false, ["wheel"]);
    } catch {
      // ignore store quirk
    }
  };

  // --------------------------------------------------------

  const channelOptions = [
    { value: 1, label: "1" },
    { value: 2, label: "2" },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-y-0 right-0 w-full md:w-96 z-50 flex flex-col transform transition-all duration-300
        ${isShown ? "translate-x-0 opacity-100" : "translate-x-full opacity-25"}
      `}
    >
      <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 shadow-lg">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Settings</h3>
          <button
            className="text-sm text-slate-300"
            onClick={closeWithAnimation}
            aria-label="Close settings"
          >
            Close
          </button>
        </div>

        <div className="p-4 overflow-auto flex-1">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Enable Overlays
              </label>
              <div className="space-y-2">
                {overlays.map((overlay) => (
                  <div
                    key={overlay.id}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      className="accent-emerald-500"
                      checked={!!visible[overlay.id]}
                      onChange={(e) =>
                        toggleOverlay(overlay.id, e.target.checked)
                      }
                    />
                    <span>{overlay.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Sample Rate</label>
              <input
                data-field="sampleRate"
                onFocus={handleFocus}
                onBlur={handleBlur}
                className={`mt-1 block w-full border rounded px-2 py-1 bg-slate-800 ${
                  localConfig.sampleRate != micConfig.sampleRate
                    ? "border-emerald-500"
                    : "border-slate-700"
                }`}
                value={localConfig.sampleRate}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    sampleRate: Number(e.target.value || 0),
                  })
                }
                type="number"
              />
            </div>

            <div>
              <label
                className={`text-sm font-medium`}
              >
                Channels
              </label>
              <DropdownComponent
                data-field="channelCount"
                onFocus={handleFocus}
                onBlur={handleBlur}
                className={`mt-1 border ${
                  localConfig.channelCount != micConfig.channelCount
                    ? "border-emerald-500"
                    : "border-slate-700"
                }`}
                value={localConfig.channelCount || 1}
                onChange={(v) =>
                  setLocalConfig({
                    ...localConfig,
                    channelCount: Number(v),
                  })
                }
                options={channelOptions}
                ariaLabel="Channel count"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Chunk Duration (s)</label>
              <input
                data-field="secondsPerChunk"
                onFocus={handleFocus}
                onBlur={handleBlur}
                className={`mt-1 block w-full border rounded px-2 py-1 bg-slate-800 ${
                  localConfig.secondsPerChunk != micConfig.secondsPerChunk
                    ? "border-emerald-500"
                    : "border-slate-700"
                }`}
                value={localConfig.secondsPerChunk}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    secondsPerChunk: Number(e.target.value || 0),
                  })
                }
                type="number"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-700 flex justify-end space-x-2">
          <button
            className="px-3 py-1 bg-slate-700 text-slate-100 rounded"
            onClick={closeWithAnimation}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded"
            onClick={onSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
