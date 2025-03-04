import { DeskThing } from "@deskthing/server";
import { DiscordRPC } from "./rpc-client";
import { TokenStorage } from "../utils/tokenStorage";
import { AuthConfig, DiscordConfig } from "../types/discordTypes";
import { SCOPES } from "../utils/static"

export class DiscordAuth {
  private rpc: DiscordRPC;
  private tokenStorage: TokenStorage;
  private accessToken: string | null = null;
  private scopes = SCOPES
  
  constructor(rpc: DiscordRPC, tokenStorage: TokenStorage) {
    this.rpc = rpc;
    this.tokenStorage = tokenStorage;
  }

  async authenticate(config: AuthConfig): Promise<void> {
    if (!this.rpc.isConnected) {
      throw new Error("RPC client is not connected");
    }

    try {
      // Try to get saved token first
      const savedToken = await this.tokenStorage.getToken();
      
      if (savedToken) {
        try {
          DeskThing.sendLog("Using saved token for authentication");
          await this.authenticateWithToken(savedToken);
          return;
        } catch (error) {
          DeskThing.sendLog("Saved token invalid, obtaining new one");
        }
      }
      
      // If no saved token or it's invalid, get a new one
      const token = await this.authorize(config);
      await this.authenticateWithToken(token);
      
    } catch (error) {
      DeskThing.sendError(`Authentication failed: ${error}`);
      throw error;
    }
  }

  private async authorize(config: AuthConfig): Promise<string> {
    DeskThing.sendLog("Requesting authorization from Discord");
    
    try {
      // Get authorization code through RPC
      const response = await this.rpc.request("AUTHORIZE", {
        client_id: config.clientId,
        scopes: this.scopes,
      });
      
      // Exchange code for token
      const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code: response.code,
          grant_type: "authorization_code",
        }),
      });
      
      if (!tokenResponse.ok) {
        throw new Error(`Failed to exchange code for token: ${tokenResponse.status}`);
      }
      
      const { access_token } = await tokenResponse.json();
      
      // Save the token for future use
      await this.tokenStorage.saveToken(access_token);
      
      return access_token;
      
    } catch (error) {
      DeskThing.sendError(`Authorization failed: ${error}`);
      throw error;
    }
  }

  private async authenticateWithToken(token: string): Promise<void> {
    DeskThing.sendLog("Authenticating with Discord using token");
    
    try {
      const response = await this.rpc.request("AUTHENTICATE", {
        access_token: token,
      });
      
      this.accessToken = token;
      DeskThing.sendLog("Successfully authenticated with Discord");
      
      return response;
      
    } catch (error) {
      DeskThing.sendError(`Token authentication failed: ${error}`);
      this.accessToken = null;
      throw error;
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }
}
