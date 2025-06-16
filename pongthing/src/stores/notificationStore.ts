import { create } from 'zustand';
import { BaseStore } from '@src/types';
import { Notification } from '@shared/types/types';
import { createDeskThing } from "@deskthing/client";
import { FromClientToServer, FromServerToClient, GAME_SERVER } from "@shared/types/transit";

const DeskThing = createDeskThing<FromServerToClient, FromClientToServer>()

export interface NotificationStore extends BaseStore {
  notification: Notification | null
  clearNotification: () => void
}

export const useNotificationStore = create<NotificationStore>((set, get) => {
  let unsubscribeNotificationFn: (() => void) | null = null;

  return {
    initialized: false,
    init: async () => {
      if (!get().initialized) {
        unsubscribeNotificationFn = DeskThing.on(GAME_SERVER.NOTIFICATION, (data) => {
          set({ notification: data.payload });
        });
        set({ initialized: true });
      }
    },
    unmount: async () => {
      if (unsubscribeNotificationFn) {
        unsubscribeNotificationFn();
        unsubscribeNotificationFn = null;
      }
      set({ initialized: false });
    },
    notification: null,
    clearNotification: () => {
      set({ notification: null });
    }
  }
});