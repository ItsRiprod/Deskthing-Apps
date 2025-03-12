/**
 * I would like to apologize for this ✨
 * It works and has just kept growing to be this monster. I do plan on redoing all of it from scratch once the main server is done.
 */
import { Action, ActionCallback, SongData, AppSettings, ServerEvent, SETTING_TYPES } from '@deskthing/types'
import { DeskThing } from '@deskthing/server'

export interface SpotifySongData extends SongData {
  isLiked: boolean
}

type playlist = {
  title: string
  owner: string
  tracks: number
  id: string
  uri: string
  color: string
  thumbnail_url: string
}

type savedData = {
  client_id?: string
  client_secret?: string
  access_token?: string
  refresh_token?: string
  device_id?: string
  redirect_uri?: string
  refresh_interval?: number
  playlists?: playlist[]
}

type method = 'get' | 'put' | 'post' | 'delete'

type Body = {
  context_uri: string
  offset?: {
    uri: string
  }
  position_ms: number
}

class SpotifyHandler {
  public Data: savedData = {};
  private BASE_URL = "https://api.spotify.com/v1/me/player";
  private is_refreshing = false
  private is_logging_in = false
  private recent_device_id: string | undefined

  constructor() {
    DeskThing.on(ServerEvent.DATA, (data) => {
      this.Data = data.payload;
    });
    DeskThing.on(ServerEvent.ACTION, (action) => {
      this.runAction(action.payload as ActionCallback);
    });
    this.initializeData();
  }

  async initializeData() {
    const data = await DeskThing.getData();
    if (data) {
      this.Data = data;
    }

    if (!this.Data.playlists) {
      // Set up the playlists array with placeholder data
      const playlists: playlist[] = [
        {
          title: "Unset1",
          owner: "Unknown",
          tracks: 0,
          id: "-1",
          uri: "spotify:collection:tracks",
          color: "0000000",
          thumbnail_url: "",
        },
        {
          title: "Unset2",
          owner: "Unknown",
          tracks: 0,
          id: "-1",
          uri: "spotify:collection:tracks",
          color: "0000000",
          thumbnail_url: "",
        },
        {
          title: "Unset3",
          owner: "Unknown",
          tracks: 0,
          id: "-1",
          uri: "spotify:collection:tracks",
          color: "0000000",
          thumbnail_url: "",
        },
        {
          title: "Unset4",
          owner: "Unknown",
          tracks: 0,
          id: "-1",
          uri: "spotify:collection:tracks",
          color: "0000000",
          thumbnail_url: "",
        },
      ];

      // This will not be needed later
      DeskThing.saveData({ playlists: playlists });

      // Set up the action (overwrites the old one if it exists)
      const playlistAction: Action = {
        name: "Set Playlist",
        description: "Sets the current playlist to the provided ID",
        id: "set_playlist",
        value: "0",
        value_instructions:
          "Enter the index of the playlist (1-4) for where to save the current playlist to",
        value_options: ["1", "2", "3", "4"],
        enabled: true,
        version: "0.10.3",
        version_code: 10,
      };
      DeskThing.registerAction(playlistAction);
      // Set up the action (overwrites the old one if it exists)
      const refreshAction: Action = {
        name: "Refresh Song",
        description: "Refreshes the current song",
        id: "refresh_song",
        enabled: true,
        version: "0.10.3",
        version_code: 10,
      };
      DeskThing.registerAction(refreshAction);

      const cycleKeyAction: Action = {
        name: "Cycle Key",
        description: "Cycles the Auth Key",
        id: "cycle_key",
        enabled: true,
        version: "0.10.3",
        version_code: 10,
      };
      DeskThing.registerAction(cycleKeyAction);
  
      const playPlaylistAction: Action = {
        name: "Play Playlist",
        description: "Plays the playlist at the index or the provided uri",
        id: "play_playlist",
        source: "",
        version: "",
        value: "0",
        value_instructions: "Enter either the index of the playlist (1-4) or the spotify uri of the playlist",
        enabled: true,
        version_code: 10,
      };
      DeskThing.registerAction(playPlaylistAction);
    }

    const likeAction: Action = {
      name: "Like Song",
      description: "Likes the current song. Only works for spotify",
      id: "like_song",
      source: "",
      version: "",
      enabled: false,
      version_code: 10,
    };
    DeskThing.registerAction(likeAction);

    const settings: AppSettings = {
      change_source: {
        type: SETTING_TYPES.BOOLEAN,
        value: true,
        label: "Switch Output on Select",
      },
      output_device: {
        value: "default",
        label: "Output Device",
        type: SETTING_TYPES.SELECT,
        options: [
          {
            value: "default",
            label: "Default",
          },
        ],
      },
      transfer_playback_on_error: {
        value: true,
        label: "Transfer Playback on Error",
        type: SETTING_TYPES.BOOLEAN,
      }
    };
    // New way of initializing settings
    DeskThing.initSettings(settings);

    if (!this.Data.client_id || !this.Data.client_secret) {
      const requestScopes = {
        client_id: {
          value: "",
          label: "Spotify Client ID",
          instructions:
            'You can get your Spotify Client ID from the <a href="https://developer.spotify.com/dashboard" target="_blank" style="color: lightblue;">Spotify Developer Dashboard</a>. You must create a new application and then under "Client ID" Copy and paste that into this field.',
        },
        client_secret: {
          value: "",
          label: "Spotify Client Secret",
          instructions:
            'You can get your Spotify Client Secret from the <a href="https://developer.spotify.com/dashboard" target="_blank" style="color: lightblue;">Spotify Developer Dashboard</a>. You must create a new application and then under "View Client Secret", Copy and paste that into this field.',
        },
        redirect_uri: {
          value: "deskthing://a?app=spotify",
          label: "Redirect URL",
          instructions:
            'Set the Spotify Redirect URI to deskthing://a?app=spotify and then click "Save".\n This ensures you can authenticate your account to this application',
        },
      };

      DeskThing.getUserInput(requestScopes, (data) => {
        console.log("Data Response", data);
        if (data.payload.client_id && data.payload.client_secret) {
          DeskThing.saveData(data.payload);
          this.login();
        } else {
          DeskThing.sendError(
            "Please fill out all the fields! Restart Spotify to try again"
          );
        }
      });
    } else {
      DeskThing.sendLog("Data Found!");
      this.refreshAccessToken();
    }
  }
  async runAction(action: ActionCallback) {
    switch (action.id) {
      case "set_playlist":
        if (typeof action.value === "number") {
          this.setPlaylist(action.value)
        } else {
          DeskThing.sendError("Invalid Playlist Index");
        }
        break;
      case "play_playlist":
        if (typeof action.value === "number") {
          this.playPlaylistIndex(action.value);
        } else if (typeof action.value === "string") {
          this.playPlaylist(action.value)
        } else {
          DeskThing.sendError("Invalid Playlist ID");
        }
        break;
      case "like_song":
        this.likeSong();
        break;
      case "cycle_key":
        this.refreshAccessToken();
        break;
      case "refresh_song":
        this.checkForRefresh();
        break;
      default:
        break;
    }
  }

