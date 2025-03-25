import { createDeskThing } from "@deskthing/server";
import { APP_REQUESTS, DESKTHING_EVENTS, SETTING_TYPES } from "@deskthing/types";
import SystemStore from "../stores/systemStore";
import { SystemDataKeys, ToAppData, ToClientData } from "@shared/types/index";
import { SystemDataEvents, ViewOptions } from "../../shared/types/index";
const DeskThing = createDeskThing<ToAppData, ToClientData>();

export const initListeners = async () => {
  DeskThing.fetch(
    { type: APP_REQUESTS.GET, request: "connections" },
    { type: DESKTHING_EVENTS.CLIENT_STATUS, request: "connections" },
    (data) => {
      if (data) {
        console.log('connections retrieved from the server: ', data)
        SystemStore.setClients(data.payload)
      }
    }
  );
};

DeskThing.on(DESKTHING_EVENTS.SETTINGS, (settingData) => {
  const setting = settingData.payload;

  if (!setting) return;

  if (setting.view.type == SETTING_TYPES.SELECT) {
    DeskThing.sendDebug(`View changed to ${setting.view.value}`);
    DeskThing.send({
      type: SystemDataEvents.VIEW,
      payload: setting.view.value as ViewOptions,
    });
  }

  if (setting.include_stats.type == SETTING_TYPES.MULTISELECT) {
    DeskThing.sendDebug(
      `Included stats changed to ${setting.include_stats.value}`
    );
    SystemStore.updateIncludedStats(
      setting.include_stats.value as SystemDataKeys
    );
  }

  if (setting.update_interval.type == SETTING_TYPES.NUMBER) {
    DeskThing.sendDebug(
      `Update interval changed to ${setting.update_interval.value}`
    );
    SystemStore.updateInterval(setting.update_interval.value * 1000);
  }
});

DeskThing.on(DESKTHING_EVENTS.CLIENT_STATUS, (data) => {
  switch (data.request) {
    case "opened":
      DeskThing.sendDebug(`Client opened app`);
      SystemStore.addClient(data.payload);
      break;
    case "closed":
      DeskThing.sendDebug(`Client closed app`);
      SystemStore.removeClient(data.payload.connectionId);
      break;
    case "disconnected":
      DeskThing.sendDebug(`Client disconnected app`);
      SystemStore.removeClient(data.payload);
      break;
  }
});

SystemStore.on("data", (data) => {
  DeskThing.sendDebug(`Updating the data: ${JSON.stringify(data)}`)
  DeskThing.send({ type: "systemData", payload: data });
});
