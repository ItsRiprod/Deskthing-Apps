import { AppSettings } from "@deskthing/types"
import { DiscordSettings, AppSettingIDs } from "../../shared/types/discord";

// Main validator: only checks that all required keys are present
export function validateDiscordSettings(obj: AppSettings): asserts obj is DiscordSettings {

  const requiredIds = [
    AppSettingIDs.CLIENT_ID,
    AppSettingIDs.CLIENT_SECRET,
    AppSettingIDs.SET_MAIN_TEXT,
    AppSettingIDs.SET_SECONDARY_TEXT,
    AppSettingIDs.HAVE_TIMER,
    AppSettingIDs.LEFT_DASHBOARD_PANEL,
    AppSettingIDs.RIGHT_DASHBOARD_PANEL,
    AppSettingIDs.DASHBOARD_ELEMENTS,
  ];

  for (const id of requiredIds) {
    if (!(id in obj)) {
      throw new Error(`Missing setting: ${id}`);
    }
  }
}
