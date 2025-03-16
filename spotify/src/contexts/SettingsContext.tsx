import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { createDeskThing } from "@deskthing/client";
import { AppSettings } from "@deskthing/types";
import { ToClientTypes, ToServerTypes } from "@shared/transitTypes";

const DeskThing = createDeskThing<ToClientTypes, ToServerTypes>();

// Define the context type
export type SettingsContextType = {
  settings: AppSettings | undefined;
};

// Create the context with a default value
export const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

// Provider component
export const SettingsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<AppSettings | undefined>(undefined);

  useEffect(() => {
    const listener = DeskThing.on('', (data) => {
      const settingsData = data.payload;
      setSettings(settingsData);
    });

    DeskThing.getSettings().then((settingsData) => {
      if (settingsData) {
        setSettings(settingsData);
      }
    });

    return () => {
      listener();
    };
  }, []);

  return (
    <SettingsContext.Provider value={{ settings }}>
      {children}
    </SettingsContext.Provider>
  );
};
