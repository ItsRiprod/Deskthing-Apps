import { useContext } from "react"
import { AppStateContextType, AppStateContext } from "../context/AppStateContext"

export const useAppState = (): AppStateContextType => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
