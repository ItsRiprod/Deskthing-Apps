import { useCallback } from 'react';
import { DeskThing } from '@deskthing/client';

// Define action type constants
export const ACTIONS = {
  MUTE: 'mute',
  DEAFEN: 'deafen',
  DISCONNECT: 'disconnect',
  REAUTH: 'reauth',
  REPRESENCE: 'represence',
  EXPAND_CHAT: 'expandChat',
  COLLAPSE_CHAT: 'collapseChat',
  SELECT_TEXT_CHANNEL: 'selectTextChannel',
} as const;

// Define action value options
export const ACTION_VALUES = {
  TOGGLE: 'toggle',
  ON: 'mute', // or 'deafen' for deafen action
  OFF: 'unmute', // or 'undeafen' for deafen action
} as const;

export function useDiscordActions() {
  // Voice control actions
  const mute = useCallback(() => {
    DeskThing.debug('Muting user')
    DeskThing.triggerAction({ id: ACTIONS.MUTE, value: 'mute', enabled: true });
  }, []);

  const unmute = useCallback(() => {
    DeskThing.debug('Unmuting user')
    DeskThing.triggerAction({ id: ACTIONS.MUTE, value: 'unmute', enabled: true });
  }, []);

  const toggleMute = useCallback(() => {
    DeskThing.debug('Toggling mute')
    DeskThing.triggerAction({ id: ACTIONS.MUTE, value: 'toggle', enabled: true });
  }, []);

  const deafen = useCallback(() => {
    DeskThing.debug('Deafening user')
    DeskThing.triggerAction({ id: ACTIONS.DEAFEN, value: 'deafen', enabled: true });
  }, []);

  const undeafen = useCallback(() => {
    DeskThing.debug('Undeafening user')
    DeskThing.triggerAction({ id: ACTIONS.DEAFEN, value: 'undeafen', enabled: true });
  }, []);

  const toggleDeafen = useCallback(() => {
    DeskThing.triggerAction({ id: ACTIONS.DEAFEN, value: 'toggle', enabled: true });
  }, []);

  const disconnect = useCallback(() => {
    DeskThing.debug('Disconnecting')
    DeskThing.triggerAction({ id: ACTIONS.DISCONNECT, enabled: true });
  }, []);

  // System actions
  const reauthorize = useCallback(() => {
    DeskThing.debug('Reauthorizing')
    DeskThing.triggerAction({ id: ACTIONS.REAUTH, enabled: true });
  }, []);

  const updateRichPresence = useCallback(() => {
    DeskThing.debug('Updating rich presence')
    DeskThing.triggerAction({ id: ACTIONS.REPRESENCE, enabled: true });
  }, []);

  const expandChat = useCallback(() => {
    DeskThing.debug('Expanding chat')
    DeskThing.triggerAction({ id: ACTIONS.EXPAND_CHAT, enabled: true });
  }, []);

  const collapseChat = useCallback(() => {
    DeskThing.debug('Collapsing chat')
    DeskThing.triggerAction({ id: ACTIONS.COLLAPSE_CHAT, enabled: true });
  }, []);

  const selectTextChannel = useCallback((channelId: string) => {
    DeskThing.debug('Selecting text channel')
    DeskThing.triggerAction({ id: ACTIONS.SELECT_TEXT_CHANNEL, value: channelId, enabled: true });
  }, []);


  // Generic action dispatcher (useful for dynamic actions)
  const dispatchAction = useCallback((actionId: string, value?: string) => {
    DeskThing.triggerAction({ 
      id: actionId, 
      value: value, 
      enabled: true 
    });
  }, []);

  return {
    // Voice actions
    mute,
    unmute,
    toggleMute,
    deafen,
    undeafen,
    toggleDeafen,
    disconnect,
    
    // System actions
    reauthorize,
    updateRichPresence,
    expandChat,
    collapseChat,
    selectTextChannel,
    
    // Generic dispatcher
    dispatchAction
  };
}