import { LinkClient } from "./models"

export type Request = {
  id: string
  inc: number
}

export enum LINK_TO_SERVER {
  SCORE = 'score',
  DATA = 'data',
  COLOR = 'color',
  REQUEST_NEW_CLIENT = 'requestNewClient'
}

export enum LINK_TO_CLIENT {
  DATA = 'totalData',
  COLOR = 'color',
  INIT = 'init'
}

export type ToLinkData = (
  | {
    type: LINK_TO_SERVER.SCORE
    request: 'add'
    clientId: string
    payload: {
      inc: number
    }
  }
  | {
    type: LINK_TO_SERVER.COLOR
    request: 'set'
    clientId: string
    payload: {
      color: string
    }
  }
  | {
    type: LINK_TO_SERVER.COLOR
    request: 'get'
    clientId: string
  }
  | {
    type: LINK_TO_SERVER.SCORE
    request: 'get'
    clientId: string
  }
  | {
    type: LINK_TO_SERVER.DATA
    request: 'get'
    clientId: string
  }
  | {
    type: LINK_TO_SERVER.REQUEST_NEW_CLIENT
    request: 'get'
    clientId?: string
  }
)

export type ToClientData = (
  | {
    type: LINK_TO_CLIENT.DATA
    request: 'set'
    clientId?: string
    payload: {
      clients: LinkClient[]
    }
  }
  | {
    type: LINK_TO_CLIENT.INIT
    request: 'set'
    clientId: string
    payload: {
      client: LinkClient
      clients: LinkClient[]
    }
  }
  | {
    type: LINK_TO_CLIENT.DATA
    request: 'update'
    clientId?: string
    payload: {
      client: LinkClient
    }
  }
  | {
    type: LINK_TO_CLIENT.COLOR
    request: 'set'
    clientId: string
    payload: {
      color: string
    }
  }
)