import { DeskThing } from "@deskthing/server";
import { SpotifySettingIDs } from "../../shared/spotifyTypes"
import EventEmitter from "node:events";

type authStoreEvents = {
  authUpdate: [{ authStatus: boolean }];
  accessTokenUpdate: [{ accessToken: string }];
};

export class AuthStore extends EventEmitter<authStoreEvents> {
  private access_token?: string;
  private refresh_token?: string;
  private client_id?: string;
  private client_secret?: string;
  private redirect_uri?: string;
  private is_refreshing = false;
  private is_logging_in = false;

  private has_received_info = false

  constructor() {
    super();
    this.initializeAuth();
  }

  private async initializeAuth() {
    const data = await DeskThing.getData();
    const settings = await DeskThing.getSettings();
    if (settings) {
      this.client_id = settings[SpotifySettingIDs.CLIENT_ID]?.value as
        | string
        | undefined;
      this.client_secret = settings[SpotifySettingIDs.CLIENT_SECRET]?.value as
        | string
        | undefined;
      this.redirect_uri = settings[SpotifySettingIDs.REDIRECT_URI]?.value as
        | string
        | undefined;
    }

    if (data && data.access_token && data.refresh_token) {
      console.log("Found auth token in storage");
      this.access_token = data.access_token as string;
      this.refresh_token = data.refresh_token as string;
      this.emit("accessTokenUpdate", { accessToken: this.access_token });
    }
    if (this.client_id && this.client_secret && this.redirect_uri) {
      console.debug("Auth credentials found");
      await this.refreshAccessToken();
      this.emit("authUpdate", { authStatus: true });
    }
  }

  setClientId(client_id: string) {
    this.client_id = client_id;
    this.checkAuth();
    this.has_received_info = true;
  }

  setClientSecret(client_secret: string) {
    this.client_secret = client_secret;
    this.checkAuth();
    this.has_received_info = true;
  }

  setRedirectUri(redirect_uri: string) {
    this.redirect_uri = redirect_uri;
    this.checkAuth();
    this.has_received_info = true;
  }

  private debounceTimeout: NodeJS.Timeout | null = null;

  private async checkAuth() {
    if (!this.client_id || !this.client_secret || !this.redirect_uri) {
      
      // check if the app has received any data yet at all from deskthing 

      if (!this.has_received_info) {
        console.log("AuthStore: Waiting for user to provide auth info");
        return false;
      }


      // else send notif
      const descriptionText = `Missing credentials: ${!this.client_id ? "Client ID, " : ""}${!this.client_secret ? "Client Secret, " : ""}${!this.redirect_uri ? "Redirect URI" : ""}`.replace(
        /, $/,
        ""
      )

      console.warn(
        descriptionText
      );


      DeskThing.sendNotification({
        id: 'missingAuth',
        type: 'error',
        title: 'Missing needed authentication information!',
        description: descriptionText,
        link: 'deskthing://apps/list?app=true&appId=spotify&page=settings' // this will deep link to the spotify settings
      })
      return false;
    }

    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }

    if (this.is_logging_in) {
      console.log("Already logging in (cancelling request)");
      return false;
    }

    if (this.access_token) {
      console.log("Already authenticated");
      return true;
    }

    // Wait 2 seconds before attempting to login
    this.debounceTimeout = setTimeout(async () => {
      await this.login();
      this.debounceTimeout = null;
    }, 2000);

    return true;
  }

  async login() {
    if (this.is_logging_in) {
      console.log("Already logging in (cancelling login request)");
      return;
    }

    this.is_logging_in = true;

    try {
      const scope =
        "user-read-currently-playing user-library-read user-read-playback-state playlist-read-collaborative playlist-read-private user-library-modify user-modify-playback-state playlist-modify-public playlist-modify-private";
      const state = "thisisarandomstringthatshouldbechangedlater";
      const auth_url =
        `https://accounts.spotify.com/authorize?` +
        `response_type=code` +
        `&client_id=${this.client_id}` +
        `&scope=${scope}` +
        `&redirect_uri=${this.redirect_uri}` +
        `&state=${state}`;

      // Prompts the user to open a URL in their browser
      DeskThing.openUrl(auth_url);

      DeskThing.setInterval(async () => {
        // Wait 10 seconds for the user to potentially respond
        await new Promise((resolve) => setTimeout(resolve, 10000));
        this.is_logging_in = false;
        return true;
      });
    } catch (error) {
      this.is_logging_in = false;
      console.error(`Login failed: ${error}`);
      throw error;
    }
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.client_id || !this.client_secret) {
      console.error("Missing client credentials");
      return;
    }

    if (!this.refresh_token) {
      console.error("Missing refresh token - authenticating");
      await this.login();
      return;
    }

    if (this.is_refreshing) {
      console.log("Already refreshing token");
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
      if (data.access_token) {
        this.access_token = data.access_token as string;
        this.emit("accessTokenUpdate", { accessToken: this.access_token });
      }
      if (data.refresh_token) {
        this.refresh_token = data.refresh_token as string;
      }

      DeskThing.saveData({
        access_token: this.access_token,
        refresh_token: this.refresh_token,
      });

      console.log("Access token refreshed");
      this.emit("authUpdate", { authStatus: true });
    } catch (error) {
      console.error(`Failed to refresh token: ${error}`);

      if (
        error instanceof Error &&
        (error.message.includes("invalid_grant") ||
          error.message.includes("invalid_refresh_token"))
      ) {
        // Token is completely invalid, need full re-auth
        this.access_token = undefined;
        this.refresh_token = undefined;

        this.emit("authUpdate", { authStatus: false });
        await this.login();
      }

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

  /**
   * Gets the access token or refreshes using the code of provided
   * @param code
   * @returns
   */
  async getAccessToken(code?: string): Promise<string | undefined> {
    console.debug("SpotifyStore: getAccessToken called");
    if (!code && this.access_token) {
      return this.access_token;
    } else if (!code) {
      console.error("Missing code for token exchange");
      return;
    }

    // This code block will only be entered as a result of the user logging in. All errors should set isLoggingIn to false

    if (!this.client_id || !this.client_secret || !this.redirect_uri) {
      console.error("Missing client credentials for token exchange");
      this.is_logging_in = false;
      return;
    }

    try {

      // Attempt to fetch the api token with the code
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
          code: code,
          redirect_uri: this.redirect_uri,
          grant_type: "authorization_code",
        }),
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status}:${response.statusText}`);
      }

      const data = await response.json();

      if (data.access_token) {
        this.access_token = data.access_token as string;
        this.emit("accessTokenUpdate", { accessToken: this.access_token });
      }

      if (data.refresh_token) {
        this.refresh_token = data.refresh_token as string;
      }

      DeskThing.saveData({
        access_token: this.access_token,
        refresh_token: this.refresh_token,
      });

      console.debug("Successfully obtained access and refresh tokens");
      this.emit("authUpdate", { authStatus: true });
    } catch (error) {
      this.emit('authUpdate', { authStatus: false });
      console.error(`Failed to exchange code for tokens: ${error}`);
      throw error;
    } finally {
      this.is_logging_in = false;
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
