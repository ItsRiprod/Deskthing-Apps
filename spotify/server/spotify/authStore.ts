import { DeskThing } from "@deskthing/server";
import { SpotifySettingIDs } from "../setupSettings";
import EventEmitter from "node:events"

type authStoreEvents = {
  authUpdate: [{authStatus: true}];
}

export class AuthStore extends EventEmitter<authStoreEvents> {
  private access_token?: string;
  private refresh_token?: string;
  private client_id?: string;
  private client_secret?: string;
  private redirect_uri?: string;
  private is_refreshing = false;
  private is_logging_in = false;

  constructor() {
    super()
    this.initializeAuth();
  }

  private async initializeAuth() {
    const data = await DeskThing.getData();
    const settings = await DeskThing.getSettings();
    if (settings) {
      this.client_id = settings[SpotifySettingIDs.CLIENT_ID]?.value as string | undefined;
      this.client_secret = settings[SpotifySettingIDs.CLIENT_SECRET]?.value as string | undefined;
      this.redirect_uri = settings[SpotifySettingIDs.REDIRECT_URI]?.value as string | undefined;
    }
    if (data) {
      this.access_token = data.access_token as string | undefined;
      this.refresh_token = data.refresh_token as string | undefined;
    }
    if (this.client_id && this.client_secret && this.redirect_uri) {
      DeskThing.sendDebug("Auth credentials found");
      await this.refreshAccessToken();
      this.emit('authUpdate', {authStatus: true});
    }
  }

  setClientId(client_id: string) {
    this.client_id = client_id;
    this.checkAuth()
  }

  setClientSecret(client_secret: string) {
    this.client_secret = client_secret;
    this.checkAuth()
  }

  setRedirectUri(redirect_uri: string) {
    this.redirect_uri = redirect_uri;
    this.checkAuth()
  }

  private debounceTimeout: NodeJS.Timeout | null = null;

  private async checkAuth() {
    if (!this.client_id || !this.client_secret || !this.redirect_uri) {
      DeskThing.sendWarning(`Missing credentials: ${!this.client_id ? 'Client ID, ' : ''}${!this.client_secret ? 'Client Secret, ' : ''}${!this.redirect_uri ? 'Redirect URI' : ''}`.replace(/, $/, ''));      return false;
    }

    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    if (!this.access_token && !this.is_logging_in) {
      this.debounceTimeout = setTimeout(async () => {
        await this.login();
        this.debounceTimeout = null;
      }, 2000);
    }
    return true;
  }

  async login() {
    if (this.is_logging_in) {
      DeskThing.sendLog("Already logging in");
      return;
    }

    this.is_logging_in = true;

    try {
      const scope =
        "user-read-currently-playing user-library-read user-read-playback-state user-library-modify user-modify-playback-state playlist-modify-public playlist-modify-private";
      const state = "thisisarandomstringthatshouldbechangedlater";
      const auth_url =
        `https://accounts.spotify.com/authorize?` +
        `response_type=code` +
        `&client_id=${this.client_id}` +
        `&scope=${scope}` +
        `&redirect_uri=${this.redirect_uri}` +
        `&state=${state}`;

      DeskThing.openUrl(auth_url);

      DeskThing.scheduleTask(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        this.is_logging_in = false;
        return true;
      });
    } catch (error) {
      this.is_logging_in = false;
      DeskThing.sendError(`Login failed: ${error}`);
      throw error;
    }
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.client_id || !this.client_secret) {
      DeskThing.sendError("Missing client credentials");
      return;
    }

    if (!this.refresh_token) {
      DeskThing.sendError("Missing refresh token - authenticating");
      await this.login();
      return;
    }

    if (this.is_refreshing) {
      DeskThing.sendLog("Already refreshing token");
      return;
    }

    this.is_refreshing = true;

    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "post",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(`${this.client_id}:${this.client_secret}`).toString(
              "base64"
            ),
        },
        body: new URLSearchParams({
          refresh_token: this.refresh_token,
          grant_type: "refresh_token",
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      this.access_token = data.access_token;
      if (data.refresh_token) {
        this.refresh_token = data.refresh_token;
      }

      DeskThing.saveData({
        access_token: this.access_token,
        refresh_token: this.refresh_token,
      });

      DeskThing.sendLog("Access token refreshed");
      this.emit('authUpdate', {authStatus: true});
    } catch (error) {
      DeskThing.sendError(`Failed to refresh token: ${error}`);
      if (
        error instanceof Error &&
        "response" in error &&
        (error as any).response?.status === 400
      ) {
        await this.login();
      }
      throw error;
    } finally {
      this.is_refreshing = false;
    }
  }

  async getAccessToken(code?: string): Promise<string | undefined> {
    DeskThing.sendDebug('SpotifyStore: getAccessToken called');
    if (!code && this.access_token) {
        return this.access_token
    } else if (!code) {
        DeskThing.sendError("Missing code for token exchange");
        return;
    }

    if (!this.client_id || !this.client_secret || !this.redirect_uri) {
      DeskThing.sendError("Missing client credentials for token exchange");
      return;
    }
  
    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "post",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + Buffer.from(`${this.client_id}:${this.client_secret}`).toString("base64"),
        },
        body: new URLSearchParams({
          code: code,
          redirect_uri: this.redirect_uri,
          grant_type: "authorization_code",
        }),
      });
  
      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status}`);
      }
  
      const data = await response.json();
      this.access_token = data.access_token;
      this.refresh_token = data.refresh_token;
  
      DeskThing.saveData({
        access_token: this.access_token,
        refresh_token: this.refresh_token,
      });
  
      DeskThing.sendLog("Successfully obtained access and refresh tokens");
      this.emit('authUpdate', {authStatus: true});
    } catch (error) {
      DeskThing.sendError(`Failed to exchange code for tokens: ${error}`);
      throw error;
    }
  }

  getClientId(): string | undefined {
    return this.client_id;
  }

  getClientSecret(): string | undefined {
    return this.client_secret;
  }

  getRedirectUri(): string | undefined {
    return this.redirect_uri;
  }
}