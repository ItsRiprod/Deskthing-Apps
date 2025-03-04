
import { DiscordRPC } from "../api/rpc-client"
import { DeskThing } from "@deskthing/server"

export class CallControls {
  private rpc: DiscordRPC

  constructor(rpc: DiscordRPC) {
    this.rpc = rpc
  }
  async mute(): Promise<void> {
    try {
      await this.rpc.setVoiceSettings({
        mute: true,
        deaf: false,
      });
      DeskThing.sendLog("User muted");
    } catch (error) {
      DeskThing.sendError(`Failed to mute: ${error}`);
    }
  }

  async unmute(): Promise<void> {
    try {
      await this.rpc.setVoiceSettings({
        mute: false,
        deaf: false,
      });
      DeskThing.sendLog("User unmuted");
    } catch (error) {
      DeskThing.sendError(`Failed to unmute: ${error}`);
    }
  }

  async toggleMute(): Promise<void> {
    try {
      
      await this.rpc.setVoiceSettings({
        mute: !this.rpc.user?.isMuted || false,
      });
      DeskThing.sendLog(`User ${this.rpc.user?.isMuted ? 'unmuted' : 'muted'}`);
    } catch (error) {
      DeskThing.sendError(`Failed to toggle mute: ${error}`);
    }
  }

  async deafen(): Promise<void> {
    try {
      await this.rpc.setVoiceSettings({
        deaf: true,
        mute: false,
      });
      DeskThing.sendLog("User deafened");
    } catch (error) {
      DeskThing.sendError(`Failed to deafen: ${error}`);
    }
  }

  async undeafen(): Promise<void> {
    try {
      await this.rpc.setVoiceSettings({
        deaf: false,
        mute: false,
      });
      DeskThing.sendLog("User undeafened");
    } catch (error) {
      DeskThing.sendError(`Failed to undeafen: ${error}`);
    }
  }

  async toggleDeafen(): Promise<void> {
    try {
      await this.rpc.setVoiceSettings({
        mute: !this.rpc.user?.isDeafened || false,
        deaf: !this.rpc.user?.isDeafened || false,
      });
      DeskThing.sendLog(`User ${!this.rpc.user?.isDeafened ? 'undeafened' : 'deafened'}`);
    } catch (error) {
      DeskThing.sendError(`Failed to toggle deafen: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.rpc.selectVoiceChannel(undefined);
      DeskThing.sendLog("User disconnected from voice channel");
    } catch (error) {
      DeskThing.sendError(`Failed to disconnect: ${error}`);
    }
  }
}