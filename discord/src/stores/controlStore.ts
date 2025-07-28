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
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.MUTE, value: 'mute', source: 'discord' });
  },
  unmute: () => {
    DeskThing.debug('Unmuting user');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.MUTE, value: 'unmute', source: 'discord' });
  },
  toggleMute: () => {
    DeskThing.debug('Toggling mute');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.MUTE, value: 'toggle', source: 'discord' });
  },
  deafen: () => {
    DeskThing.debug('Deafening user');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.DEAFEN, value: 'deafen', source: 'discord' });
  },
  undeafen: () => {
    DeskThing.debug('Undeafening user');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.DEAFEN, value: 'undeafen', source: 'discord' });
  },
  toggleDeafen: () => {
    DeskThing.debug('Toggling deafen');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.DEAFEN, value: 'toggle', source: 'discord' });
  },
  disconnect: () => {
    DeskThing.debug('Disconnecting');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.DISCONNECT, source: 'discord' });
  },
  reauthorize: () => {
    DeskThing.debug('Reauthorizing');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.REAUTH, source: 'discord' });
  },
  updateRichPresence: () => {
    DeskThing.debug('Updating rich presence');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.REPRESENCE, source: 'discord' });
  },
  expandChat: () => {
    DeskThing.debug('Expanding chat');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.EXPAND_CHAT, source: 'discord' });
  },
  collapseChat: () => {
    DeskThing.debug('Collapsing chat');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.COLLAPSE_CHAT, source: 'discord' });
  },
  selectTextChannel: (channelId: string) => {
    DeskThing.debug('Selecting text channel');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.SELECT_TEXT_CHANNEL, value: channelId, source: 'discord' });
  },
  dispatchAction: (actionId: string, value?: string) => {
    DeskThing.debug(`Dispatching action: ${actionId}${value ? ` with value: ${value}` : ''}`);
    DeskThing.triggerAction({ id: actionId, value, source: 'discord' });
  },
}));