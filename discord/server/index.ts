import { DeskThing } from '@deskthing/server';
import { setupTasks } from './setupTasks';
import { setupSettings } from './setupSettings';
import { ServerEvent } from '@deskthing/types';
import { setupActions } from './setupActions';
import discord from './discord/index';
export { DeskThing } // Required export of this exact name for the server to connect
import dotenv from 'dotenv'
dotenv.config()

DeskThing.on(ServerEvent.START, () => {
  setupTasks()
  setupSettings()
  setupActions()

  // if (process.env.DESKTHING_ENV == 'development') {
    
  //   if (process.env.DISCORD_CLIENT_ID) {
  //     discord.setClientId(process.env.DISCORD_CLIENT_ID)
  //   }
  //   if (process.env.DISCORD_CLIENT_SECRET) {
  //     discord.setClientSecret(process.env.DISCORD_CLIENT_SECRET)
  //   }
  // }
})

DeskThing.on(ServerEvent.GET, async (socketData) => {
  switch (socketData.request) {
    case 'call':
      return discord.sendCallStatus()
    case 'chat':
      return discord.sendChatStatus()
    case 'notification':
      return discord.sendNotificationStatus()
    default:
      return
  }
})


DeskThing.on(ServerEvent.STOP, () => {})