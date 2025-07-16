import { DeskThing } from "@deskthing/server";
import { DiscordRPCStore } from "../stores/rpcStore";
import { TokenStorage } from "../utils/tokenStorage";
import { SCOPES } from "../utils/static"

export class DiscordAuth {
  private rpc: DiscordRPCStore;
  private tokenStorage: TokenStorage;
  private accessToken: string | null = null;
  private scopes = SCOPES
  private clientId: string | null = null
  private clientSecret: string | null = null
  private isAuthenticating = false

  constructor(rpc: DiscordRPCStore, tokenStorage: TokenStorage) {
    this.rpc = rpc;
    this.tokenStorage = tokenStorage;
  }

  setClientId(clientId: string): void {
    this.clientId = clientId;
    this.tryInitialAuth();
  }

  setClientSecret(clientSecret: string): void {
    this.clientSecret = clientSecret;
    this.tryInitialAuth();
  }

  private async tryInitialAuth(): Promise<void> {
    if (this.clientId && this.clientSecret && !this.accessToken) {
      await this.authenticate();
    }
  }

  async authenticate(): Promise<void> {
    if (this.isAuthenticating) return
    this.isAuthenticating = true
    try {
      // Try to get saved token first
      const savedToken = await this.tokenStorage.getToken();
      
      if (savedToken) {
        try {
          console.log("Using saved token for authentication");
          await this.authenticateWithToken(savedToken);
          this.isAuthenticating = false
          return;
        } catch (error) {
          console.log("Saved token invalid, obtaining new one");
        }
      }
      
      // If no saved token or it's invalid, get a new one
      const token = await this.authorize();
      console.log("Obtained new token, authenticating...");
      await this.authenticateWithToken(token);
      
      this.isAuthenticating = false
    } catch (error) {
      console.error(`Authentication failed: ${error}`);
      this.isAuthenticating = false
    }
  }

  private async authorize(): Promise<string> {
    console.log("Requesting authorization from Discord");
    
    if (!this.clientId || !this.clientSecret ) {
      console.warn('Client ID or Client Secret is not defined - cancelling the authorization')
      throw new Error('Client ID or Client Secret is not defined')
    }

    if (!this.rpc.isConnected) {
      // Throws - but let it throw
      console.debug('Attempting to reconnect RPC before authorizing')
      await this.rpc.connect(this.clientId);
    }

    try {
      // Get authorization code through RPC
      const response = await this.rpc.request("AUTHORIZE", {
        client_id: this.clientId,
        scopes: this.scopes,
      });
      
      // Exchange code for token
      const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code: response.code,
          grant_type: "authorization_code",
        }),
      });
      
      if (!tokenResponse.ok) {
        throw new Error(`Failed to exchange code for token: ${tokenResponse.status}: ${tokenResponse.statusText}`);
      }
      const { access_token } = await tokenResponse.json();
      
      // Save the token for future use
      await this.tokenStorage.saveToken(access_token);
      
      return access_token;
      
    } catch (error) {
      console.error(`Authorization failed: ${error}`);
      throw error;
    }
  }

  private async authenticateWithToken(token: string): Promise<void> {
    console.log("Authenticating with Discord using token");

    if (!this.rpc.isConnected) {
      if (!this.clientId) {
        throw new Error("RPC client is not connected and clientId was not provided");
      }
      console.debug('Attempting to reconnect RPC before authenticating with tokens')
      // Throws, but let throw
      await this.rpc.connect(this.clientId);
    }

    try {
      const response = await this.rpc.authenticate(token);
      
      this.accessToken = token;
      console.log("Successfully authenticated with Discord");
      return response;
      
    } catch (error) {
      console.error(`Token authentication failed: ${error}`);
      this.accessToken = null;
      throw error;
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }
}
