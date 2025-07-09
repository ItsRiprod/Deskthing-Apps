import { create } from 'zustand';
import { DeskThing } from '@deskthing/client';
import { DISCORD_ACTIONS } from '@shared/types/discord';

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
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.MUTE, value: 'mute' });
  },
  unmute: () => {
    DeskThing.debug('Unmuting user');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.MUTE, value: 'unmute' });
  },
  toggleMute: () => {
    DeskThing.debug('Toggling mute');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.MUTE, value: 'toggle' });
  },
  deafen: () => {
    DeskThing.debug('Deafening user');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.DEAFEN, value: 'deafen' });
  },
  undeafen: () => {
    DeskThing.debug('Undeafening user');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.DEAFEN, value: 'undeafen' });
  },
  toggleDeafen: () => {
    DeskThing.debug('Toggling deafen');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.DEAFEN, value: 'toggle' });
  },
  disconnect: () => {
    DeskThing.debug('Disconnecting');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.DISCONNECT });
  },
  reauthorize: () => {
    DeskThing.debug('Reauthorizing');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.REAUTH });
  },
  updateRichPresence: () => {
    DeskThing.debug('Updating rich presence');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.REPRESENCE });
  },
  expandChat: () => {
    DeskThing.debug('Expanding chat');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.EXPAND_CHAT });
  },
  collapseChat: () => {
    DeskThing.debug('Collapsing chat');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.COLLAPSE_CHAT });
  },
  selectTextChannel: (channelId: string) => {
    DeskThing.debug('Selecting text channel');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.SELECT_TEXT_CHANNEL, value: channelId });
  },
  dispatchAction: (actionId: string, value?: string) => {
    DeskThing.debug(`Dispatching action: ${actionId}${value ? ` with value: ${value}` : ''}`);
    DeskThing.triggerAction({ id: actionId, value });
  },
}));