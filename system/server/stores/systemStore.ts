import { EventEmitter } from "events";
import si from "systeminformation";
import { SystemData, SystemDataKeys } from "@shared/types/";
import { DeskThing } from "@deskthing/server";
import { Client } from "@deskthing/types";

interface SystemEvents {
  data: [SystemData];
  error: [{ error: Error }];
  clients: [Client[]];
}

export class SystemStore extends EventEmitter<SystemEvents> {
  private data: SystemData | null = null;
  private static instance: SystemStore | null = null;
  private interval: number = 1000;
  private clients: Client[] = [];
  private backgroundTask: (() => void) | null = null;
  private includedStats: SystemDataKeys = [
    "cpu",
    "gpu",
    "ram",
    "network",
    "processes",
  ];

  constructor() {
    super();
    this.on('clients', (clients) => {
      if (clients.length > 0 && !this.backgroundTask) {
        DeskThing.sendDebug(`Starting system data update task because there are ${clients.length} clients...`)
        this.startBackgroundTask()
      } else if (this.backgroundTask) {
        this.killBackgroundTask()
      }
    })
  }

  public addClient(client: Client) {
    if (client.currentApp == 'system' &&
      !this.clients.some(
        (existingClient) => existingClient.connectionId === client.connectionId
      )
    ) {
      this.clients.push(client);
      this.emit("clients", this.clients);
    }
  }
  public removeClient(clientId: string) {
    this.clients = this.clients.filter(
      (client) => client.connectionId !== clientId
    );
    this.emit("clients", this.clients);
  }
  public setClients(clients: Client[]) {
    this.clients = clients.filter((client) => client.currentApp == 'system');
    this.emit("clients", this.clients);
  }

  public static getInstance() {
    if (SystemStore.instance) {
      return SystemStore.instance;
    }
    SystemStore.instance = new SystemStore();
    return SystemStore.instance;
  }

  private async killBackgroundTask() {
    if (this.backgroundTask) {
      this.backgroundTask = null;
    }
  }

  private async startBackgroundTask() {
    this.killBackgroundTask();
    this.backgroundTask = DeskThing.setInterval(async () => {
      DeskThing.sendDebug(`Updating system data...`);
      await this.getData();
      DeskThing.sendDebug(`Updated system data`);
    }, this.interval);
  }

  async updateIncludedStats(stats: SystemDataKeys) {
    this.includedStats = stats;
  }

  private async getGraphicsStats() {
    if (!this.includedStats.includes("gpu")) return undefined;
    const gpuData = await si.graphics();

    return {
      temp: gpuData.controllers[0].temperatureGpu || 0,
      usage: gpuData.controllers[0].utilizationGpu || 0,
    };
  }

  private async getCpuStats() {
    if (!this.includedStats.includes("cpu")) return undefined;
    const cpuData = await si.cpuTemperature();

    return {
      load: cpuData.main,
      temp: cpuData.main,
    };
  }

  private async getRamStats() {
    if (!this.includedStats.includes("ram")) return undefined;
    const ramData = await si.mem();

    return {
      usage: ramData.active,
    };
  }

  private async getNetworkStats() {
    if (!this.includedStats.includes("network")) return undefined;
    const networkData = await si.networkStats();

    return {
      upload: networkData[0].tx_sec,
      download: networkData[0].rx_sec,
      ping: Math.round((Math.random() + 0.1) * 100),
      pingTime: networkData[0].ms,
    };
  }

  private async getProcessStats() {
    if (!this.includedStats.includes("processes")) return undefined;
    const processData = await si.processes();

    return {
      count: processData.all,
      active: processData.running,
    };
  }

  async getData(): Promise<SystemData | null> {
    try {
      this.data = {
        cpu: await this.getCpuStats(),
        gpu: await this.getGraphicsStats(),
        ram: await this.getRamStats(),
        network: await this.getNetworkStats(),
        processes: await this.getProcessStats(),
      };

      this.emit("data", this.data);
      return this.data;
    } catch (error) {
      this.emit("error", { error: error as Error });
      return null;
    }
  }

  async updateInterval(interval: number) {
    if (interval != this.interval) {
      this.interval = interval;
      this.startBackgroundTask();
    }
  }
}

export default SystemStore.getInstance();