  /**
   *  /-------------------------------------------------------------\
   * |                                                               |
   * |                        Spotify API                            |
   * |                                                               |
   *  \-------------------------------------------------------------/
   */

  /**
   * Refreshes the Spotify access token.
   * @returns {Promise<string>} The new access token.
   */
  async refreshAccessToken(): Promise<string | void> {
    if (!this.Data.client_id || !this.Data.client_secret) {
      DeskThing.sendError(
        "No client_id or client_secret! Cancelling refresh access token request!"
      );
      return;
    }

    if (!this.Data.refresh_token) {
      DeskThing.sendError("Refresh Token is undefined! Authenticating");
      await this.login();
      return;
    }

    if (this.is_refreshing) {
      DeskThing.sendLog("Already refreshing access token! Cancelling...");
      return;
    } else {
      this.is_refreshing = true;
    }
      const authOptions = {
        method: "post",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(
              this.Data.client_id + ":" + this.Data.client_secret
            ).toString("base64"),
        },
        body: new URLSearchParams({
          refresh_token: this.Data.refresh_token,
          grant_type: "refresh_token",
        }),
      };

      try {
        const response = await fetch("https://accounts.spotify.com/api/token", authOptions);
        if (!response.ok) {
          throw { response: { status: response.status } };
        }
        const data = await response.json();
        DeskThing.sendLog("Access token refreshed!");
        const access_token = data.access_token;
        DeskThing.saveData({ access_token: access_token });
        if (data.refresh_token) {
          DeskThing.saveData({ refresh_token: data.refresh_token });
        } else {
          console.log("No access token returned!");
        }
        this.is_refreshing = false;
        return;
      } catch (error) {
        this.is_refreshing = false;
        DeskThing.sendError("Error getting access token!" + error);

        if (error.response && error.response.status === 400) {
          DeskThing.sendLog("Refresh Tokens returned code 400 - Logging in");
          await this.login();
        }
        throw error;
      }
  }
  /**
   * Returns the access token from the Spotify API.
   * @param code Code returned by logging in
   * @returns
   */
  async getAccessToken(code: string): Promise<void | string> {
    if (
      !this.Data.client_id ||
      !this.Data.client_secret ||
      !this.Data.redirect_uri
    ) {
      DeskThing.sendError(
        "No client_id or client_secret! Cancelling access token request!"
      );
      return;
    }

    const authOptions = {
      method: "post",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " + btoa(this.Data.client_id + ":" + this.Data.client_secret),
      },
      body: new URLSearchParams({
        code: code,
        redirect_uri: this.Data.redirect_uri,
        grant_type: "authorization_code",
      }),
    };

    try {
      const response = await fetch("https://accounts.spotify.com/api/token", authOptions);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      DeskThing.sendLog("Access token refreshed!");
      const access_token = data.access_token;
      DeskThing.saveData({ access_token: access_token });
      if (data.refresh_token) {
        DeskThing.saveData({ refresh_token: data.refresh_token });
      } else {
        console.log("No access token returned!");
      }
      return;
    } catch (error) {
      DeskThing.sendError("Error getting access token:" + error);
      throw error;
    }
  }

  /**
   * Logs the user in to Spotify with the data that is saved in the class.
   * @returns {Promise<void>}
   * @throws {Error} If there is no client_id or client_secret
   */
  async login(): Promise<void> {
    
    if (
      !this.Data.client_id ||
      !this.Data.client_secret ||
      !this.Data.redirect_uri
    ) {
      DeskThing.sendError(
        "No client_id or client_secret! Cancelling access token request!"
      );
      throw Error("No Client_ID or Client_Secret!");
    }
    if (this.is_logging_in) {
      DeskThing.sendLog("Already logging in! Cancelling...");
      return;
    } else {
      this.is_logging_in = true;
    }
    DeskThing.sendLog("Logging in...");
    const scope =
      "user-read-currently-playing user-library-read user-read-playback-state user-library-modify user-modify-playback-state playlist-modify-public playlist-modify-private";
    const state = "thisisarandomstringthatshouldbechangedlater";
    const auth_url =
      `https://accounts.spotify.com/authorize?` +
      `response_type=code` +
      `&client_id=${this.Data.client_id}` +
      `&scope=${scope}` +
      `&redirect_uri=${this.Data.redirect_uri}` +
      `&state=${state}`;

    DeskThing.openUrl(auth_url);

    DeskThing.addBackgroundTaskLoop(async () => {
      await new Promise(resolve => setTimeout(resolve, 5000));

      this.is_logging_in = false;

      return true
    });
  }

  /**
   * Handles API errors, refreshing the token if necessary.
   * @param {Error} error - The error object from a fetch request.
   * @returns {Promise<void>}
   */
  async handleError(error): Promise<void> {
    try {
      const status = error.response?.status || error.status;
      if (status) {
        switch (status) {
          case 204:
            DeskThing.sendWarning('[HandleError] Encountered error 204 - Playback is not available or active. Try playing music manually')
            const settings = await DeskThing.getSettings()
            if (this.recent_device_id && settings && settings.transfer_playback_on_error.value == true) {
              this.transferPlayback(this.recent_device_id)
            }
            break;
          case 400:
            DeskThing.sendWarning('[HandleError] Encountered error 400 - Bad Request - The request could not be understood by the server due to malformed syntax. Check logs for more info')
            break;
          case 401:
            DeskThing.sendWarning('[HandleError] Encountered error 401 - Refresh token expired. Trying to refresh token...')
            try {
              await this.refreshAccessToken();
            } catch (refreshError) {
              throw new Error("Error refreshing token:" + refreshError);
            }
          case 403:
            DeskThing.sendWarning('[HandleError] Encountered error 403 - Forbidden - Check logs for more info')
            break;
          case 404:
            DeskThing.sendWarning('[HandleError] Encountered error 404 - Not Found - Check logs for more info')
            break;
          case 429:
            DeskThing.sendWarning('[HandleError] Encountered error 429 - Too Many Requests! API limit hit. - Check logs for more info')
            break;
          case 500:
            DeskThing.sendWarning('[HandleError] Encountered error 500 - Internal Server Error. This should never happen and spotify has don messed up - Check logs for more info')
            break;
          case 502:
            DeskThing.sendWarning('[HandleError] Encountered error 502 - Bad Gateway. Invalid response from upstream server - Check logs for more info')
          case 503:
            DeskThing.sendWarning('[HandleError] Encountered error 503 - Service Unavailable. Spotify is probably down - Check logs for more info')
            break;
          default:
            DeskThing.sendWarning('[HandleError] Encountered error ' + status + ' - Check logs for more info')
          }
        } else {
          DeskThing.sendWarning('[HandleError] Encountered error ' + error.message || 'Unknown error' + ' - Check logs for more info')
        }
    } catch (error) {
      DeskThing.sendError(
        `There was an error in spotify's ErrorHandler ${error}`
      );
    }
  }

  /**
   * Makes an authenticated request to the Spotify API.
   * @param {string} method - The HTTP method (get, put, post).
   * @param {string} url - The request URL.
   * @param {Object} [data=null] - The request data.
   * @returns {Promise<Object|boolean>} The response data.
   */
  async makeRequest(
    method: method,
    url: string,
    data: any = null
  ): Promise<any> {
    if (DeskThing.stopRequested) return; // kill if the app has been asked to stop

    DeskThing.sendLog(`Handling request to url ${url}`);
    try {
      if (!this.Data.client_id || !this.Data.client_secret) {
        DeskThing.sendError(
          "No client_id or client_secret! Cancelling refresh access token request!"
        );
        throw new Error("No client_id or client_secret");
      }
      if (!this.Data.access_token || this.Data.access_token == null) {
        DeskThing.sendLog("Refreshing access token");
        await this.refreshAccessToken();
      }

      const headers = {
        Authorization: `Bearer ${this.Data.access_token}`,
        'Content-Type': 'application/json'
      };

      try {
        const response = await fetch(url, {
          method: method,
          headers: headers,
          body: data ? JSON.stringify(data) : null
        });

        if (!response.ok) {
          await this.handleError(response.status);
          if (response.status === 404) {
            return;
          }
          DeskThing.sendError(`Encountered an error making a request ${response.status}! ${response.statusText}`);
          return
        }

        const responseData = await response.json().catch(() => null);
        return responseData !== null ? responseData : true;

      } catch (error) {
        DeskThing.sendError(`Network error in makeRequest: ${error}`);
        await this.handleError(500);
      }
    } catch (error) {
      DeskThing.sendError(
        `Failed to refresh access token in makeRequest() ${error}`
      );
      await this.handleError(401);
    }
}

  /**
   *  /-------------------------------------------------------------\
   * |                                                               |
   * |                      Mutations/Actions                        |
   * |                                                               |
   *  \-------------------------------------------------------------/
   */

  /**
   * Plays the current playlist at the specified index.
   * @param playlistIndex - The index of the playlist to set.
   * @returns
   */
  async playPlaylist(playlisturi: string) {
    // Construct the URL for playing the playlist
    const playURL = `https://api.spotify.com/v1/me/player/play`;

    // Prepare the request data
    const data = {
      context_uri: playlisturi,
    };

    // Make the request to play the playlist
    try {
      await this.makeRequest("put", playURL, data);
      DeskThing.sendLog(
        "Successfully started playing playlist: " + playlisturi
      );
    } catch (error) {
      DeskThing.sendError("Failed to play playlist: " + error);
    }

    this.refreshPlaylists();
    this.returnSongData();
  }

  async playPlaylistIndex(playlistIndex: number) {
    if (
      this.Data.playlists != undefined &&
      playlistIndex >= 1 &&
      playlistIndex <= this.Data.playlists.length
    ) {
      DeskThing.sendLog("Playing playlist at index " + playlistIndex);

      // Get the playlist at the specified index
      const playlist = this.Data.playlists[playlistIndex - 1];

      if (!playlist || !playlist.uri) {
        DeskThing.sendError(
          "Invalid playlist or missing URI at index " + playlistIndex
        );
        return;
      }

      this.playPlaylist(playlist.uri);
    } else {
      DeskThing.sendError("Invalid playlist index! " + playlistIndex);
      return;
    }
  }

  /**
   * Toggles the current playback's liked status
   * @returns
   */
  async likeSong() {
    const song = await this.getCurrentPlayback();
    if (song.item == undefined) {
      DeskThing.sendError("No song found!");
      return;
    }
    const songID = song.item.id;
    const isLiked = await this.checkLiked(song.id);
    const songURL = `https://api.spotify.com/v1/me/tracks?ids=${songID}`;

    const data = {
      ids: [songID],
    };

    try {
      if (isLiked[0]) {
        DeskThing.sendLog("Disliking the current song");
        await this.makeRequest("delete", songURL, data);
        DeskThing.sendLog("Successfully unliked song: " + song.item.name);
        DeskThing.updateIcon("like_song", "");
        return;
      } else {
        DeskThing.sendLog("Liking the current song");
        await this.makeRequest("put", songURL, data);
        DeskThing.sendLog("Successfully liked song: " + song.item.name);
        DeskThing.updateIcon("like_song", "liked");
      }
    } catch (error) {
      DeskThing.sendError("Failed to like song: " + error);
    }
  }

  /**
 * Sets the current playlist to the specified index.
 * @param playlistIndex - The index of the playlist to set.
 /**
 * Sets the current playlist to the specified index.
 * @param playlistIndex - The index of the playlist to set (1-indexed).
 * @returns 
 */
  async setPlaylist(playlistIndex: number) {
    // Check if the index is valid
    if (
      this.Data.playlists != undefined &&
      playlistIndex >= 1 &&
      playlistIndex <= this.Data.playlists.length
    ) {
      DeskThing.sendLog(
        "Setting the current playlist to index " + playlistIndex
      );

      // Get the current playlist
      const song = await this.getCurrentPlayback();

      if (!song.context || song.context.uri == undefined) {
        DeskThing.sendError("No context uri found!");
        return;
      }

      DeskThing.sendLog("Current playlist is: " + song.context.uri);

      let playlistURL: string;
      let playlistResponse: any;
      if (
        song.context?.type === "collection" &&
        song.context.href === "https://api.spotify.com/v1/me/tracks"
      ) {
        // Handle Liked Songs playlist
        playlistURL = "https://api.spotify.com/v1/me/tracks?limit=1";
        playlistResponse = await this.makeRequest("get", playlistURL);

        const playlist: playlist = {
          title: "Liked Songs",
          owner: "You",
          tracks: playlistResponse.total || 0,
          id: "liked",
          uri: song.context.uri,
          color: "1DB954",
          thumbnail_url: await DeskThing.encodeImageFromUrl(
            "https://t.scdn.co/images/3099b3803ad9496896c43f22fe9be8c4.png"
          ),
        };

        this.Data.playlists[playlistIndex - 1] = playlist;
      } else {
        // Fetch playlist details for other playlists
        playlistURL = `https://api.spotify.com/v1/playlists/${
          song.context.uri.split(":")[2]
        }?market=ES`;
        playlistResponse = await this.makeRequest("get", playlistURL);

        console.log(playlistResponse);

        const playlist: playlist = {
          title: playlistResponse.name || "Unknown",
          owner: playlistResponse.owner.display_name || "Unknown",
          tracks: playlistResponse.tracks.length || 0,
          id: playlistResponse.id || "-1",
          uri: playlistResponse.uri || "spotify:playlist:unknown",
          color: playlistResponse.primary_color || null,
          thumbnail_url:
            (await DeskThing.encodeImageFromUrl(
              playlistResponse.images[0]?.url
            )) || "https://example.com/default-playlist-image.png",
        };

        // Add the playlist to the playlist list
        this.Data.playlists[playlistIndex - 1] = playlist;
      }

      // This will not be needed later
      DeskThing.saveData({ playlists: this.Data.playlists });
      DeskThing.send({
        app: "spotify",
        type: "playlists",
        payload: this.Data.playlists,
      });
    } else {
      DeskThing.sendError("Invalid playlist index! " + playlistIndex);
      return;
    }
  }
  /**
   * Adds the current song to the specified playlist.
   * @param playlistIndex
   * @returns
   */
  async addToPlaylist(playlistIndex: number) {
    // Check if the index is valid
    if (
      this.Data.playlists != undefined &&
      playlistIndex >= 1 &&
      playlistIndex <= this.Data.playlists.length
    ) {
      DeskThing.sendLog(
        "Adding the current song to playlist at index " + playlistIndex
      );

      const playlistId = this.Data.playlists[playlistIndex - 1].id;

      if (playlistId == "-1") {
        DeskThing.sendError("No playlist found!");
        return;
      }
      // Get the current playlist
      const song = await this.getCurrentPlayback();

      if (playlistId == "liked") {
        const songID = song.item.id;
        DeskThing.sendLog("Adding the current song to liked songs");
        const songURL = `https://api.spotify.com/v1/me/tracks?ids=${songID}`;

        const data = {
          ids: [songID],
        };

        try {
          DeskThing.sendLog("Liking the current song");
          await this.makeRequest("put", songURL, data);
          DeskThing.sendLog("Successfully liked song: " + song.item.name);
          DeskThing.updateIcon("like_song", "liked");
        } catch (error) {
          DeskThing.sendError("Failed to like song: " + error);
        }
        return;
      }

      if (!song.context || song.context.uri == undefined) {
        DeskThing.sendError("No context uri found!");
        return;
      }

      // Fetch that playlists details

      const playlistURL = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;

      const data = {
        uris: [song.item.uri],
      };

      await this.makeRequest("post", playlistURL, data);
      this.refreshPlaylists();
    }
  }
  /**
   * Refreshes the playlists.
   * @returns void
   */
  async refreshPlaylists() {
    const playlists = await this.Data.playlists;
    DeskThing.sendLog("Refreshing playlists");
    if (!this.Data.playlists) {
      DeskThing.sendError("No playlists found!");
      return;
    }

    await playlists?.map(async (playlist) => {
      if (playlist.id == "-1") return;

      let playlistURL;
      let playlistResponse;

      if (playlist.id === "liked") {
        playlistURL = "https://api.spotify.com/v1/me/tracks?limit=1";
        playlistResponse = await this.makeRequest("get", playlistURL);

        const newPlaylist: playlist = {
          title: "Liked Songs",
          owner: "You",
          tracks: playlistResponse.total || 0,
          id: "liked",
          uri: playlist.uri,
          color: "1DB954",
          thumbnail_url:
            playlist.thumbnail_url ||
            (await DeskThing.encodeImageFromUrl(
              "https://t.scdn.co/images/3099b3803ad9496896c43f22fe9be8c4.png"
            )),
        };

        if (!this.Data.playlists) {
          DeskThing.sendLog("No playlists found!");
          this.Data.playlists = [];
          this.Data.playlists.push(newPlaylist);
        } else {
          this.Data.playlists[playlists.indexOf(playlist)] = newPlaylist;
        }
      } else {
        playlistURL = `https://api.spotify.com/v1/playlists/${playlist.id}?market=ES`;
        playlistResponse = await this.makeRequest("get", playlistURL);

        const newPlaylist: playlist = {
          title: playlistResponse.name || "Unknown",
          owner: playlistResponse.owner.display_name || "Unknown",
          tracks: playlistResponse.tracks.total || 0,
          id: playlistResponse.id || "-1",
          uri: playlistResponse.uri || "spotify:playlist:unknown",
          color: playlistResponse.primary_color || null,
          thumbnail_url:
            playlist.thumbnail_url ||
            (await DeskThing.encodeImageFromUrl(
              playlistResponse.images[0]?.url
            )) ||
            "https://example.com/default-playlist-image.png",
        };

        if (!this.Data.playlists) {
          DeskThing.sendLog("No playlists found!");
          this.Data.playlists = [];
          this.Data.playlists.push(newPlaylist);
        } else {
          this.Data.playlists[playlists.indexOf(playlist)] = newPlaylist;
        }
      }
    });

    // This will not be needed later 
    DeskThing.saveData({ playlists: this.Data.playlists });
    DeskThing.send({
      app: "spotify",
      type: "playlists",
      payload: this.Data.playlists,
    });
  }

  async getCurrentPlayback() {
    const url = `${this.BASE_URL}?additional_types=episode`;
    return this.makeRequest("get", url);
  }

  async next(id: string = "") {
    const url = `${this.BASE_URL}/next`;
    await this.makeRequest("post", url);
    return await this.returnSongData(id);
  }

  async previous() {
    const url = `${this.BASE_URL}/previous`;
    await this.makeRequest("post", url);
    return await this.returnSongData();
  }

  async fastForward(seconds = 15) {
    try {
      const playback = await this.getCurrentPlayback();
      const currentPosition = playback.progress_ms;
      const newPosition = currentPosition + seconds * 1000;
      await this.seek(newPosition);
    } catch (error) {
      DeskThing.sendError("Error fast forwarding!" + error);
    }
  }

  async rewind(seconds = 15) {
    try {
      const playback = await this.getCurrentPlayback();
      const currentPosition = playback.progress_ms;
      const newPosition = currentPosition - seconds * 1000;
      await this.seek(newPosition);
    } catch (error) {
      DeskThing.sendError("Error fast forwarding!" + error);
    }
  }

  async play(context: { playlist: string; id: string; position: number }) {
    const url = `${this.BASE_URL}/play`;
    let body: Body | null = null;
    if (context && context.playlist && context.id && context.position) {
      body = {
        context_uri: context.playlist,
        offset: { uri: `spotify:track:${context.id}` },
        position_ms: context.position,
      };
    }

    return this.makeRequest("put", url, body);
  }

  async pause() {
    const url = `${this.BASE_URL}/pause`;
    return this.makeRequest("put", url);
  }

  async seek(position: string | number) {
    const url = `${this.BASE_URL}/seek?position_ms=${position}`;
    return this.makeRequest("put", url);
  }

  async like(state: boolean) {
    const trackInfo = await this.getCurrentPlayback();
    if (trackInfo && trackInfo.item.id) {
      const id = trackInfo.item.id;
      const url = `${this.BASE_URL}/me/tracks?ids=${id}`;

      if (state) {
        return this.makeRequest("put", url);
      } else {
        return this.makeRequest("delete", url);
      }
    }
  }

  async volume(newVol: number) {
    const url = `${this.BASE_URL}/volume?volume_percent=${newVol}`;
    return this.makeRequest("put", url);
  }

  async repeat(state: string) {
    if (state == "all") {
      const url = `${this.BASE_URL}/repeat?state=context`;
      return this.makeRequest("put", url);
    }
    const url = `${this.BASE_URL}/repeat?state=${state}`;
    return this.makeRequest("put", url);
  }

  async shuffle(state: string) {
    const url = `${this.BASE_URL}/shuffle?state=${state}`;
    return this.makeRequest("put", url);
  }

  async playlists() {
    DeskThing.send({
      app: "spotify",
      type: "playlists",
      payload: this.Data.playlists,
    });
  }

  async transfer() {
    try {
      const settings = await DeskThing.getSettings();
      if (
        settings?.output_device.value !== "default" &&
        settings?.output_device.value
      ) {
        this.transferPlayback(settings.output_device.value as string);
        DeskThing.sendLog("Transferred successfully");
      }
    } catch (error) {
      DeskThing.sendError("Error changing playback!" + error);
    }
  }

  async transferPlayback(deviceId: string) {
    DeskThing.sendLog(`Transferring playback to ${deviceId}`);
    const url = `${this.BASE_URL}`;
    const body = { device_ids: [deviceId], play: true };
    await this.makeRequest("put", url, body);
  }

  async checkLiked(id: string): Promise<boolean> {
    try {
      if (!id) return false
      const isLiked = await this.makeRequest(
        "get",
        `https://api.spotify.com/v1/me/tracks/contains?ids=${id}`
      );
      DeskThing.updateIcon("like_song", isLiked[0] == true ? "liked" : "");
      return isLiked;
    } catch (Ex) {
      DeskThing.sendError("Error checking if song is liked!" + Ex);
      return false;
    }
  }

  async checkForRefresh() {
    console.log("Checking for refresh...");
    const currentPlayback = await this.getCurrentPlayback();

    if (currentPlayback.currently_playing_type === "track") {
      const isLiked = await this.checkLiked(currentPlayback.item.id);
      const songData = {
        album: currentPlayback?.item.album?.name || "Not Found",
        artist: currentPlayback?.item.album?.artists[0].name || "Not Found",
        playlist: currentPlayback?.context?.type || "Not Found",
        playlist_id: currentPlayback?.context?.uri || "123456",
        track_name: currentPlayback?.item.name,
        shuffle_state: currentPlayback?.shuffle_state,
        repeat_state:
          currentPlayback?.repeat_state == "context"
            ? "all"
            : currentPlayback.repeat_state,
        is_playing: currentPlayback?.is_playing,
        can_fast_forward: !currentPlayback?.disallows?.seeking || true,
        can_skip: !currentPlayback?.disallows?.skipping_next || true,
        can_like: true,
        can_change_volume: currentPlayback?.device.supports_volume || true,
        can_set_output:
          !currentPlayback?.disallows?.transferring_playback || true,
        track_duration: currentPlayback?.item.duration_ms,
        track_progress: currentPlayback?.progress_ms,
        volume: currentPlayback?.device.volume_percent,
        device: currentPlayback?.device.name,
        device_id: currentPlayback?.device.id,
        id: currentPlayback?.item.id,
        isLiked: isLiked[0],
      };

      DeskThing.send({
        app: "client",
        type: "song",
        payload: songData,
      });
    } else if (currentPlayback.currently_playing_type === "episode") {
      const songData = {
        album: currentPlayback?.item.show.name,
        artist: currentPlayback?.item.show.publisher,
        playlist: currentPlayback?.context?.type || "Not Found",
        playlist_id: currentPlayback?.context?.uri || "123456",
        track_name: currentPlayback?.item.name,
        shuffle_state: currentPlayback?.shuffle_state,
        repeat_state:
          currentPlayback?.repeat_state == "context"
            ? "all"
            : currentPlayback.repeat_state,
        is_playing: currentPlayback?.is_playing,
        can_fast_forward: !currentPlayback?.disallows?.seeking || true,
        can_skip: !currentPlayback?.disallows?.skipping_next || true,
        can_like: true,
        can_change_volume: currentPlayback?.device?.supports_volume || true,
        can_set_output:
          !currentPlayback?.disallows?.transferring_playback || true,
        track_duration: currentPlayback?.item.duration_ms,
        track_progress: currentPlayback?.progress_ms,
        volume: currentPlayback?.device.volume_percent,
        device: currentPlayback?.device.name,
        device_id: currentPlayback?.device.id,
        id: currentPlayback?.item.id,
        isLiked: false,
      };

      DeskThing.send({
        app: "client",
        type: "song",
        payload: songData,
      });
    } else {
      DeskThing.sendLog("Unable to refresh... song not playing!");
    }
  }

  async returnSongData(id: string | null = null) {
    try {
      const startTime = Date.now();
      const timeout = 5000;
      let delay = 500;
      let currentPlayback;
      let new_id: string | null = ""

      // Pulls the current song until it either changes, the type is an episode, or the timeout is reached (1s)
      do {
        console.log("Getting song data...", delay);
        currentPlayback = await this.getCurrentPlayback();
        if (DeskThing.stopRequested) {
          DeskThing.sendLog("Stop requested!");
          throw new Error("Stop requested!");
        }
        if (currentPlayback.currently_playing_type === "track") {
          new_id = currentPlayback.item.id;
          if (delay !== 500) {
            DeskThing.sendLog(`Song has not changed. Trying again...`);
          }

          delay *= 1.3;
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else if (currentPlayback.currently_playing_type === "episode") {
          currentPlayback = await this.getCurrentPlayback();
          DeskThing.sendLog("Playing a podcast!");
        } else {
          DeskThing.sendError("No song is playing or detected!");
          new_id = null;
          delay = 9999;
        }
      } while (
        new_id === id &&
        Date.now() - startTime < timeout &&
        delay < 1000
      );

      if (new_id === id) {
        throw new Error("Timeout Reached!");
      }

      let songData: Partial<SpotifySongData>;

      
      if (currentPlayback.currently_playing_type === "track") {
        const isLiked = await this.checkLiked(currentPlayback.item.id);
        
        songData = {
          album: currentPlayback?.item.album?.name || "Not Found",
          artist: currentPlayback?.item.album?.artists[0].name || "Not Found",
          playlist: currentPlayback?.context?.type || "Not Found",
          playlist_id: currentPlayback?.context?.uri || "123456",
          track_name: currentPlayback?.item.name,
          shuffle_state: currentPlayback?.shuffle_state,
          repeat_state:
            currentPlayback?.repeat_state == "context"
              ? "all"
              : currentPlayback.repeat_state,
          is_playing: currentPlayback?.is_playing,
          can_fast_forward: !currentPlayback?.disallows?.seeking || true,
          can_skip: !currentPlayback?.disallows?.skipping_next || true,
          can_like: true,
          can_change_volume: currentPlayback?.device.supports_volume || true,
          can_set_output:
            !currentPlayback?.disallows?.transferring_playback || true,
          track_duration: currentPlayback?.item.duration_ms,
          track_progress: currentPlayback?.progress_ms,
          volume: currentPlayback?.device.volume_percent,
          device: currentPlayback?.device.name,
          device_id: currentPlayback?.device.id,
          id: currentPlayback?.item.id,
          isLiked: isLiked[0],
        };

        
        if (currentPlayback.device.id) {
          this.recent_device_id = currentPlayback.device.id
        }

        addDevice(currentPlayback.device.id, currentPlayback.device.name);

        DeskThing.send({
          app: "client",
          type: "song",
          payload: songData,
        });
        const imageUrl = currentPlayback.item.album.images[0].url;
        const encodedImage = await DeskThing.encodeImageFromUrl(
          imageUrl,
          "jpeg"
        );

        // Only update the thumbnail
        DeskThing.send({
          app: "client",
          type: "song",
          payload: { thumbnail: encodedImage },
        });
      } else if (currentPlayback.currently_playing_type === "episode") {
        songData = {
          album: currentPlayback?.item.show.name,
          artist: currentPlayback?.item.show.publisher,
          playlist: currentPlayback?.context?.type || "Not Found",
          playlist_id: currentPlayback?.context?.uri || "123456",
          track_name: currentPlayback?.item.name,
          shuffle_state: currentPlayback?.shuffle_state,
          repeat_state:
            currentPlayback?.repeat_state == "context"
              ? "all"
              : currentPlayback.repeat_state,
          is_playing: currentPlayback?.is_playing,
          can_fast_forward: !currentPlayback?.disallows?.seeking || true,
          can_skip: !currentPlayback?.disallows?.skipping_next || true,
          can_like: true,
          can_change_volume: currentPlayback?.device?.supports_volume || true,
          can_set_output:
            !currentPlayback?.disallows?.transferring_playback || true,
          track_duration: currentPlayback?.item.duration_ms,
          track_progress: currentPlayback?.progress_ms,
          volume: currentPlayback?.device.volume_percent,
          device: currentPlayback?.device.name,
          device_id: currentPlayback?.device.id,
          id: currentPlayback?.item.id,
          isLiked: false,
        };
        if (currentPlayback.device.id) {
          this.recent_device_id = currentPlayback.device.id
        }

        addDevice(currentPlayback.device.id, currentPlayback.device.name);
  
        DeskThing.send({
          app: "client",
          type: "song",
          payload: songData,
        });
        const imageUrl = currentPlayback.item.images[0].url;
        const encodedImage = await DeskThing.encodeImageFromUrl(
          imageUrl,
          "jpeg"
        );
  
        // Only update the thumbnail
        DeskThing.send({
          app: "client",
          type: "song",
          payload: { thumbnail: encodedImage },
        });
      } else {
        DeskThing.sendError("Song/Podcast type not supported!");
      }
    } catch (error) {
      DeskThing.sendError("Error getting song data:" + error);
      return error;
    }
  }
}

// Adds the device to settings
const addDevice = async (id: string, name: string) => {
  const settings = await DeskThing.getSettings()

  const deviceExists =
    settings &&
    settings.output_device.type == SETTING_TYPES.SELECT &&
    settings.output_device.options.some(
      (option) => option.value === id
    );

  if (!deviceExists) {
    // Update options with the new device
    DeskThing.sendLog(
      `Adding new device ${name} to device list...`
    );
    if (settings && settings.output_device.type == SETTING_TYPES.SELECT) {
        settings.output_device.options.push({
          value: id,
          label: name,
        });
        DeskThing.saveSettings(settings);
      }

  }
}

export default SpotifyHandler
