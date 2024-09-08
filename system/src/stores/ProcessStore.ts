import { DeskThing, SocketData } from "deskthing-client";

export interface ProcessData {
  memUsage: number;
  cpuUsage: number;
}

type Listener = (data: ProcessData) => void;

export class ProcessStore {
  private static instance: ProcessStore;
  private deskthing = DeskThing.getInstance();
  private _cpuUsage: number = 0.5;
  private _memUsage: number = 0.8;
  private listeners: Listener[] = [];
  private deskthingListener: () => void;

  constructor() {
      this.deskthingListener = this.deskthing.on("system", this.onAppData);
      this.deskthing.sendMessageToParent({type: 'set', request: 'subscribe'})
  }

  static getInstance() {
    if (!ProcessStore.instance) {
      ProcessStore.instance = new ProcessStore();
    }
    return ProcessStore.instance;
  }

  destroy() {
    this.deskthingListener()
  }

  private onAppData = async (data: SocketData) => {
    console.log(data);
    if (!data.payload) return;
    if (typeof data.payload.memUsage === "number") {
      this.setMemUsage(data.payload.memUsage);
    }
    if (typeof data.payload.cpuUsage === "number") {
      this.setCpuUsage(data.payload.cpuUsage);
    }

    // send pong so the server knows we are still alive
    this.deskthing.sendMessageToParent({
      type: "set",
      request: "pong",
      payload: data.payload.ping,
    });

    this.notifyListeners();
  };

  private notifyListeners() {
    this.listeners.forEach((listener) => listener({
      memUsage: this.memUsage,
      cpuUsage: this.cpuUsage,
    }));
  }

  get cpuUsage(): number {
    return this._cpuUsage;
  }

  get memUsage(): number {
    return this._memUsage;
  }

  private setCpuUsage(value: number) {
    this._cpuUsage = value;
  }

  private setMemUsage(value: number) {
    this._memUsage = value;
  }

  on(callback: Listener): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(
        (listener) => listener !== callback
      );
    };
  }
}

export default ProcessStore.getInstance();
