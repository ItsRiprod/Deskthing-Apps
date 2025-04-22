import React, { useEffect, useState } from "react";
import { createDeskThing } from "@deskthing/client";

type ToClientData = {
  type: "imageData";
  payload: string;
};

enum IMAGE_REQUESTS {
  GET = "get",
}

type GenericTransitData = {
  type: IMAGE_REQUESTS.GET;
  request: "image";
  payload?: string;
};

const DeskThing = createDeskThing<ToClientData, GenericTransitData>();

const App: React.FC = () => {
  const [imageData, setImageData] = useState<string | null>(null);
  const [loading, setIsLoading] = useState(false);
  const [debug, setDebug] = useState("");
  let timeoutRef: NodeJS.Timeout | null = null;

  useEffect(() => {
    const removeListener = DeskThing.on("imageData", (data) => {
      setIsLoading(false);
      if (timeoutRef) {
        clearTimeout(timeoutRef);
      }
      setDebug("Received data from server");
      if (data.payload) {
        const url = DeskThing.formatImageUrl(data.payload);
        setImageData(url);
      }
    });

    DeskThing.send({ type: IMAGE_REQUESTS.GET, request: "image" });
    return () => removeListener();
  }, []);

  const handleRequestImage = async () => {
    setIsLoading(true);

    setDebug("Sending data to the server");
    DeskThing.send({ type: IMAGE_REQUESTS.GET, request: "image" });

    if (timeoutRef) {
      clearTimeout(timeoutRef);
    }

    timeoutRef = setTimeout(() => {
      setDebug("Timed out!\nDid you set an image in settings?");
      setIsLoading(false);
    }, 5000);
  };

  return (
    <div className="bg-slate-800 w-screen h-screen flex justify-center items-center">
      {imageData ? (
        <img
          src={imageData}
          alt="Received from server"
          className="w-full h-full"
        />
      ) : (
        <div className="flex items-center justify-center flex-col">
          <p className="font-bold text-5xl text-white">DeskThing Image App</p>
          <button
            disabled={loading}
            className="p-4 flex items-center disabled:bg-neutral-800 transition-colors disabled:text-zinc-200 bg-neutral-700 rounded-lg mt-5 text-4xl text-white text-semibold"
            onClick={handleRequestImage}
          >
            <p className="mr-2">Request Image</p>
            {loading && (
              <div className="animate-spin border-t-2 w-10 h-10 rounded-full" />
            )}
          </button>
          <p className="font-mono text-white text-2xl mt-2">{debug}</p>
        </div>
      )}
    </div>
  );
};

export default App;
