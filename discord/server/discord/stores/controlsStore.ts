import { DiscordRPCStore } from "./rpcStore";
import { DeskThing } from "@deskthing/server";
import { EventEmitter } from "node:events";

type callEvents = {
  muteChanged: [{ isMuted: boolean }];
  deafenChanged: [{ isDeafened: boolean }];
  disconnected: [];
  voiceStateChanged: [{ isMuted: boolean; isDeafened: boolean }];
};

export class CallControls extends EventEmitter<callEvents> {
  private rpc: DiscordRPCStore;

  constructor(rpc: DiscordRPCStore) {
    super();
    this.rpc = rpc;
  }

  async mute(): Promise<void> {
    try {
      await this.rpc.setVoiceSettings({
        mute: true,
        deaf: false,
      });
      this.emit("muteChanged", { isMuted: true });
      this.emit("voiceStateChanged", {
        isMuted: true,
        isDeafened: this.rpc.user?.isDeafened || false,
      });
      console.log("User muted");
    } catch (error) {
      console.error(`Failed to mute: ${error}`);
    }
  }

  async unmute(): Promise<void> {
    try {
      await this.rpc.setVoiceSettings({
        mute: false,
        deaf: false,
      });
      this.emit("muteChanged", { isMuted: false });
      this.emit("voiceStateChanged", {
        isMuted: false,
        isDeafened: this.rpc.user?.isDeafened || false,
      });
      console.log("User unmuted");
    } catch (error) {
      console.error(`Failed to unmute: ${error}`);
    }
  }

  async toggleMute(): Promise<void> {
    try {
      const newMuteState = !this.rpc.user?.isMuted || false;
      await this.rpc.setVoiceSettings({
        mute: newMuteState,
      });
      this.emit("muteChanged", { isMuted: newMuteState });
      this.emit("voiceStateChanged", {
        isMuted: newMuteState,
        isDeafened: this.rpc.user?.isDeafened || false,
      });
      console.log(`User ${newMuteState ? "muted" : "unmuted"}`);
    } catch (error) {
      console.error(`Failed to toggle mute: ${error}`);
    }
  }

  async deafen(): Promise<void> {
    try {
      await this.rpc.setVoiceSettings({
        deaf: true,
        mute: false,
      });
      this.emit("deafenChanged", { isDeafened: true });
      this.emit("voiceStateChanged", {
        isMuted: this.rpc.user?.isMuted || false,
        isDeafened: true,
      });
      console.log("User deafened");
    } catch (error) {
      console.error(`Failed to deafen: ${error}`);
    }
  }

  async undeafen(): Promise<void> {
    try {
      await this.rpc.setVoiceSettings({
        deaf: false,
        mute: false,
      });
      this.emit("deafenChanged", { isDeafened: false });
      this.emit("voiceStateChanged", {
        isMuted: this.rpc.user?.isMuted || false,
        isDeafened: false,
      });
      console.log("User undeafened");
    } catch (error) {
      console.error(`Failed to undeafen: ${error}`);
    }
  }

  async toggleDeafen(): Promise<void> {
    try {
      const newDeafenState = !this.rpc.user?.isDeafened || false;
      await this.rpc.setVoiceSettings({
        mute: newDeafenState,
        deaf: newDeafenState,
      });
      this.emit("deafenChanged", { isDeafened: newDeafenState });
      this.emit("voiceStateChanged", {
        isMuted: newDeafenState,
        isDeafened: newDeafenState,
      });
      console.log(`User ${newDeafenState ? "deafened" : "undeafened"}`);
    } catch (error) {
      console.error(`Failed to toggle deafen: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.rpc.selectVoiceChannel(undefined);
      this.emit("disconnected");
      this.emit("voiceStateChanged", {
        isMuted: this.rpc.user?.isMuted || false,
        isDeafened: this.rpc.user?.isDeafened || false,
      });
      console.log("User disconnected from voice channel");
    } catch (error) {
      console.error(`Failed to disconnect: ${error}`);
    }
  }
}
