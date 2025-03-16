import { SpotifyStore } from "./spotifyStore";
import { DeskThing } from "@deskthing/server";
import { Device } from "../../shared/spotifyTypes";
import { PlayerResponse } from "../types/spotifyAPI";
import EventEmitter from "node:events";

type deviceStoreEvents = {
  deviceUpdate: [Device];
  devicesListUpdate: [Device[]];
};

export class DeviceStore extends EventEmitter<deviceStoreEvents> {
  private spotifyApi: SpotifyStore;
  private availableDevices: Device[] = [];
  private currentDevice: Device | null = null;

  constructor(spotifyApi: SpotifyStore) {
    super();
    this.spotifyApi = spotifyApi;
    this.refreshDevices()
  }

  async addDevicesFromPlayback(playback: PlayerResponse) {
    if (playback.device) {
      this.updateCurrentDevice(playback.device);
      this.addOrUpdateDevice(playback.device);
    }
  }

  async addDevicesFromDeviceList(devices: Device[]) {
    let devicesChanged = false;
    
    for (const device of devices) {
      const existingDeviceIndex = this.availableDevices.findIndex(d => d.id === device.id);
      
      if (existingDeviceIndex === -1) {
        this.availableDevices.push(device);
        devicesChanged = true;
      } else if (JSON.stringify(this.availableDevices[existingDeviceIndex]) !== JSON.stringify(device)) {
        this.availableDevices[existingDeviceIndex] = device;
        devicesChanged = true;
      }

      if (device.is_active) {
        this.updateCurrentDevice(device);
      }
    }

    if (devicesChanged) {
      this.emit("devicesListUpdate", this.availableDevices);
    }
  }

  private updateCurrentDevice(device: Device) {
    if (!this.currentDevice || this.currentDevice.id !== device.id) {
      this.currentDevice = device;
      this.emit("deviceUpdate", device);
    }
  }

  private addOrUpdateDevice(device: Device) {
    const existingDeviceIndex = this.availableDevices.findIndex(d => d.id === device.id);
    
    if (existingDeviceIndex === -1) {
      this.availableDevices.push(device);
      this.emit("devicesListUpdate", this.availableDevices);
    } else if (JSON.stringify(this.availableDevices[existingDeviceIndex]) !== JSON.stringify(device)) {
      this.availableDevices[existingDeviceIndex] = device;
      this.emit("devicesListUpdate", this.availableDevices);
    }
  }

  async refreshDevices() {
    try {
      const devices = await this.spotifyApi.getDevices();
      if (Array.isArray(devices)) {
        await this.addDevicesFromDeviceList(devices);
      }
    } catch (error) {
      DeskThing.sendError("Error refreshing devices: " + error);
    }
  }

  async transferPlayback(deviceId: string) {
    try {
      await this.spotifyApi.transferPlayback(deviceId);
    } catch (error) {
      DeskThing.sendError("Error transferring playback: " + error);
    }
  }

  getCurrentDevice(): Device | null {
    return this.currentDevice;
  }

  getAvailableDevices(): Device[] {
    return this.availableDevices;
  }
}