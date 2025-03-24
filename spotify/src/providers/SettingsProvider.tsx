import { createDeskThing } from "@deskthing/client"
import { AppSettings, DEVICE_CLIENT } from "@deskthing/types"
import { ToClientTypes, ToServerTypes } from "@shared/transitTypes"
import { SettingsContext } from "@src/contexts/SettingsContext"
import { ReactNode, useEffect, useState } from "react"

const DeskThing = createDeskThing<ToClientTypes, ToServerTypes>();


export const SettingsProvider: React.FC<{ children: ReactNode }> = ({
    children,
  }) => {
    const [settings, setSettings] = useState<AppSettings | undefined>(undefined);
  
    useEffect(() => {
      const listener = DeskThing.on(DEVICE_CLIENT.SETTINGS, (data) => {
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
  