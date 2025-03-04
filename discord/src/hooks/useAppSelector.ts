import { useState, useRef, useEffect } from "react"
import { useAppState } from "./useAppState"
import { AppState } from "../context/AppStateContext"

export function useAppSelector<T>(selector: (state: AppState) => T): T {
    const { state } = useAppState();
    const [selectedState, setSelectedState] = useState<T>(() => selector(state));
    const latestSelector = useRef(selector);
    const latestState = useRef(state);
    const latestSelectedState = useRef(selectedState);
  
    useEffect(() => {
      latestSelector.current = selector;
      latestState.current = state;
  
      const newSelectedState = selector(state);
      
      // Only update if the selected state has actually changed
      if (!Object.is(newSelectedState, latestSelectedState.current)) {
        latestSelectedState.current = newSelectedState;
        setSelectedState(newSelectedState);
      }
    }, [state, selector]);
  
    return selectedState;
  }