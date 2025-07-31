import { DeskThing } from "@deskthing/server";
import { DESKTHING_EVENTS } from "@deskthing/types";
import { ClockSettingIDs } from "@shared/types";

DeskThing.on(DESKTHING_EVENTS.SETTINGS, (setting) => {
  const fontUrl = setting.payload[ClockSettingIDs.FONT]?.value
  
  if (fontUrl) {
    // save the font URL
  }
})