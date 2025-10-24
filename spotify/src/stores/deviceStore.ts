import { Device } from "../../shared/spotifyTypes";
import { create } from "zustand";
import { createDeskThing } from "@deskthing/client";
import { ToClientTypes, ToServerTypes, SpotifyEvent } from "../../shared/transitTypes";

const DeskThing = createDeskThing<ToClientTypes, ToServerTypes>();

type DeviceStoreState = {
  devices: Device[];
  activeDevice: Device | null;
  loading: boolean;
  error: string | null;
  fetchDevices: () => void;
  setActiveDevice: (deviceId: string) => void;
  clearActiveDevice: () => void;
};

export const useDeviceStore = create<DeviceStoreState>((set, get) => {
  // Listen for device list updates
  DeskThing.on("deviceList", (data) => {
    set({
      devices: data.payload,
      activeDevice: data.payload.find((d) => d.is_active) || null,
      loading: false,
      error: null,
    });
    DeskThing.debug(`Got ${data.payload.length} devices`, data);
  });

  // Listen for active device updates
  DeskThing.on("device", (data) => {
    set({ activeDevice: data.payload });
    DeskThing.debug("Active device updated", data);
  });

  return {
    devices: [],
    activeDevice: null,
    loading: false,
    error: null,

    fetchDevices: () => {
      set({ loading: true, error: null });
      DeskThing.send({ type: SpotifyEvent.GET, request: "refresh" });
    },

    setActiveDevice: (deviceId: string) => {
      DeskThing.send({ type: SpotifyEvent.SET, request: "device", payload: deviceId });
      // The device update will be handled by the "device" event above
    },

    clearActiveDevice: () => set({ activeDevice: null }),
  };
});
