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
    
    try {
      const response = await fetch('http://localhost:3333/gpu-stats');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const gpuStats = await response.json();
      return {
        temp: gpuStats.temp ?? 0,
        usage: gpuStats.usage ?? 0,
        // You can use other properties from gpuStats if needed
      };
    } catch (error) {
      console.error("Error fetching GPU stats:", error);
      return {
        temp: 0,
        usage: 0,
      };
    }
  }

  private async getCpuStats() {
    if (!this.includedStats.includes("cpu")) return undefined;
  
    try {
      const loadData = await si.currentLoad();
  
      // Fetch from your CPU temp server
      const response = await fetch('http://localhost:3334/cpu-temp');
      const cpuTempData = await response.json();
      const temp = cpuTempData.temp ?? 0;
  
      return {
        load: loadData.currentLoad / 100, // 0.23 for 23%
        temp: temp,
      };
    } catch (error) {
      console.error("Error fetching CPU stats:", error);
      return {
        load: 0,
        temp: 0,
      };
    }
  }
  
  

  private async getRamStats() {
    if (!this.includedStats.includes("ram")) return undefined;
    const ramData = await si.mem();

    return {
      usage: ramData.active,
      total: ramData.total,
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
      console.log("Starting getData collection...");
      
      const ram = await this.getRamStats();
      console.log("RAM stats collected:", ram);
      
      const cpu = await this.getCpuStats();
      console.log("CPU stats collected:", cpu);
      
      const gpu = await this.getGraphicsStats();
      console.log("GPU stats collected:", gpu);
      
      const network = await this.getNetworkStats();
      console.log("Network stats collected:", network);
      
      const processes = await this.getProcessStats();
      console.log("Process stats collected:", processes);
  
      const payload = { cpu, gpu, ram, network, processes };
      console.log("Final payload assembled:", payload);
  
      this.data = payload;
      console.log("About to emit data event");
      this.emit("data", this.data);
      console.log("Data event emitted");
      return this.data;
    } catch (error) {
      console.error("Error collecting system data:", error);
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

