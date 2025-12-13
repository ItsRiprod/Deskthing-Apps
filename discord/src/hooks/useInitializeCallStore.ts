import { useEffect } from "react";

import { useCallStore } from "@src/stores/callStore";

/**
 * Ensures the call store is initialized so components receive live voice state updates.
 * This is especially important for entry points that do not render the global StoreInitializer.
 */
export const useInitializeCallStore = () => {
  useEffect(() => {
    const { initialize, initialized } = useCallStore.getState();

    if (!initialized) {
      initialize();
    }
  }, []);
};

