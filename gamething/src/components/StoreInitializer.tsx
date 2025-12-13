import React, { useEffect } from "react";
import { useLobbyStore } from "../stores/lobbyStore";
import { usePlayerStore } from "../stores/playerStore";
import { useGameStore } from "@src/stores/gameStore";
import { useNotificationStore } from "@src/stores/notificationStore";
import { useUIStore } from "@src/stores/uiStore";

export const StoreInitializer: React.FC = () => {
  const lobbyStore = useLobbyStore();
  const playerStore = usePlayerStore();
  const notificationStore = useNotificationStore();
  const gameStore = useGameStore();
  const uiStore = useUIStore();
  useEffect(() => {
    if (!notificationStore.initialized) {
      notificationStore.init();
    }

    if (!gameStore.initialized) {
      gameStore.init();
    }
    
    if (!lobbyStore.initialized) {
      lobbyStore.init();
    }
    if (!playerStore.initialized) {
      playerStore.init();
    }

    if (!uiStore.initialized) {
      uiStore.init();
    }

    return () => {
      void notificationStore.unmount();
      void gameStore.unmount();
      void lobbyStore.unmount();
      void playerStore.unmount();
      void uiStore.unmount();
    };
  }, []);

  return null;
};
