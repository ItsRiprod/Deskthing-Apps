import { create } from 'zustand';
import { createDeskThing } from '@deskthing/client';
import { LINK_TO_CLIENT, LINK_TO_SERVER, ToClientData, ToLinkData } from '@shared/transit';
import { LinkClient } from '@shared/models';

// Create DeskThing instance for client-server communication
const DeskThing = createDeskThing<ToClientData, ToLinkData>();

// Define the store state interface
interface ClientStoreState {
  // State
  clients: LinkClient[];
  currentClientId: string | null;
  initialized: boolean;
  
  // Actions
  setClients: (clients: LinkClient[]) => void;
  setCurrentClientId: (id: string) => void;
  updateClient: (client: LinkClient) => void;
  incrementScore: () => void;
  updateColor: (color: string) => void;
  requestNewClient: () => void;
  
  // Initialization
  initialize: () => void;
  isInitialized: () => boolean;
}

// Create the store
const useClientStore = create<ClientStoreState>((set, get) => ({
  // Initial state
  clients: [],
  currentClientId: null,
  initialized: false,
  
  // Actions to update state
  setClients: (clients) => {
    DeskThing.debug('Setting clients:', clients);
    set({ clients });
  },
  
  setCurrentClientId: (id) => {
    DeskThing.debug('Setting current client ID:', id);
    set({ currentClientId: id });
  },
  
  updateClient: (updatedClient) => {
    DeskThing.debug('Updating client:', updatedClient);
    set((state) => ({
      clients: state.clients.map(client => 
        client.id === updatedClient.id ? updatedClient : client
      )
    }));
  },
  
  incrementScore: () => {
    const { currentClientId } = get();
    if (currentClientId) {
      DeskThing.debug('Incrementing score for client:', currentClientId);
      DeskThing.send({
        type: LINK_TO_SERVER.SCORE,
        request: 'add',
        clientId: currentClientId,
        payload: {
          inc: 1
        }
      });
    } else {
      DeskThing.warn('Cannot increment score: no current client ID');
    }
  },
  
  updateColor: (color) => {
    const { currentClientId } = get();
    if (currentClientId) {
      DeskThing.debug('Updating color for client:', currentClientId, 'color:', color);
      DeskThing.send({
        type: LINK_TO_SERVER.COLOR,
        request: 'set',
        clientId: currentClientId,
        payload: {
          color
        }
      });
    } else {
      DeskThing.warn('Cannot update color: no current client ID');
    }
  },

  requestNewClient: () => {
    DeskThing.debug('Requesting new client connection');
    DeskThing.send({
      type: LINK_TO_SERVER.REQUEST_NEW_CLIENT,
      request: 'get',
    });
  },
  
  // Initialization
  initialize: () => {
    const { initialized } = get();
    if (initialized) {
      DeskThing.info('Store already initialized, skipping');
      return;
    }
    
    DeskThing.info('Initializing client store');
    
    // Set up listeners for messages from the server
    DeskThing.on(LINK_TO_CLIENT.INIT, (data) => {
      DeskThing.debug('Received INIT message:', data);
      if (data.request === 'set') {
        set({
          currentClientId: data.payload.client.id,
          clients: data.payload.clients
        });
      }
    });
    
    DeskThing.on(LINK_TO_CLIENT.DATA, (data) => {
      DeskThing.debug('Received DATA message:', data);
      if (data.request === 'set') {
        set({ clients: data.payload.clients });
      } else if (data.request === 'update') {
        get().updateClient(data.payload.client);
      }
    });
    
    DeskThing.on(LINK_TO_CLIENT.COLOR, (data) => {
      DeskThing.debug('Received COLOR message:', data);
      if (data.request === 'set' && data.clientId) {
        const clientToUpdate = get().clients.find(c => c.id === data.clientId);
        if (clientToUpdate) {
          const updatedClient = { ...clientToUpdate, color: data.payload.color };
          get().updateClient(updatedClient);
        } else {
          DeskThing.warn('Client not found for color update:', data.clientId);
        }
      }
    });
    
    // Request initial data from server
    DeskThing.debug('Requesting initial data from server');
    DeskThing.send({
      type: LINK_TO_SERVER.DATA,
      request: 'get',
      clientId: get().currentClientId || ''
    });
    
    set({ initialized: true });
    DeskThing.info('Client store initialization complete');
  },
  
  isInitialized: () => get().initialized
}));

// Utility functions
export const getClientById = (id: string): LinkClient | undefined => {
  const clients = useClientStore.getState().clients;
  return clients.find(client => client.id === id);
};

export const getCurrentClient = (): LinkClient | undefined => {
  const { currentClientId, clients } = useClientStore.getState();
  if (!currentClientId) return undefined;
  return clients.find(client => client.id === currentClientId);
};

export const getAllClients = (): LinkClient[] => {
  return useClientStore.getState().clients;
};

export const getOtherClients = (): LinkClient[] => {
  const { currentClientId, clients } = useClientStore.getState();
  return clients.filter(client => client.id !== currentClientId);
};

// Initialize the store
export const initializeClientStore = (): void => {
  useClientStore.getState().initialize();
};

export const isClientStoreInitialized = (): boolean => {
  return useClientStore.getState().isInitialized();
};

export default useClientStore;