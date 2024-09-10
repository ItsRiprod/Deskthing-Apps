import { DeskThing, SocketData } from "deskthing-client";

export interface ProcessData {
  cpuLoad: number;
  memUsage: number;
  cpuTemp: number;       // CPU temperature
  gpuTemp: number;       // Optional GPU temperature
  gpuUsage: number;      // Optional GPU usage
  uploadSpeed: number;   // Optional upload usage
  downloadSpeed: number; // Optional download usage
  diskRead: number;      // Disk read speed
  diskWrite: number;     // Disk write speed
  ping: number;      
  pingTime: number;
  processCount: number;  // Total number of processes
  activeProcesses: number; // Number of active processes
}

type Listener = (data: ProcessData) => void;

export class ProcessStore {
  private static instance: ProcessStore;
  private deskthing = DeskThing.getInstance();
  private processData: ProcessData = {
    pingTime: 0,
    cpuLoad: 0,
    memUsage: 0,
    cpuTemp: 0,
    gpuTemp: 0,
    gpuUsage: 0,
    uploadSpeed: 0,
    downloadSpeed: 0,
    diskRead: 0,
    diskWrite: 0,
    ping: 0,
    processCount: 0,
    activeProcesses: 0,
  }
  private listeners: Listener[] = [];
  private deskthingListener: () => void;

  constructor() {
    this.deskthingListener = this.deskthing.on("system", this.onAppData);
    this.deskthing.sendMessageToParent({ app: 'system', type: "set", request: "subscribe" });
  }

  static getInstance() {
    if (!ProcessStore.instance) {
      ProcessStore.instance = new ProcessStore();
    }
    return ProcessStore.instance;
  }

  destroy() {
    this.deskthingListener();
  }

  private onAppData = async (data: SocketData) => {
    if (!data.payload) return;

    if (data.type == 'system')
    this.setProcessData(data.payload as ProcessData);

    // Send pong so the server knows we are still alive
    this.deskthing.sendMessageToParent({
      app: "system",
      type: "set",
      request: "pong",
      payload: data.payload.ping,
    });

    this.notifyListeners();
  };

  private notifyListeners() {
    this.listeners.forEach((listener) =>
      listener(this.processData)
    );
  }

 

  get getProcessData(): ProcessData {
    return this.processData;
  }

  private setProcessData(value: ProcessData) {
    console.log('Setting value', value)
    this.processData = value;
  }


  on(callback: Listener): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback);
    };
  }
}

export default ProcessStore.getInstance();
