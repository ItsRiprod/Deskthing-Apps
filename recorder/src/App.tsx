import React, { useEffect } from "react";
import { MicrophoneComponent } from "./components/Microphone";
import { useMicrophoneStore } from "./stores/MicrophoneStore";
import { useRecordingStore } from "./stores/RecordingStore";

const App: React.FC = () => {
  const initMic = useMicrophoneStore((s) => s.init);
  const initRec = useRecordingStore((s) => s.init);

  useEffect(() => {
    initMic().catch(() => {});
    initRec().catch(() => {});
  }, [initMic, initRec]);

  return (
    <div className="min-h-screen min-w-screen bg-gradient-to-br from-black via-slate-900 to-gray-900 text-white">
      <div className="relative min-h-screen">

        {/* Main content area */}
        <main className="max-w-4xl mx-auto py-20 px-4">
          <div className="flex items-center justify-center">
            <div className="w-full">
              <MicrophoneComponent />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
