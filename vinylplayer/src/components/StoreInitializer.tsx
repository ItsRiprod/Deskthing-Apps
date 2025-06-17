"use client";

import { useEffect } from "react";
import { useMusicStore } from "@src/stores/musicStore";
import { useSettingStore } from "@src/stores/settingsStore";

const StoreInitializer = () => {
  const initMusic = useMusicStore((state) => state.init);
  const initSettings = useSettingStore((state) => state.init);

  // Initializes the stores on render - stores ensure they arent initialized more than once with the initialized flag

  useEffect(() => {
    initSettings();
    initMusic();
  }, [initMusic, initSettings]);

  return null;
};

export default StoreInitializer;
