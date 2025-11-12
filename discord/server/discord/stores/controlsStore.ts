import { DiscordRPCStore } from "./rpcStore";
import { DeskThing } from "@deskthing/server";
import { EventEmitter } from "node:events";
import { DiscordAuth } from "../api/auth";

type callEvents = {
  muteChanged: [{ isMuted: boolean }];
  deafenChanged: [{ isDeafened: boolean }];
  disconnected: [];
  voiceStateChanged: [{ isMuted: boolean; isDeafened: boolean }];
};

export class CallControls extends EventEmitter<callEvents> {
  private rpc: DiscordRPCStore;
  private auth: DiscordAuth;

  constructor(rpc: DiscordRPCStore, auth: DiscordAuth) {
    super();
    this.rpc = rpc;
    this.auth = auth;
  }

  private async ensureConnection(context: string): Promise<void> {
    if (this.rpc.isConnected) {
      if (!this.rpc.user) {
        await this.rpc.updateUser();
      }
      return;
    }

    try {
      await this.auth.authenticate();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      console.error(
        `Failed to authenticate before ${context}: ${message}`
      );
      DeskThing.sendNotification({
        id: "discord_rpc_not_connected",
        type: "error",
        title: "Discord voice controls unavailable",
        description:
          "Please make sure Discord is running and your app credentials are set in settings.",
      });
      throw error;
    }

    if (!this.rpc.isConnected) {
      console.log("RPC client is not connected");
      throw new Error("RPC client is not connected");
    }

    await this.rpc.updateUser();
  }

  private async withConnection(
    context: string,
    action: () => Promise<void>
  ): Promise<void> {
    try {
      await this.ensureConnection(context);
      await action();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      console.error(`Failed to ${context}: ${message}`);
      throw error;
    }
  }
  async mute(): Promise<void> {
    await this.withConnection("mute", async () => {
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
    });
  }

  async unmute(): Promise<void> {
    await this.withConnection("unmute", async () => {
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
    });
  }

  async toggleMute(): Promise<void> {
    await this.withConnection("toggle mute", async () => {
      const voiceSettings = await this.rpc.getVoiceSettings();
      const newMuteState = !voiceSettings.mute;
      await this.rpc.setVoiceSettings({
        mute: newMuteState,
      });
      this.emit("muteChanged", { isMuted: newMuteState });
      this.emit("voiceStateChanged", {
        isMuted: newMuteState,
        isDeafened: this.rpc.user?.isDeafened || false,
      });
      console.log(`User ${newMuteState ? "muted" : "unmuted"}`);
    });
  }

  async deafen(): Promise<void> {
    await this.withConnection("deafen", async () => {
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
    });
  }

  async undeafen(): Promise<void> {
    await this.withConnection("undeafen", async () => {
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
    });
  }

  async toggleDeafen(): Promise<void> {
    await this.withConnection("toggle deafen", async () => {
      const voiceSettings = await this.rpc.getVoiceSettings();
      const newDeafenState = !voiceSettings.deaf;
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
    });
  }

  async disconnect(): Promise<void> {
    await this.withConnection("disconnect", async () => {
      await this.rpc.selectVoiceChannel(undefined);
      this.emit("disconnected");
      this.emit("voiceStateChanged", {
        isMuted: this.rpc.user?.isMuted || false,
        isDeafened: this.rpc.user?.isDeafened || false,
      });
      console.log("User disconnected from voice channel");
    });
  }
}
