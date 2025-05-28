import { DeskThing } from "@deskthing/client";
import { AppSettings, DEVICE_CLIENT, SETTING_TYPES } from "@deskthing/types";
import { CONTROL_OPTIONS, DISPLAY_ITEMS, SpotifySettingIDs } from "@shared/spotifyTypes";
import { PanelState, PanelType, UIContext } from "@src/contexts/UIContext"
import { useCallback, useEffect, useRef, useState } from "react"

// Settings configuration with proper typing
const SETTINGS_CONFIG = {
  [SpotifySettingIDs.DISPLAY_ITEMS]: {
    setter: 'setDisplayItems' as const,
    expectedType: SETTING_TYPES.MULTISELECT,
    name: 'Display Items'
  },
  [SpotifySettingIDs.CONTROL_OPTIONS]: {
    setter: 'setControlOptions' as const,
    expectedType: SETTING_TYPES.SELECT,
    name: 'Control Options'
  },
  [SpotifySettingIDs.TEXT_JUSTIFICATION]: {
    setter: 'setTextJustification' as const,
    expectedType: SETTING_TYPES.SELECT,
    name: 'Text Justification'
  },
  [SpotifySettingIDs.BACKDROP_BLUR_AMOUNT]: {
    setter: 'setBackdropBlur' as const,
    expectedType: SETTING_TYPES.NUMBER,
    name: 'Backdrop Blur Amount'
  }
} as const;

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
  const [panel, setPanel] = useState<PanelType>(null);
  const [panelState, setPanelState] = useState<PanelState>('Queue');

  const [isLoading, setIsLoading] = useState(true);
    const [displayItems, setDisplayItems] = useState<DISPLAY_ITEMS[]>([DISPLAY_ITEMS.THUMBNAIL, DISPLAY_ITEMS.ALBUM, DISPLAY_ITEMS.TITLE, DISPLAY_ITEMS.ARTISTS]);
    const [controlOptions, setControlOptions] = useState<CONTROL_OPTIONS>(CONTROL_OPTIONS.DISABLED);
    const [textJustification, setTextJustification] = useState<'left' | 'center' | 'right'>('left');
    const [backdropBlur, setBackdropBlur] = useState(10);
  
    const isInitialized = useRef(false);

    const setters = {
      setDisplayItems,
      setControlOptions,
      setTextJustification,
      setBackdropBlur,
    };

  const handleSettingData = useCallback((settings: AppSettings & { app?: string }) => {
    Object.values(settings).forEach((setting) => {
      if (typeof setting === 'string') return;

      console.log(setting)

      const config = SETTINGS_CONFIG[setting.id as keyof typeof SETTINGS_CONFIG];
      if (!config) return;

      // Type validation
      if (setting.type !== config.expectedType) {
        console.warn(`${config.name}: Expected ${config.expectedType}, got ${setting.type}`);
        return;
      }

      // Set the state using the setter from our map
      const setter = setters[config.setter];
      if (setter) {
        setter(setting.value as any);
      }
    });
  }, []);

  const fetchInitialSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const settings = await DeskThing.getSettings();
      if (settings) {
        handleSettingData(settings);
      }
    } catch (error) {
      console.error('Failed to fetch initial settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [handleSettingData]);

  useEffect(() => {
    // Initialize settings only once
    if (!isInitialized.current) {
      fetchInitialSettings();
      isInitialized.current = true;
    }

    // Set up listener for settings changes
    const removeListener = DeskThing.on(DEVICE_CLIENT.SETTINGS, (settingData) => {
      handleSettingData(settingData.payload);
    });

    return removeListener;
  }, [fetchInitialSettings, handleSettingData]);


  return (
    <UIContext.Provider value={{
      panel,
      setPanel,
      panelState,
      setPanelState,
      displayItems,
      controlOptions,
      textJustification,
      backdropBlur,
      isLoading,
    }}>
      {children}
    </UIContext.Provider>
  );
}