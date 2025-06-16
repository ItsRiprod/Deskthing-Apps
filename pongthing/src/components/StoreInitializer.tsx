import React, { useEffect } from "react";
import { useLobbyStore } from "../stores/lobbyStore";
import { usePlayerStore } from "../stores/playerStore";
import { useGameStore } from "@src/stores/gameStore";
import { useNotificationStore } from "@src/stores/notificationStore";

export const StoreInitializer: React.FC = () => {
  const lobbyStore = useLobbyStore();
  const playerStore = usePlayerStore();
  const notificationStore = useNotificationStore();
  const gameStore = useGameStore();

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
  }, []);

  return null;
};
