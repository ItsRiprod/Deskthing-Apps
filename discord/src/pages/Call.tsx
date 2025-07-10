import { JSX, useEffect } from "react";
import { useCallStore } from "@src/stores/callStore";

export function Call(): JSX.Element {
  const callStatus = useCallStore((state) => state.callStatus);

  // Effect to handle cleanup when component unmounts or call ends
  useEffect(() => {
    return () => {
      // Any cleanup needed when leaving call view
    };
  }, []);

  // Call view focuses on participants and their status
  return (
    <div className="flex h-full flex-col">
  
    </div>
  );
}
