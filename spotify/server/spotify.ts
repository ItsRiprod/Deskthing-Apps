import axios, { AxiosError, isAxiosError } from 'axios'
import { Action, ActionCallback, SongData, DeskThing as DK, AppSettings } from 'deskthing-server'

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
  settings?: AppSettings
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
  public Data: savedData = {}
  private DeskThing: DK
  private BASE_URL = 'https://api.spotify.com/v1/me/player'

  constructor() {
    this.DeskThing = DK.getInstance()
    this.DeskThing.on('data', (data) => {
      this.Data = data
    })
    this.DeskThing.on('action', (action) => {
      this.runAction(action.payload as ActionCallback)
    })
    this.initializeData()
  }

  async initializeData() {
    const data = await this.DeskThing.getData()
    if (data) {
      this.Data = data 
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
          thumbnail_url: ""
        },
        {
          title: "Unset2",
          owner: "Unknown",
          tracks: 0,
          id: "-1",
          uri: "spotify:collection:tracks",
          color: "0000000",
          thumbnail_url: ""
        },
        {
          title: "Unset3",
          owner: "Unknown",
          tracks: 0,
          id: "-1",
          uri: "spotify:collection:tracks",
          color: "0000000",
          thumbnail_url: ""
        },
        {
          title: "Unset4",
          owner: "Unknown",
          tracks: 0,
          id: "-1",
          uri: "spotify:collection:tracks",
          color: "0000000",
          thumbnail_url: ""
        }
      ]
      this.DeskThing.saveData({playlists: playlists})

      // Set up the action (overwrites the old one if it exists)
      const playlistAction: Action = {
        name: 'Set Playlist',
        description: 'Sets the current playlist to the provided ID',
        id: 'set_playlist',
        source: '',
        version: '',
        enabled: false
      }
      this.DeskThing.registerActionObject(playlistAction)
      const playPlaylistAction: Action = {
        name: 'Play Playlist',
        description: 'Sets the current playlist to the provided ID',
        id: 'play_playlist',
        source: '',
        version: '',
        enabled: false
      }
      this.DeskThing.registerActionObject(playPlaylistAction)
    }
    
    const likeAction: Action = {
      name: 'Like Song',
      description: 'Likes the current song. Only works for spotify',
      id: 'like_song',
      source: '',
      version: '',
      enabled: false
    }
    this.DeskThing.registerActionObject(likeAction)

    if (!this.Data.settings?.change_source) {
      const settings: AppSettings = {
        change_source: {
          type: "boolean",
          value: true,
          label: "Switch Output on Select",
        },
        output_device: {
          value: "default",
          label: "Output Device",
          type: "select",
          options: [
            {
              value: "default",
              label: "Default"
            }
          ]
        },
      }
      this.DeskThing.addSettings(settings)
    }

    if (!this.Data.client_id || !this.Data.client_secret) {
      const requestScopes = {
        'client_id': {
          'value': '',
          'label': 'Spotify Client ID',
          'instructions': 'You can get your Spotify Client ID from the <a href="https://developer.spotify.com/dashboard" target="_blank" style="color: lightblue;">Spotify Developer Dashboard</a>. You must create a new application and then under "Client ID" Copy and paste that into this field.',
        },
        'client_secret': {
          'value': '',
          'label': 'Spotify Client Secret',
          'instructions': 'You can get your Spotify Client Secret from the <a href="https://developer.spotify.com/dashboard" target="_blank" style="color: lightblue;">Spotify Developer Dashboard</a>. You must create a new application and then under "View Client Secret", Copy and paste that into this field.',
        },
        'redirect_uri': {
          'value': 'http://localhost:8888/callback/spotify',
          'label': 'Redirect URL',
          'instructions': 'Set the Spotify Redirect URI to http://localhost:8888/callback/spotify and then click "Save".\n This ensures you can authenticate your account to this application',
        }
      }
  
      this.DeskThing.getUserInput(requestScopes, (data) => {
        console.log('Data Response', data)
        if (data.payload.client_id && data.payload.client_secret) {
          this.DeskThing.saveData(data.payload)
          this.login()
        } else {
          this.DeskThing.sendError('Please fill out all the fields! Restart Spotify to try again')
        }
      })  
    } else {
      this.DeskThing.sendLog('Data Found!')
      this.refreshAccessToken()
    }
  }
  async runAction(action: ActionCallback) {
    switch (action.id) {
      case 'set_playlist':
        this.setPlaylist(action.value as number)
        break
      case 'play_playlist':
        this.playPlaylist(action.value as number)
        break
      case 'like_song':
        this.likeSong()
        break
      default:
        break
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
      this.DeskThing.sendError('No client_id or client_secret! Cancelling refresh access token request!')
      return
    }

    if (!this.Data.refresh_token) {
      this.DeskThing.sendError("Refresh Token is undefined! Authenticating")
      await this.login()
      return
    }

    const authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' + Buffer.from(this.Data.client_id + ':' + this.Data.client_secret).toString('base64')
      },
      data: new URLSearchParams({
        refresh_token: this.Data.refresh_token,
        grant_type: 'refresh_token'
      })
    }

    try {
      const response = await axios(authOptions)
      this.DeskThing.sendLog('Access token refreshed!')
      const access_token = response.data.access_token
      this.DeskThing.saveData({access_token: access_token})
      if (response.data.refresh_token) {
        this.DeskThing.saveData({refresh_token: response.data.refresh_token})
      } else {
        console.log('No access token returned!')
      }
      return
    } catch (error) {
      this.DeskThing.sendError('Error getting access token!' + error)
      if (!isAxiosError(error)) return
      
      if (error.response && error.response.status === 400) {
        this.DeskThing.sendLog('Refresh Tokens returned code 400 - Logging in')
        await this.login()
      }
      throw error
    }
  }
  /**
   * Returns the access token from the Spotify API.
   * @param code Code returned by logging in
   * @returns 
   */
  async getAccessToken(code: string): Promise<void | string> {
    if (!this.Data.client_id || !this.Data.client_secret || !this.Data.redirect_uri) {
      this.DeskThing.sendError('No client_id or client_secret! Cancelling access token request!')
      return
    }

    const authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' + btoa(this.Data.client_id + ':' + this.Data.client_secret)
      },
      data: new URLSearchParams({
        code: code,
        redirect_uri: this.Data.redirect_uri,
        grant_type: 'authorization_code'
      }).toString()
    }

    try {
      const response = await axios(authOptions)
      this.DeskThing.sendLog('Access token refreshed!')
      const access_token = response.data.access_token
      this.DeskThing.saveData({access_token: access_token})
      if (response.data.refresh_token) {
        this.DeskThing.saveData({refresh_token: response.data.refresh_token})
      } else {
        console.log('No access token returned!')
      }
      return
    } catch (error) {
      this.DeskThing.sendError('Error getting access token:' + error)
      throw error
    }
  }

  /**
   * Logs the user in to Spotify with the data that is saved in the class.
   * @returns {Promise<void>}
   * @throws {Error} If there is no client_id or client_secret
   */
  async login(): Promise<void> {

    console.log('Current Data: ', this.Data)
    if (!this.Data.client_id || !this.Data.client_secret || !this.Data.redirect_uri) {
      this.DeskThing.sendError('No client_id or client_secret! Cancelling access token request!')
      throw Error('No Client_ID or Client_Secret!')
    }
    this.DeskThing.sendLog('Logging in...')
    const scope = 'user-read-currently-playing user-library-read user-read-playback-state user-library-modify user-modify-playback-state playlist-modify-public playlist-modify-private'
    const state = 'thisisarandomstringthatshouldbechangedlater'
    const auth_url =
      `https://accounts.spotify.com/authorize?` +
      `response_type=code` +
      `&client_id=${this.Data.client_id}` +
      `&scope=${scope}` +
      `&redirect_uri=${this.Data.redirect_uri}` +
      `&state=${state}`

    await this.DeskThing.openUrl(auth_url)
  }

  /**
   * Handles API errors, refreshing the token if necessary.
   * @param {Error} error - The error object.
   * @returns {Promise<void>}
   */
  async handleError(error: AxiosError): Promise<void> {
    try {
      if (error.response) {
        if (error.response.status === 401) {
          try {
            await this.refreshAccessToken()
          } catch (refreshError) {
            throw new Error('Error refreshing token:' + refreshError)
          }
        } else if (error.response.status === 404) {
          throw new Error(
            '(Ignore if this is a result of skipping/pausing) Error 404: Resource not found in handleError'
          )
        } else {
          throw new Error(`Request failed with status ${error.response.status}`)
        }
      } else {
        throw new Error('Unknown error in handleError' + error)
      }
    } catch (error) {
      this.DeskThing.sendError(`There was an error in spotify's ErrorHandler ${error}`)
    } 
  }
  
  /**
   * Makes an authenticated request to the Spotify API.
   * @param {string} method - The HTTP method (get, put, post).
   * @param {string} url - The request URL.
   * @param {Object} [data=null] - The request data.
   * @returns {Promise<Object|boolean>} The response data.
   */
  async makeRequest(method: method, url: string, data: any = null, attempt: number = 0): Promise<any> {
    if (this.DeskThing.stopRequested) return // kill if the app has been asked to stop

    this.DeskThing.sendLog(`Handling request to url ${url}`)
    try {
      if (!this.Data.client_id || !this.Data.client_secret) {
        this.DeskThing.sendError('No client_id or client_secret! Cancelling refresh access token request!')
        throw new Error('No client_id or client_secret')
      }
      if (!this.Data.access_token || this.Data.access_token == null) {
        this.DeskThing.sendLog('Refreshing access token');
        await this.refreshAccessToken();
        // After refreshing the token, ensure to proceed with the request
      }
  
      const headers = {
        Authorization: `Bearer ${this.Data.access_token}`
      };
  
      try {
        const response = await axios({ method, url, data, headers });
        return response.data !== undefined ? response.data : true;
      } catch (error) {
        if (!error) return

        if (!isAxiosError(error)) return

        await this.handleError(error);
        if (error.response && error.response.status === 404) {
          return;
        }
        if (error.response && error.response.status === 403) {
          this.DeskThing.sendError('Error 403 reached! Bad OAuth (Cancelling Request)');
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait five seconds
        if (attempt < 4) {
          this.DeskThing.sendLog('Retrying! Attempt #' + attempt + ' ' + method + url + data);
          const retryResponse = await this.makeRequest(method, url, data, attempt + 1);
          return retryResponse !== undefined ? retryResponse : true;
        } else {
          this.DeskThing.sendLog('Failed to make request after 8 attempts. Cancelling request.');
        }
      }
    } catch (error) {
      this.DeskThing.sendError(`Failed to refresh access token in makeRequest() ${error}`);
      if (!isAxiosError(error)) return
      await this.handleError(error);
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
  async playPlaylist(playlistIndex: number) {
    // Check if the index is valid
    if (this.Data.playlists != undefined && playlistIndex >= 1 && playlistIndex <= this.Data.playlists.length) {
      this.DeskThing.sendLog('Playing playlist at index ' + playlistIndex)
      
      
        // Get the playlist at the specified index
        const playlist = this.Data.playlists[playlistIndex - 1];

        if (!playlist || !playlist.uri) {
          this.DeskThing.sendError('Invalid playlist or missing URI at index ' + playlistIndex);
          return;
        }

        // Construct the URL for playing the playlist
        const playURL = `https://api.spotify.com/v1/me/player/play`;

        // Prepare the request data
        const data = {
          context_uri: playlist.uri
        };

        // Make the request to play the playlist
        try {
          await this.makeRequest('put', playURL, data);
          this.DeskThing.sendLog('Successfully started playing playlist: ' + playlist.title);
        } catch (error) {
          this.DeskThing.sendError('Failed to play playlist: ' + error);
        }

        this.refreshPlaylists()
        this.returnSongData()
      
    } else {
      this.DeskThing.sendError('Invalid playlist index! ' + playlistIndex)
      return
    }
  }

  /**
   * Toggles the current playback's liked status
   * @returns 
   */
  async likeSong() {
    const song = await this.getCurrentPlayback()
    if (song.item == undefined) {
      this.DeskThing.sendError('No song found!')
      return
    }
    const songID = song.item.id
    
    const isLiked = await this.checkForRefresh()
    const songURL = `https://api.spotify.com/v1/me/tracks?ids=${songID}`
    
    const data = {
      ids: [songID]
    }
    
    try {
      if (isLiked[0]) {
        this.DeskThing.sendLog('Disliking the current song')
        await this.makeRequest('delete', songURL, data)
        this.DeskThing.sendLog('Successfully unliked song: ' + song.item.name)
        this.DeskThing.updateIcon('like_song', '')     
        return
      } else {
        this.DeskThing.sendLog('Liking the current song')
        await this.makeRequest('put', songURL, data)
        this.DeskThing.sendLog('Successfully liked song: ' + song.item.name)
        this.DeskThing.updateIcon('like_song', 'liked')
      }
    } catch (error) {
      this.DeskThing.sendError('Failed to like song: ' + error)
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
  if (this.Data.playlists != undefined && playlistIndex >= 1 && playlistIndex <= this.Data.playlists.length) {
    this.DeskThing.sendLog('Setting the current playlist to index ' + playlistIndex)
    
    // Get the current playlist
    const song = await this.getCurrentPlayback()
    
    if (!song.context || song.context.uri == undefined) {
      this.DeskThing.sendError('No context uri found!')
      return
    }
    
    this.DeskThing.sendLog('Current playlist is: ' + song.context.uri)
    
    let playlistURL: string
    let playlistResponse: any
    if (song.context?.type === 'collection' && song.context.href === 'https://api.spotify.com/v1/me/tracks') {
      // Handle Liked Songs playlist
      playlistURL = 'https://api.spotify.com/v1/me/tracks?limit=1'
      playlistResponse = await this.makeRequest('get', playlistURL)
      
      const playlist: playlist = {
        title: 'Liked Songs',
        owner: 'You',
        tracks: playlistResponse.total || 0,
        id: 'liked',
        uri: song.context.uri,
        color: '1DB954',
        thumbnail_url: await this.DeskThing.encodeImageFromUrl('https://t.scdn.co/images/3099b3803ad9496896c43f22fe9be8c4.png'),
      }
      
      this.Data.playlists[playlistIndex -1] = playlist
    } else {
      // Fetch playlist details for other playlists
      playlistURL = `https://api.spotify.com/v1/playlists/${song.context.uri.split(':')[2]}?market=ES`
      playlistResponse = await this.makeRequest('get', playlistURL)
      
      console.log(playlistResponse)

      const playlist: playlist = {
        title: playlistResponse.name || 'Unknown',
        owner: playlistResponse.owner.display_name || 'Unknown',
        tracks: playlistResponse.tracks.length || 0,
        id: playlistResponse.id || '-1',
        uri: playlistResponse.uri || 'spotify:playlist:unknown',
        color: playlistResponse.primary_color || null,
        thumbnail_url: await this.DeskThing.encodeImageFromUrl(playlistResponse.images[0]?.url) || 'https://example.com/default-playlist-image.png',
      }

      // Add the playlist to the playlist list
      this.Data.playlists[playlistIndex - 1] = playlist
    }
    
    this.DeskThing.saveData({playlists: this.Data.playlists})
    this.DeskThing.sendDataToClient({ app: 'spotify', type: 'playlists', payload: this.Data.playlists })
  } else {
    this.DeskThing.sendError('Invalid playlist index! ' + playlistIndex)
    return
  }
}
/**
 * Adds the current song to the specified playlist.
 * @param playlistIndex 
 * @returns 
 */
  async addToPlaylist(playlistIndex: number) {
    // Check if the index is valid
    if (this.Data.playlists != undefined && playlistIndex >= 1 && playlistIndex <= this.Data.playlists.length) {
      this.DeskThing.sendLog('Adding the current song to playlist at index ' + playlistIndex)

      const playlistId = this.Data.playlists[playlistIndex - 1].id

      if (playlistId == "-1") {
        this.DeskThing.sendError('No playlist found!')
        return
      }
      // Get the current playlist
      const song = await this.getCurrentPlayback()


      if (playlistId == "liked") {
        const songID = song.item.id
        this.DeskThing.sendLog('Adding the current song to liked songs')
        const songURL = `https://api.spotify.com/v1/me/tracks?ids=${songID}`
    
        const data = {
          ids: [songID]
        }
    
        try {
            this.DeskThing.sendLog('Liking the current song')
            await this.makeRequest('put', songURL, data)
            this.DeskThing.sendLog('Successfully liked song: ' + song.item.name)
            this.DeskThing.updateIcon('like_song', 'liked')
        } catch (error) {
          this.DeskThing.sendError('Failed to like song: ' + error)
        }
        return
      }


      if (!song.context || song.context.uri == undefined) {
        this.DeskThing.sendError('No context uri found!')
        return
      }

      // Fetch that playlists details


      const playlistURL= `https://api.spotify.com/v1/playlists/${playlistId}/tracks`
      
      const data = {
        uris: [song.item.uri]
      }

      await this.makeRequest('post', playlistURL, data)
      this.refreshPlaylists()
    }
  }
  /**
   * Refreshes the playlists.
   * @returns void
   */
    async refreshPlaylists() {
      const playlists = await this.Data.playlists
      this.DeskThing.sendLog('Refreshing playlists')
      if (!this.Data.playlists) {
        this.DeskThing.sendError("No playlists found!");
        return;
      }

      await playlists?.map(async (playlist) => {
        if (playlist.id == "-1") return

        let playlistURL;
        let playlistResponse;

        if (playlist.id === 'liked') {
          playlistURL = 'https://api.spotify.com/v1/me/tracks?limit=1';
          playlistResponse = await this.makeRequest("get", playlistURL);
        
          const newPlaylist: playlist = {
            title: 'Liked Songs',
            owner: 'You',
            tracks: playlistResponse.total || 0,
            id: 'liked',
            uri: playlist.uri,
            color: '1DB954',
            thumbnail_url: playlist.thumbnail_url || await this.DeskThing.encodeImageFromUrl('https://t.scdn.co/images/3099b3803ad9496896c43f22fe9be8c4.png'),
          }

          if (!this.Data.playlists) {
            this.DeskThing.sendLog("No playlists found!");
            this.Data.playlists = [];
            this.Data.playlists.push(newPlaylist);
          } else {
            this.Data.playlists[playlists.indexOf(playlist)] = newPlaylist;
          }
        } else {
          playlistURL = `https://api.spotify.com/v1/playlists/${playlist.id}?market=ES`;
          playlistResponse = await this.makeRequest("get", playlistURL);
        
          const newPlaylist: playlist = {
            title: playlistResponse.name || 'Unknown',
            owner: playlistResponse.owner.display_name || 'Unknown',
            tracks: playlistResponse.tracks.total || 0,
            id: playlistResponse.id || '-1',
            uri: playlistResponse.uri || 'spotify:playlist:unknown',
            color: playlistResponse.primary_color || null,
            thumbnail_url: playlist.thumbnail_url || await this.DeskThing.encodeImageFromUrl(playlistResponse.images[0]?.url) || 'https://example.com/default-playlist-image.png',
          }

          if (!this.Data.playlists) {
            this.DeskThing.sendLog("No playlists found!");
            this.Data.playlists = [];
            this.Data.playlists.push(newPlaylist);
          } else {
            this.Data.playlists[playlists.indexOf(playlist)] = newPlaylist;
          }
        }
      });

      this.DeskThing.saveData({ playlists: this.Data.playlists });
      this.DeskThing.sendDataToClient({ app: "spotify", type: "playlists", payload: this.Data.playlists });
    }

  async getCurrentPlayback() {
    const url = `${this.BASE_URL}`
    return this.makeRequest('get', url)
  }

  async getCurrentEpisode() {
    const url = `${this.BASE_URL}?additional_types=episode`
    return this.makeRequest('get', url)
  }

  async next(id: string = '') {
    const url = `${this.BASE_URL}/next`
    await this.makeRequest('post', url)
    return await this.returnSongData(id) 
  }

  async previous() {
    const url = `${this.BASE_URL}/previous`
    await this.makeRequest('post', url)
    return await this.returnSongData() 
  }

  async fastForward(seconds = 15) {
    try {
      const playback = await this.getCurrentPlayback();
      const currentPosition = playback.progress_ms;
      const newPosition = currentPosition + seconds * 1000;
      await this.seek(newPosition);
    } catch (error) {
      this.DeskThing.sendError('Error fast forwarding!' + error);
    }
  }

  async rewind(seconds = 15) {
    try {
      const playback = await this.getCurrentPlayback();
      const currentPosition = playback.progress_ms;
      const newPosition = currentPosition - seconds * 1000;
      await this.seek(newPosition);
    } catch (error) {
      this.DeskThing.sendError('Error fast forwarding!' + error);
    }
  }

  async play(context: {playlist: string, id: string, position: number}) {
    const url = `${this.BASE_URL}/play`;
    let body: Body | null = null;
  
    if (context.playlist && context.id && context.position) {
      body = {
        context_uri: context.playlist,
        offset: { uri: `spotify:track:${context.id}` },
        position_ms: context.position,
      };
    }
  
    return this.makeRequest('put', url, body);
  }

  async pause() {
    const url = `${this.BASE_URL}/pause`
    return this.makeRequest('put', url)
  }

  async seek(position: string | number) {
    const url = `${this.BASE_URL}/seek?position_ms=${position}`
    return this.makeRequest('put', url)
  }

  async like(state: boolean) {
    const trackInfo = await this.getCurrentPlayback()
    if (trackInfo && trackInfo.item.id) {
      const id = trackInfo.item.id
      const url = `${this.BASE_URL}/me/tracks?ids=${id}`
      
      if (state) {
        return this.makeRequest('put', url)
      } else {
        return this.makeRequest('delete', url)
      }
    }
  }

  async volume(newVol: number) {
    const url = `${this.BASE_URL}/volume?volume_percent=${newVol}`
    return this.makeRequest('put', url)
  }

  async repeat(state: string) {
    if (state == 'all') {
      const url = `${this.BASE_URL}/repeat?state=context`
      return this.makeRequest('put', url)
    }
    const url = `${this.BASE_URL}/repeat?state=${state}`
    return this.makeRequest('put', url)
  }

  async shuffle(state: string) {
    const url = `${this.BASE_URL}/shuffle?state=${state}`
    return this.makeRequest('put', url)
  }

  async analysis() {
    const data = await this.getCurrentPlayback()
    if (!data) return
    const url = `https://api.spotify.com/v1/audio-analysis/${data.item.id}`
    this.DeskThing.sendLog('Getting analysis data')
    const analysisData = await this.makeRequest('get', url)
    this.DeskThing.sendLog('Sending analysis data')
    this.DeskThing.sendDataToClient({ app: 'spotify', type: 'analysis', payload: analysisData })
  }

  async features() {
    const data = await this.getCurrentPlayback()
    if (!data) return
    const url = `https://api.spotify.com/v1/audio-features/${data.item.id}`
    this.DeskThing.sendLog('Getting Features data')
    const analysisData = await this.makeRequest('get', url)
    this.DeskThing.sendLog('Sending Features  data')
    this.DeskThing.sendDataToClient({ app: 'spotify', type: 'features', payload: analysisData })
  }

  async playlists() {
    this.DeskThing.sendDataToClient({ app: 'spotify', type: 'playlists', payload: this.Data.playlists })
  }

  async transfer() {
    try {
      if (this.Data.settings?.output_device.value !== 'default' && this.Data.settings?.output_device.value) {
        this.transferPlayback(this.Data.settings.output_device.value as string);
        this.DeskThing.sendLog('Transferred successfully')
      }
    } catch (error) {
      this.DeskThing.sendError('Error changing playback!' + error)
    }
  }
  
  async transferPlayback(deviceId: string) {
    this.DeskThing.sendLog(`Transferring playback to ${deviceId}`)
    const url = `${this.BASE_URL}`;
    const body = { device_ids: [deviceId], play: true };
    await this.makeRequest('put', url, body);
  }

  async checkLiked(id: string): Promise<boolean> {
    try {
      const isLiked = await this.makeRequest('get', `https://api.spotify.com/v1/me/tracks/contains?ids=${id}`)
      this.DeskThing.updateIcon('like_song', isLiked[0] == true ? 'liked' : '')
      return isLiked
    } catch (Ex) {
      this.DeskThing.sendError('Error checking if song is liked!' + Ex)
      return false
    }
  }

  async checkForRefresh() {
    console.log('Checking for refresh...')
    const currentPlayback = await this.getCurrentPlayback()

    if (currentPlayback.currently_playing_type === 'track') {

      const isLiked = await this.checkLiked(currentPlayback.item.id)
      const songData = {
        album: currentPlayback?.item.album?.name || 'Not Found',
        artist: currentPlayback?.item.album?.artists[0].name || 'Not Found',
        playlist: currentPlayback?.context?.type || 'Not Found',
        playlist_id: currentPlayback?.context?.uri || '123456',
        track_name: currentPlayback?.item.name,
        shuffle_state: currentPlayback?.shuffle_state,
        repeat_state: currentPlayback?.repeat_state == 'context' ? 'all' : currentPlayback.repeat_state,
        is_playing: currentPlayback?.is_playing,
        can_fast_forward: !currentPlayback?.disallows?.seeking || true,
        can_skip: !currentPlayback?.disallows?.skipping_next || true,
        can_like: true,
        can_change_volume: currentPlayback?.device.supports_volume || true,
        can_set_output: !currentPlayback?.disallows?.transferring_playback || true,
        track_duration: currentPlayback?.item.duration_ms,
        track_progress: currentPlayback?.progress_ms,
        volume: currentPlayback?.device.volume_percent,
        device: currentPlayback?.device.name,
        device_id: currentPlayback?.device.id,
        id: currentPlayback?.item.id,
        isLiked: isLiked[0]
      }

      this.DeskThing.sendDataToClient({ app: 'client', type: 'song', payload: songData })
    } else {
      this.DeskThing.sendLog('Unable to refresh... song not playing!')
    }
    
  }

  async returnSongData(id: string | null = null) {
    try {
      const startTime = Date.now()
      const timeout = 5000
      let delay = 500
      let currentPlayback
      let new_id

      do {
        console.log('Getting song data...', delay)
        currentPlayback = await this.getCurrentPlayback()
        if (this.DeskThing.stopRequested) {
          this.DeskThing.sendLog('Stop requested!')
          throw new Error('Stop requested!')
        }
        if (currentPlayback.currently_playing_type === 'track') {
          new_id = currentPlayback.item.id
          if (delay !== 500) {
            this.DeskThing.sendLog(`Song has not changed. Trying again...`)
          }
            
          delay *= 1.3 // how long to increase the delay between attempts
          await new Promise((resolve) => setTimeout(resolve, delay))
        } else if (currentPlayback.currently_playing_type === 'show') {
          currentPlayback = await this.getCurrentEpisode()
          this.DeskThing.sendLog('Playing a podcast!')
        } else {
          this.DeskThing.sendError('No song is playing or detected!')
          new_id = null
          delay = 9999
        }
      } while (new_id === id && (Date.now() - startTime < timeout) && delay < 1000)

      if (new_id === id) {
        throw new Error('Timeout Reached!')
      }

      let songData: Partial<SpotifySongData>

      const isLiked = await this.checkLiked(currentPlayback.item.id)
      
      if (currentPlayback.currently_playing_type === 'track') {
        songData = {
          album: currentPlayback?.item.album?.name || 'Not Found',
          artist: currentPlayback?.item.album?.artists[0].name || 'Not Found',
          playlist: currentPlayback?.context?.type || 'Not Found',
          playlist_id: currentPlayback?.context?.uri || '123456',
          track_name: currentPlayback?.item.name,
          shuffle_state: currentPlayback?.shuffle_state,
          repeat_state: currentPlayback?.repeat_state == 'context' ? 'all' : currentPlayback.repeat_state,
          is_playing: currentPlayback?.is_playing,
          can_fast_forward: !currentPlayback?.disallows?.seeking || true,
          can_skip: !currentPlayback?.disallows?.skipping_next || true,
          can_like: true,
          can_change_volume: currentPlayback?.device.supports_volume || true,
          can_set_output: !currentPlayback?.disallows?.transferring_playback || true,
          track_duration: currentPlayback?.item.duration_ms,
          track_progress: currentPlayback?.progress_ms,
          volume: currentPlayback?.device.volume_percent,
          device: currentPlayback?.device.name,
          device_id: currentPlayback?.device.id,
          id: currentPlayback?.item.id,
          isLiked: isLiked[0],
        }

        
        const deviceExists = this.Data.settings && this.Data.settings.output_device.options.some(
          (option) => option.value === currentPlayback.device.id
        );
  
        if (!deviceExists) {
          // Update options with the new device
          this.DeskThing.sendLog(`Adding new device ${currentPlayback.device.name} to device list...`)
          this.Data.settings && this.Data.settings.output_device.options.push({
            value: currentPlayback.device.id,
            label: currentPlayback.device.name,
          });

          this.DeskThing.saveData({ settings: this.Data.settings})
        }

        this.DeskThing.sendDataToClient({ app: 'client', type: 'song', payload: songData })
        const imageUrl = currentPlayback.item.album.images[0].url
        const encodedImage = await this.DeskThing.encodeImageFromUrl(imageUrl, 'jpeg')

        // Only update the thumbnail
        this.DeskThing.sendDataToClient({ app: 'client', type: 'song', payload: { thumbnail: encodedImage}  })
      } else if (currentPlayback.currently_playing_type === 'show') {
        songData = {
          album: currentPlayback?.item.show.name,
          artist: currentPlayback?.item.show.publisher,
          playlist: currentPlayback?.context?.type || 'Not Found',
          playlist_id: currentPlayback?.context?.uri || '123456',
          track_name: currentPlayback?.item.name,
          shuffle_state: currentPlayback?.shuffle_state,
          repeat_state: currentPlayback?.repeat_state == 'context' ? 'all' : currentPlayback.repeat_state,
          is_playing: currentPlayback?.is_playing,
          can_fast_forward: !currentPlayback?.disallows?.seeking || true,
          can_skip: !currentPlayback?.disallows?.skipping_next || true,
          can_like: true,
          can_change_volume: currentPlayback?.device?.supports_volume  || true,
          can_set_output: !currentPlayback?.disallows?.transferring_playback  || true,
          track_duration: currentPlayback?.item.duration_ms,
          track_progress: currentPlayback?.progress_ms,
          volume: currentPlayback?.device.volume_percent,
          device: currentPlayback?.device.name,
          device_id: currentPlayback?.device.id,
          id: currentPlayback?.item.id,
          thumbnail: null,
          isLiked: isLiked[0],
        }

        const deviceExists = this.Data.settings && this.Data.settings.output_device.options.some(
          (option) => option.value === currentPlayback.device.id
        );
  
        if (!deviceExists) {
          // Update options with the new device
          this.DeskThing.sendLog(`Adding new device ${currentPlayback.device.name} to device list...`)
          this.Data.settings && this.Data.settings.output_device.options.push({
            value: currentPlayback.device.id,
            label: currentPlayback.device.name
          });

          this.DeskThing.saveData({ settings: this.Data.settings})
        }

        this.DeskThing.sendDataToClient({ app: 'client', type: 'song', payload: songData })
        const imageUrl = currentPlayback.item.album.images[0].url
        const encodedImage = await this.DeskThing.encodeImageFromUrl(imageUrl, 'jpeg')

        // Only update the thumbnail
        this.DeskThing.sendDataToClient({ app: 'client', type: 'song', payload: { thumbnail: encodedImage}  })
      } else {
        this.DeskThing.sendError('Song/Podcast type not supported!')
      }
    } catch (error) {
      this.DeskThing.sendError('Error getting song data:' + error)
      return error
    }
  }
}

export default SpotifyHandler
