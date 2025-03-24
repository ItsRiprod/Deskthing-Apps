import { createDeskThing } from '@deskthing/client';
import { SystemData, ToAppData, ToClientData } from '@shared/types'

const DeskThing = createDeskThing<ToClientData, ToAppData>();

type Listener = (data: SystemData) => void;

export class ProcessStore {
  private static instance: ProcessStore;
  private processData: SystemData = {}
  private listeners: Listener[] = [];
  private deskthingListener: () => void;

  constructor() {
    this.deskthingListener = DeskThing.on("systemData", async (data) => {
      if (!data.payload) return;
  
      this.setProcessData(data.payload);
  
      this.notifyListeners();
    })
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

  private notifyListeners() {
    this.listeners.forEach((listener) =>
      listener(this.processData)
    );
  }

 

  get getProcessData(): SystemData {
    return this.processData;
  }

  private setProcessData(value: SystemData) {
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
