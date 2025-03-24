import { SystemData, SystemDataKeys } from "./system";

export type ToClientData =
  | {
      type: "systemData";
      payload: SystemData;
    }
  | {
      type: SystemDataEvents.VIEW;
      payload: ViewOptions;
    }
  | {
      type: SystemDataEvents.INC_STATES;
      payload: SystemDataKeys;
    };

export enum ViewOptions {
  DEFAULT = "default",
  GPU = "gpu",
}

export enum SystemDataEvents {
  GET = "get",
  UPDATE = "update",
  VIEW = "view",
  INC_STATES = "included_stats",
}

export type ToAppData =
  | {
      type: SystemDataEvents.GET;
      request: "view";
    }
  | {
      type: SystemDataEvents.GET;
      request: "included_stats";
    }
  | {
      type: SystemDataEvents.GET;
      request: "systemData";
    }
