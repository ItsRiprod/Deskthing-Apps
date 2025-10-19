import { DeskThing } from "@deskthing/client"
import { create } from "zustand";

type ListenerId = symbol;
type KeyName = string;
type EventType = string;
type ListenerCallback = (e: Event | WheelEvent) => void;

interface ListenerEntry {
  cb: ListenerCallback;
  keys: KeyName[];
  eventType: EventType;
}

interface InputState {
  listeners: Map<ListenerId, ListenerEntry>;
  // which event types we've attached DOM listeners for
  isDomListening: Map<EventType, boolean>;
  isCaptured: boolean;
  capturedKeys: KeyName[];
  addListener: (cb: ListenerCallback, keys?: KeyName[], eventType?: EventType) => () => void;
  removeListener: (id: ListenerId) => void;
  setCaptured: (capture: boolean, keys?: KeyName[]) => void;
}

export const useInputStore = create<InputState>((set, get) => {
  const boundHandlers = new Map<EventType, (e: Event) => void>();

  function makeHandlerFor(eventType: EventType) {
    const handler = (e: Event) => {
      // when captured, try to prevent default behavior (e.g., wheel)
      if (get().isCaptured) {
        try {
          // some events (or environments) may not allow preventDefault
          (e as Event & { preventDefault?: () => void }).preventDefault?.();
        } catch {
          // ignore
        }
      }

      const snapshot = Array.from(get().listeners.values()).filter(l => l.eventType === eventType);
      for (const { cb } of snapshot) {
        try {
          cb(e);
        } catch {
          // swallow to avoid breaking other listeners
        }
      }
    };
    boundHandlers.set(eventType, handler);
    return handler;
  }

  function updateDomListener() {
    if (typeof window === "undefined") return;

    const currentTypes = new Set<EventType>();
    for (const entry of get().listeners.values()) {
      currentTypes.add(entry.eventType);
    }

    // Add listeners for newly used event types
    for (const type of currentTypes) {
      if (!get().isDomListening.get(type)) {
        const handler = boundHandlers.get(type) ?? makeHandlerFor(type);
        try {
          // wheel events need passive: false to allow preventDefault; others typically fine without it
          const options = type === "wheel" ? { passive: false } : undefined;
          window.addEventListener(type, handler as EventListener, options);
        } catch {
          // some environments or event types may throw; ignore
        }
        get().isDomListening.set(type, true);
        // sync store flag so consumers can react
        set({ isDomListening: new Map(get().isDomListening) });
      }
    }

    // Remove listeners for event types no longer used
    const trackedTypes = Array.from(get().isDomListening.keys());
    for (const type of trackedTypes) {
      if (!currentTypes.has(type) && get().isDomListening.get(type)) {
        const handler = boundHandlers.get(type);
        try {
          if (handler) window.removeEventListener(type, handler as EventListener);
        } catch {
          // ignore
        }
        get().isDomListening.delete(type);
        set({ isDomListening: new Map(get().isDomListening) });
      }
    }
  }

  function applyCapture(capture: boolean, keys: KeyName[]) {
    if (capture) {
      DeskThing.overrideKeys(keys);
    } else {
      DeskThing.restoreKeys(keys);
    }
  }

  function unionKeys(provided?: KeyName[]) {
    if (provided && provided.length > 0) return Array.from(new Set(provided));
    // derive from listeners
    const all: KeyName[] = [];
    for (const { keys } of get().listeners.values()) {
      all.push(...keys);
    }
    return Array.from(new Set(all));
  }

  return {
    listeners: new Map(),
    isDomListening: new Map(),
    isCaptured: false,
    capturedKeys: [],
    addListener(cb: ListenerCallback, keys: KeyName[] = [], eventType: EventType = "wheel") {
      const id = Symbol("inputListener");
      get().listeners.set(id, { cb, keys, eventType });
      updateDomListener();
      // return dismount function
      return () => {
        // ensure remove happens via store method
        get().removeListener(id);
      };
    },
    removeListener(id: ListenerId) {
      get().listeners.delete(id);
      updateDomListener();
    },
    setCaptured(capture: boolean, keys?: KeyName[]) {
      if (capture === get().isCaptured && (!keys || JSON.stringify(unionKeys(keys)) === JSON.stringify(get().capturedKeys))) {
        return;
      }

      const keysToUse = unionKeys(keys);
      set({ isCaptured: capture, capturedKeys: keysToUse });
      applyCapture(capture, keysToUse);
    },
  };
});