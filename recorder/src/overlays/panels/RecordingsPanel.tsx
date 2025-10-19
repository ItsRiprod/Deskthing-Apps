import React, { useEffect, useRef, useState } from "react";
import { useUIStore } from "../../stores/UIStore";

const mockRecordings = [
  { id: "r1", name: "Interview 2025-10-01", duration: "00:03:12" },
  { id: "r2", name: "Note 2025-10-05", duration: "00:00:42" },
  { id: "r3", name: "Meeting 2025-09-28", duration: "00:22:10" },
];

export const RecordingsPanel: React.FC = () => {
  const hide = useUIStore((s) => s.hide);

  // local state to control enter/exit animation
  const [isShown, setIsShown] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const ANIM_DURATION = 300; // keep in sync with Tailwind transition duration

  useEffect(() => {
    const t = window.setTimeout(() => setIsShown(true), 10);
    return () => {
      clearTimeout(t);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const closeWithAnimation = () => {
    setIsShown(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      hide("recordings");
      timeoutRef.current = null;
    }, ANIM_DURATION);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-y-0 left-0 w-full md:w-96 z-50 flex flex-col transform transition-all duration-300
        ${
          isShown
            ? "translate-x-0 opacity-100"
            : "-translate-x-full opacity-25"
        }
      `}
    >
      <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 shadow-lg">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recordings</h3>
          <button
            className="text-sm text-slate-300"
            onClick={closeWithAnimation}
            aria-label="Close recordings"
          >
            Close
          </button>
        </div>

        <div className="p-4 overflow-auto flex-1">
          <ul className="space-y-3">
            {mockRecordings.map((r) => (
              <li
                key={r.id}
                className="p-3 bg-slate-800 text-slate-100 rounded shadow-sm flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-slate-400">{r.duration}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-sm">
                    Play
                  </button>
                  <button className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm">
                    ⋯
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 border-t border-slate-700 flex justify-end space-x-2">
          <button
            className="px-3 py-1 bg-slate-700 text-slate-100 rounded"
            onClick={closeWithAnimation}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordingsPanel;
