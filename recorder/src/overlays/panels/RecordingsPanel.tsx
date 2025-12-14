import React, { useEffect, useRef, useState } from "react";
import { useUIStore } from "../../stores/UIStore";
import { useRecordingStore } from "../../stores/RecordingStore";
import { RecordingComponent } from "../../components/RecordingComponent";
import { RefreshCw, X } from "lucide-react";

export const RecordingsPanel: React.FC = () => {
  const recordings = useRecordingStore((s) => s.recordings);
  const getRecordingList = useRecordingStore((s) => s.fetchRecordingsList);
  const hide = useUIStore((s) => s.hide);
  const [loading, setLoading] = useState(false);

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

  const refreshRecordings = async () => {
    setLoading(true);
    await getRecordingList()
    setLoading(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-y-0 left-0 w-full md:w-96 z-50 flex flex-col transform transition-all duration-300
        ${
          isShown ? "translate-x-0 opacity-100" : "-translate-x-full opacity-25"
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
            {recordings.length > 0 ? (
              recordings.map((r) => (
                <li key={r.id}>
                  <RecordingComponent recording={r} />
                </li>
              ))
            ) : (
              <div className="">
                <p>No recordings yet!</p>
                <p>Let's make something new!</p>
              </div>
            )}
          </ul>
        </div>

        <div className="flex justify-between p-4 border-t border-slate-700 space-x-2">
          <button
            disabled={loading}
            onClick={refreshRecordings}
            className="flex disabled:bg-slate-800 disabled:hover:bg-slate-800 items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition-colors duration-200"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition-colors duration-200"
            onClick={closeWithAnimation}
          >
            <X className="w-4 h-4" />
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordingsPanel;
