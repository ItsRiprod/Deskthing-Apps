import { DeskThing } from "@deskthing/client";
import { AppSettings, DEVICE_CLIENT, SETTING_TYPES } from "@deskthing/types";
import { SpotifySettingIDs } from "@shared/spotifyTypes";
import { PanelState, PanelType, UIContext } from "@src/contexts/UIContext"
import { useCallback, useEffect, useRef, useState } from "react"

// Settings configuration with proper typing
const SETTINGS_CONFIG = {
  [SpotifySettingIDs.BLUR_BACKGROUND_THUMBNAIL]: {
    setter: 'setBlurBackground' as const,
    expectedType: SETTING_TYPES.BOOLEAN,
    name: 'Blur Background'
  },
  [SpotifySettingIDs.BACKDROP_BLUR_AMNT]: {
    setter: 'setBackdropBlurAmt' as const,
    expectedType: SETTING_TYPES.NUMBER,
    name: 'Backdrop Blur Amount'
  },
  [SpotifySettingIDs.SHOW_CONTROLS]: {
    setter: 'setShowControls' as const,
    expectedType: SETTING_TYPES.BOOLEAN,
    name: 'Show Controls'
  },
  [SpotifySettingIDs.THUMBNAIL_SIZE]: {
    setter: 'setThumbnailSize' as const,
    expectedType: SETTING_TYPES.SELECT,
    name: 'Thumbnail Size',
    validator: (value: any): value is 'small' | 'medium' | 'large' | 'hidden' =>
      ['small', 'medium', 'large', 'hidden'].includes(value)
  },
  [SpotifySettingIDs.TEXT_SETTING]: {
    setter: 'setTextSetting' as const,
    expectedType: SETTING_TYPES.SELECT,
    name: 'Text Setting',
    validator: (value: any): value is 'minimal' | 'normal' | 'clock' =>
      ['minimal', 'normal', 'clock'].includes(value)
  }
} as const;

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
  const [panel, setPanel] = useState<PanelType>(null);
  const [panelState, setPanelState] = useState<PanelState>('Queue');

  const [isLoading, setIsLoading] = useState(true);

  const [blurBackground, setBlurBackground] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [thumbnailSize, setThumbnailSize] = useState<'small' | 'medium' | 'large' | 'hidden'>('small');
  const [textSetting, setTextSetting] = useState<"minimal" | "normal" | "clock">("normal");
  const [backdropBlurAmt, setBackdropBlurAmt] = useState(10);
  
  const isInitialized = useRef(false);

  const setters = {
    setBlurBackground,
    setShowControls,
    setThumbnailSize,
    setTextSetting,
    setBackdropBlurAmt,
  };

  const handleSettingData = useCallback((settings: AppSettings & { app?: string }) => {
    Object.values(settings).forEach((setting) => {
      if (typeof setting === 'string') return;

      const config = SETTINGS_CONFIG[setting.id as keyof typeof SETTINGS_CONFIG];
      if (!config) return;

      // Type validation
      if (setting.type !== config.expectedType) {
        console.warn(`${config.name}: Expected ${config.expectedType}, got ${setting.type}`);
        return;
      }

      // Value validation for select types
      if ('validator' in config && !config.validator(setting.value)) {
        console.warn(`${config.name}: Invalid value "${setting.value}"`);
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
      blurBackground,
      backdropBlurAmt,
      isLoading,
      showControls,
      thumbnailSize,
      textSetting
    }}>
      {children}
    </UIContext.Provider>
  );
}