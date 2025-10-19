import React from "react";
import { useUIStore } from "../stores/UIStore";
import ErrorOverlay from "./ErrorOverlay";
import MicrophoneStatusOverlay from "./MicrophoneStatusOverlay";
import { SettingsPanel } from "./panels/SettingsPanel";
import { WelcomeOverlay } from "./WelcomeOverlay";
import { RecordingsPanel } from "./panels/RecordingsPanel";

export const OverlayManager: React.FC = () => {
  const visible = useUIStore((s) => s.visible);

  return (
    <>
      {visible["error"] && <ErrorOverlay />}

      {visible["microphone"] && <MicrophoneStatusOverlay />}

      {visible["settings"] && <SettingsPanel />}
      {visible["recordings"] && <RecordingsPanel />}

      <WelcomeOverlay />
    </>
  );
};

export default OverlayManager;
