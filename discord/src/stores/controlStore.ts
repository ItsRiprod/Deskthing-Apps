import { create } from 'zustand';
import { createDeskThing } from '@deskthing/client';
import { DISCORD_ACTIONS } from '@shared/types/discord';
import { ToClientTypes, ToServerTypes } from '@shared/types/transit';
import manifest from '../../deskthing/manifest.json';

const DeskThing = createDeskThing<ToClientTypes, ToServerTypes>();
const APP_ID = manifest.id;

interface ControlStore {
  mute: () => void;
  unmute: () => void;
  toggleMute: () => void;
  deafen: () => void;
  undeafen: () => void;
  toggleDeafen: () => void;
  disconnect: () => void;
  reauthorize: () => void;
  updateRichPresence: () => void;
  expandChat: () => void;
  collapseChat: () => void;
  selectTextChannel: (channelId: string) => void;
  dispatchAction: (actionId: string, value?: string) => void;
}

export const useControlStore = create<ControlStore>(() => ({
  mute: () => {
    DeskThing.debug('Muting user');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.MUTE, value: 'mute', source: APP_ID });
  },
  unmute: () => {
    DeskThing.debug('Unmuting user');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.MUTE, value: 'unmute', source: APP_ID });
  },
  toggleMute: () => {
    DeskThing.debug('Toggling mute');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.MUTE, value: 'toggle', source: APP_ID });
  },
  deafen: () => {
    DeskThing.debug('Deafening user');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.DEAFEN, value: 'deafen', source: APP_ID });
  },
  undeafen: () => {
    DeskThing.debug('Undeafening user');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.DEAFEN, value: 'undeafen', source: APP_ID });
  },
  toggleDeafen: () => {
    DeskThing.debug('Toggling deafen');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.DEAFEN, value: 'toggle', source: APP_ID });
  },
  disconnect: () => {
    DeskThing.debug('Disconnecting');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.DISCONNECT, source: APP_ID });
  },
  reauthorize: () => {
    DeskThing.debug('Reauthorizing');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.REAUTH, source: APP_ID });
  },
  updateRichPresence: () => {
    DeskThing.debug('Updating rich presence');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.REPRESENCE, source: APP_ID });
  },
  expandChat: () => {
    DeskThing.debug('Expanding chat');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.EXPAND_CHAT, source: APP_ID });
  },
  collapseChat: () => {
    DeskThing.debug('Collapsing chat');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.COLLAPSE_CHAT, source: APP_ID });
  },
  selectTextChannel: (channelId: string) => {
    DeskThing.debug('Selecting text channel');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.SELECT_TEXT_CHANNEL, value: channelId, source: APP_ID });
  },
  dispatchAction: (actionId: string, value?: string) => {
    DeskThing.debug(`Dispatching action: ${actionId}${value ? ` with value: ${value}` : ''}`);
    DeskThing.triggerAction({ id: actionId, value, source: APP_ID });
  },
}));
