import { AppSettings } from "@deskthing/types"
import { DiscordSettings, AppSettingIDs } from "../../shared/types/discord";

// Main validator: only checks that all required keys are present
export function validateDiscordSettings(obj: AppSettings): asserts obj is DiscordSettings {

  const requiredIds = [
    AppSettingIDs.LEFT_DASHBOARD_PANEL,
    AppSettingIDs.RIGHT_DASHBOARD_PANEL,
    AppSettingIDs.DASHBOARD_ELEMENTS,
    AppSettingIDs.NOTIFICATION_TOASTS,
    AppSettingIDs.NOTIFICATION_TOAST_DURATION_SECONDS,
  ];

  for (const id of requiredIds) {
    if (!(id in obj)) {
      // Soft warning; defaults will be applied by uiStore.
      console.warn(`Missing setting: ${id}`);
    }
  }
}
