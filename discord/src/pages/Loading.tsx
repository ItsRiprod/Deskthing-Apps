import { useEffect, useState } from "react";
import { hints } from "../assets/static/messages"
import { DeskThing } from "@deskthing/client";

export function Loading() {
  const [currentHint, setCurrentHint] = useState(0);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHint(Math.floor(Math.random() * hints.length));
    }, 10000);

    DeskThing.overrideKeys(['wheel'])
    return () => {
      clearInterval(interval);
      DeskThing.restoreKeys(['wheel']);
    };
  }, []);

  const handleChangeHint = () => {
    setCurrentHint(Math.floor(Math.random() * hints.length));
  };

  useEffect(() => {
    const handleScroll = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation()
      if (e.deltaY != 0) {
          setRotation((prev) => prev - e.deltaY * 0.5);
      } else if (e.deltaX != 0) {
        setRotation((prev) => prev - e.deltaX * 0.5);
      }
    };
    window.addEventListener("wheel", handleScroll, { passive: false, capture: true });
    return () => {
      window.removeEventListener("wheel", handleScroll, { capture: true });
    };
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col items-center bg-gray-900 justify-center">
      <button
        onClick={handleChangeHint}
        className="animate-pop-in relative flex items-center justify-center w-96 h-96 flex-col"
      >
        <div
          style={{ transform: `rotate(${rotation}deg)` }}
          className="absolute transition-transform duration-1000 rounded-full h-96 w-96">
            <div className="h-full w-full border-t-4 border-blue-500 rounded-full animate-spin"></div>
          </div>
        <p className="text-zinc-200 text-3xl font-semibold">
          Connecting to Discord
        </p>
        <div key={currentHint} className="animate-drop-in text-gray-400 text-lg text-center max-w-md px-4">
          {hints[currentHint]}
        </div>
      </button>
    </div>
  );
}
