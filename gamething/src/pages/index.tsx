import { GAME_OPTIONS } from "@shared/types/types";
import { useUIStore } from "@src/stores/uiStore";
import LobbyScreen from "./lobby/LobbyScreen";
import RoomScreen from "./room/RoomScreen";
import PongMultiGameScreen from "./pong/PongMultiGameScreen";
import PongSoloGameScreen from "./pong/PongSoloGameScreen";
import DualMultiGameScreen from "./dual/DualMultiGamesScreen";
import { DualSoloGameScreen } from "./dual/DualSoloGamesScreen";
import { usePlayerStore } from "@src/stores/playerStore";
import { PlayerSetup } from "./player";

export const PageManager = () => {
  const currentPage = useUIStore((state) => state.currentPage);
  switch (currentPage) {
    case "lobby":
      return <LobbyScreen />;
    case "player":
      return <PlayerSetup />;
    case "room":
      return <RoomScreen />;
    case GAME_OPTIONS.DUAL_MULTI:
      return <DualMultiGameScreen />;
    case GAME_OPTIONS.DUAL_SOLO:
      return <DualSoloGameScreen />;
    case GAME_OPTIONS.PONG_MULTI:
      return <PongMultiGameScreen />;
    case GAME_OPTIONS.PONG_SOLO:
      return <PongSoloGameScreen />;
    case "menu":
    default:
      return null;
  }
};
