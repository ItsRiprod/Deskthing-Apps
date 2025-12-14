import { RecordingEntry } from "@shared/recordings";
import { useRecordingStore } from "../stores/RecordingStore";

type RecordingComponentProps = {
  recording: RecordingEntry;
};

export const RecordingComponent: React.FC<RecordingComponentProps> = ({
  recording,
}) => {

  const play = useRecordingStore((s) => s.startPlayback)

  const handlePlay = () => {
    play(recording.id);
  }

  return (
    <div className="p-3 bg-slate-800 text-slate-100 rounded shadow-sm flex items-center justify-between">
      <div>
        <div className="font-medium">{recording.filename}</div>
        <div className="text-xs text-slate-400">
          {recording.durationSeconds}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={handlePlay} className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-sm">
          Play
        </button>
        <button className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm">
          ⋯
        </button>
      </div>
    </div>
  );
};
