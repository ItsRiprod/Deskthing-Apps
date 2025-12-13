import { create } from 'zustand';
import { createDeskThing } from '@deskthing/client';
import { DISCORD_ACTIONS } from '@shared/types/discord';
import { ToClientTypes, ToServerTypes } from '@shared/types/transit';
import { DISCORD_APP_ID } from '@src/constants/app';
import { useCallStore } from './callStore';

const DeskThing = createDeskThing<ToClientTypes, ToServerTypes>();
const APP_ID = DISCORD_APP_ID;

DeskThing.debug(`Initializing Discord control store with app id: ${APP_ID}`);

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
    useCallStore.getState().updateLocalVoiceState({ isMuted: true });
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.MUTE, value: 'mute', source: APP_ID });
  },
  unmute: () => {
    DeskThing.debug('Unmuting user');
    useCallStore.getState().updateLocalVoiceState({ isMuted: false });
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.MUTE, value: 'unmute', source: APP_ID });
  },
  toggleMute: () => {
    DeskThing.debug('Toggling mute');
    const currentState = useCallStore.getState();
    const isMuted = currentState.callStatus?.user?.isMuted ?? false;
    currentState.updateLocalVoiceState({ isMuted: !isMuted });
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.MUTE, value: 'toggle', source: APP_ID });
  },
  deafen: () => {
    DeskThing.debug('Deafening user');
    useCallStore.getState().updateLocalVoiceState({ isDeafened: true });
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.DEAFEN, value: 'deafen', source: APP_ID });
  },
  undeafen: () => {
    DeskThing.debug('Undeafening user');
    useCallStore.getState().updateLocalVoiceState({ isDeafened: false });
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.DEAFEN, value: 'undeafen', source: APP_ID });
  },
  toggleDeafen: () => {
    DeskThing.debug('Toggling deafen');
    const currentState = useCallStore.getState();
    const isDeafened = currentState.callStatus?.user?.isDeafened ?? false;
    currentState.updateLocalVoiceState({ isDeafened: !isDeafened });
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.DEAFEN, value: 'toggle', source: APP_ID });
  },
  disconnect: () => {
    DeskThing.debug('Disconnecting');
    DeskThing.triggerAction({ id: DISCORD_ACTIONS.DISCONNECT, source: APP_ID });
    // Optimistically clear local call state so UI reflects the disconnect immediately
    useCallStore.getState().setCallStatus({
      channelId: null,
      participants: [],
      isConnected: false,
      timestamp: Date.now(),
    });
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
