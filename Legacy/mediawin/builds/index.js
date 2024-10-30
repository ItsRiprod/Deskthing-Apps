var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/deskthing-server/dist/index.js
var require_dist = __commonJS({
  "node_modules/deskthing-server/dist/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __awaiter = exports2 && exports2.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.DeskThing = void 0;
    var fs = __importStar(require("fs"));
    var path = __importStar(require("path"));
    var DeskThing2 = class _DeskThing {
      constructor() {
        this.Listeners = {};
        this.manifest = null;
        this.toServer = null;
        this.SysEvents = null;
        this.sysListeners = [];
        this.data = null;
        this.backgroundTasks = [];
        this.isDataBeingFetched = false;
        this.dataFetchQueue = [];
        this.stopRequested = false;
        this.loadManifest();
      }
      /**
       * Singleton pattern: Ensures only one instance of DeskThing exists.
       *
       * @example
       * const deskThing = DeskThing.getInstance();
       */
      static getInstance() {
        if (!this.instance) {
          this.instance = new _DeskThing();
        }
        return this.instance;
      }
      /**
       * Initializes data if it is not already set on the server.
       * This method is run internally when there is no data retrieved from the server.
       *
       * @example
       * const deskThing = DeskThing.getInstance();
       * deskThing.start({ toServer, SysEvents });
       */
      initializeData() {
        return __awaiter(this, void 0, void 0, function* () {
          if (this.data) {
            if (!this.data.settings) {
              this.data.settings = {};
            }
            this.sendData("set", this.data);
          } else {
            this.data = {
              settings: {}
            };
            this.sendData("set", this.data);
          }
        });
      }
      /**
       * Notifies all listeners of a particular event.
       *
       * @example
       * deskThing.on('message', (msg) => console.log(msg));
       * deskThing.notifyListeners('message', 'Hello, World!');
       */
      notifyListeners(event, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
          const callbacks = this.Listeners[event];
          if (callbacks) {
            callbacks.forEach((callback) => callback(...args));
          }
        });
      }
      /**
       * Registers an event listener for a specific incoming event.
       *
       * @param event - The event to listen for.
       * @param callback - The function to call when the event occurs.
       * @returns A function to remove the listener.
       *
       * @example
       * const removeListener = deskThing.on('data', (data) => console.log(data));
       * removeListener(); // To remove the listener
       */
      on(event, callback) {
        if (!this.Listeners[event]) {
          this.Listeners[event] = [];
        }
        this.Listeners[event].push(callback);
        return () => this.off(event, callback);
      }
      /**
       * Removes a specific event listener for a particular incoming event.
       *
       * @param event - The event for which to remove the listener.
       * @param callback - The listener function to remove.
       *
       * @example
       * deskThing.off('data', dataListener);
       */
      off(event, callback) {
        if (!this.Listeners[event]) {
          return;
        }
        this.Listeners[event] = this.Listeners[event].filter((cb) => cb !== callback);
      }
      /**
       * Registers a system event listener. This feature is somewhat limited but allows for detecting when there are new audiosources or button mappings registered to the server.
       *
       * @param event - The system event to listen for.
       * @param listener - The function to call when the event occurs.
       * @returns A function to remove the listener.
       *
       * @example
       * const removeSysListener = deskThing.onSystem('config', (config) => console.log('Config changed', config));
       * removeSysListener(); // To remove the system event listener
       */
      onSystem(event, listener) {
        if (this.SysEvents) {
          const removeListener = this.SysEvents(event, listener);
          this.sysListeners.push(removeListener);
          return () => {
            const index = this.sysListeners.indexOf(removeListener);
            if (index !== -1) {
              this.sysListeners[index]();
              this.sysListeners.splice(index, 1);
            }
          };
        }
        return () => {
        };
      }
      /**
       * Registers a one-time listener for an incoming event. The listener will be automatically removed after the first occurrence of the event.
       *
       * @param event - The event to listen for.
       * @param callback - Optional callback function. If omitted, returns a promise.
       * @returns A promise that resolves with the event data if no callback is provided.
       *
       * @example
       * deskThing.once('data').then(data => console.log('Received data:', data));
       */
      once(event, callback) {
        return __awaiter(this, void 0, void 0, function* () {
          if (callback) {
            const onceWrapper = (...args) => {
              this.off(event, onceWrapper);
              callback(...args);
            };
            this.on(event, onceWrapper);
          } else {
            return new Promise((resolve) => {
              const onceWrapper = (...args) => {
                this.off(event, onceWrapper);
                resolve(args.length === 1 ? args[0] : args);
              };
              this.on(event, onceWrapper);
            });
          }
        });
      }
      /**
       * Sends data to the server with a specified event type.
       *
       * @param event - The event type to send.
       * @param payload - The data to send.
       * @param request - Optional request string.
       *
       * @example
       * deskThing.sendData('log', { message: 'Logging an event' });
       */
      sendData(event, payload, request) {
        if (this.toServer == null) {
          console.error("toServer is not defined");
          return;
        }
        const outgoingData = {
          type: event,
          request: request || "",
          payload
        };
        this.toServer(outgoingData);
      }
      /**
       * Requests data from the server with optional scopes.
       *
       * @param request - The type of data to request ('data', 'config', or 'input').
       * @param scopes - Optional scopes to request specific data.
       *
       * @example
       * deskThing.requestData('data');
       */
      requestData(request, scopes) {
        const authScopes = scopes || {};
        this.sendData("get", authScopes, request);
      }
      /**
       * Public method to send data to the server.
       *
       * @param event - The event type to send.
       * @param payload - The data to send.
       * @param request - Optional request string.
       *
       * @example
       * deskThing.send('message', 'Hello, Server!');
       */
      send(event, payload, request) {
        this.sendData(event, payload, request);
      }
      /**
       * Sends a plain text message to the server. This will display as a gray notification on the DeskThingServer GUI
       *
       * @param message - The message to send to the server.
       *
       * @example
       * deskThing.sendMessage('Hello, Server!');
       */
      sendMessage(message) {
        this.send("message", message);
      }
      /**
       * Sends a log message to the server. This will be saved to the .logs file and be saved in the Logs on the DeskThingServer GUI
       *
       * @param message - The log message to send.
       *
       * @example
       * deskThing.sendLog('This is a log message.');
       */
      sendLog(message) {
        this.send("log", message);
      }
      /**
       * Sends an error message to the server. This will show up as a red notification
       *
       * @param message - The error message to send.
       *
       * @example
       * deskThing.sendError('An error occurred!');
       */
      sendError(message) {
        this.send("error", message);
      }
      /**
       * Routes request to another app running on the server.
       *
       * @param appId - The ID of the target app.
       * @param data - The data to send to the target app.
       *
       * @example
       * deskThing.sendDataToOtherApp('utility', { type: 'set', request: 'next', payload: { id: '' } });
       */
      sendDataToOtherApp(appId, payload) {
        this.send("toApp", payload, appId);
      }
      /**
       * Sends structured data to the client through the server. This will be received by the webapp client. "app" defaults to the current app.
       *
       * @param data - The structured data to send to the client, including app, type, request, and data.
       *
       * @example
       * deskThing.sendDataToClient({
       *   app: 'client',
       *   type: 'set',
       *   request: 'next',
       *   data: { key: 'value' }
       * });
       */
      sendDataToClient(data) {
        this.send("data", data);
      }
      /**
       * Requests the server to open a specified URL.
       *
       * @param url - The URL to open.
       *
       * @example
       * deskThing.openUrl('https://example.com');
       */
      openUrl(url) {
        this.send("open", url);
      }
      /**
       * Fetches data from the server if not already retrieved, otherwise returns the cached data.
       * This method also handles queuing requests while data is being fetched.
       *
       * @returns A promise that resolves with the data fetched or the cached data, or null if data is not available.
       *
       * @example
       * const data = await deskThing.getData();
       * console.log('Fetched data:', data);
       */
      getData() {
        return __awaiter(this, void 0, void 0, function* () {
          if (!this.data) {
            if (this.isDataBeingFetched) {
              console.warn("Data is already being fetched!!");
              return new Promise((resolve) => {
                this.dataFetchQueue.push(resolve);
              });
            }
            this.isDataBeingFetched = true;
            this.requestData("data");
            try {
              const data = yield Promise.race([
                this.once("data"),
                new Promise((resolve) => setTimeout(() => resolve(null), 5e3))
                // Adjust timeout as needed
              ]);
              this.isDataBeingFetched = false;
              if (data) {
                this.dataFetchQueue.forEach((resolve) => resolve(data));
                this.dataFetchQueue = [];
                return data;
              } else {
                if (this.data) {
                  this.sendLog("Failed to fetch data, but data was found");
                  this.dataFetchQueue.forEach((resolve) => resolve(this.data));
                  this.dataFetchQueue = [];
                  return this.data;
                } else {
                  this.dataFetchQueue.forEach((resolve) => resolve(null));
                  this.dataFetchQueue = [];
                  this.sendError("Data is not defined! Try restarting the app");
                  return null;
                }
              }
            } catch (error) {
              this.sendLog(`Error fetching data: ${error}`);
              this.isDataBeingFetched = false;
              this.dataFetchQueue.forEach((resolve) => resolve(this.data));
              this.dataFetchQueue = [];
              return this.data;
            }
          } else {
            return this.data;
          }
        });
      }
      /**
       * Requests a specific configuration from the server by name.
       *
       * @param name - The name of the configuration to request.
       * @returns A promise that resolves with the requested configuration or null if not found.
       *
       * @example
       * deskThing.getConfig('myConfig');
       */
      getConfig(name) {
        return __awaiter(this, void 0, void 0, function* () {
          this.requestData("config", name);
          return yield Promise.race([
            this.once("config"),
            new Promise((resolve) => setTimeout(() => {
              resolve(null);
              this.sendLog(`Failed to fetch config: ${name}`);
            }, 5e3))
            // Adjust timeout as needed
          ]);
        });
      }
      /**
       * Asynchronously retrieves the current settings. If settings are not defined, it fetches them from the server.
       *
       * @returns The current settings or undefined if not set.
       *
       * @example
       * const settings = deskThing.getSettings();
       * console.log('Current settings:', settings);
       */
      getSettings() {
        return __awaiter(this, void 0, void 0, function* () {
          var _a;
          if (!((_a = this.data) === null || _a === void 0 ? void 0 : _a.settings)) {
            console.error("Settings are not defined!");
            const data = yield this.getData();
            if (data && data.settings) {
              return data.settings;
            } else {
              this.sendLog("Settings are not defined!");
              return null;
            }
          } else {
            return this.data.settings;
          }
        });
      }
      /**
       * Requests user input for the specified scopes and triggers the provided callback with the input response.
       * Commonly used for settings keys, secrets, and other user-specific data. Callback data will be a json object with keys matching the scope ids and values of the answers.
       *
       * @param scopes - The scopes to request input for, defining the type and details of the input needed.
       * @param callback - The function to call with the input response once received.
       *
       * @example
       * deskThing.getUserInput(
       *   {
       *     username: { instructions: 'Enter your username', label: 'Username' },
       *     password: { instructions: 'Enter your password', label: 'Password' }
       *   },
       *   (response) => console.log('User input received:', response.username, response.password)
       * );
       */
      getUserInput(scopes, callback) {
        return __awaiter(this, void 0, void 0, function* () {
          if (!scopes) {
            this.sendError("Scopes not defined in getUserInput!");
            return;
          }
          this.requestData("input", scopes);
          try {
            const response = yield this.once("input");
            if (callback && typeof callback === "function") {
              callback(response);
            }
          } catch (error) {
            this.sendError(`Error occurred while waiting for input: ${error}`);
          }
        });
      }
      /**
       * Adds a new setting or overwrites an existing one. Automatically saves the new setting to the server to be persisted.
       *
       * @param id - The unique identifier for the setting.
       * @param label - The display label for the setting.
       * @param defaultValue - The default value for the setting.
       * @param options - An array of options for the setting.
       *
       * @example
       * // Adding a boolean setting
       * deskThing.addSetting('darkMode', 'Dark Mode', false, [
       *   { label: 'On', value: true },
       *   { label: 'Off', value: false }
       * ])
       *
       * @example
       * // Adding a string setting with multiple options
       * deskThing.addSetting('theme', 'Theme', 'light', [
       *   { label: 'Light', value: 'light' },
       *   { label: 'Dark', value: 'dark' },
       *   { label: 'System', value: 'system' }
       * ])
       */
      addSettings(settings) {
        var _a;
        if (!this.data) {
          this.data = { settings: {} };
        } else if (!this.data.settings) {
          this.data.settings = {};
        }
        if ((_a = this.data) === null || _a === void 0 ? void 0 : _a.settings) {
          Object.keys(settings).forEach((id) => {
            var _a2;
            const setting = settings[id];
            if (!((_a2 = this.data) === null || _a2 === void 0 ? void 0 : _a2.settings))
              return;
            if (this.data.settings[id]) {
              console.warn(`Setting with label "${setting.label}" already exists. It will be overwritten.`);
              this.sendLog(`Setting with label "${setting.label}" already exists. It will be overwritten.`);
            }
            this.data.settings[id] = {
              value: setting.value,
              label: setting.label,
              options: setting.options
            };
          });
          console.log("sending settings", this.data.settings);
          this.sendData("add", { settings: this.data.settings });
        }
      }
      /**
      * Registers a new action to the server. This can be mapped to any key on the deskthingserver UI.
      *
      * @param name - The name of the action.
      * @param id - The unique identifier for the action. This is what will be used when it is triggered
      * @param description - A description of the action.
      * @param flair - Optional flair for the action (default is an empty string).
      */
      registerAction(name, id, description, flair = "") {
        this.sendData("action", { name, id, description, flair }, "add");
      }
      /**
      * Registers a new key with the specified identifier. This can be mapped to any action. Use a keycode to map a specific keybind.
      * Possible keycodes can be found at https://www.toptal.com/developers/keycode and is listening for event.code
      * The first number in the key will be passed to the action (e.g. customAction13 with action SwitchView will switch to the 13th view )
      *
      * @param id - The unique identifier for the key.
      */
      registerKey(id) {
        this.sendData("button", { id }, "add");
      }
      /**
      * Removes an action with the specified identifier.
      *
      * @param id - The unique identifier of the action to be removed.
      */
      removeAction(id) {
        this.sendData("action", { id }, "remove");
      }
      /**
      * Removes a key with the specified identifier.
      *
      * @param id - The unique identifier of the key to be removed.
      */
      removeKey(id) {
        this.sendData("button", { id }, "remove");
      }
      /**
      * Saves the provided data by merging it with the existing data and updating settings.
      * Sends the updated data to the server and notifies listeners.
      *
      * @param data - The data to be saved and merged with existing data.
      */
      saveData(data) {
        var _a;
        this.data = Object.assign(Object.assign(Object.assign({}, this.data), data), { settings: Object.assign(Object.assign({}, (_a = this.data) === null || _a === void 0 ? void 0 : _a.settings), data.settings) });
        this.sendData("add", this.data);
        this.notifyListeners("data", this.data);
      }
      /**
       * Adds a background task that will loop until either the task is cancelled or the task function returns false.
       * This is useful for tasks that need to run periodically or continuously in the background.
       *
       * @param task - The background task function to add. This function should return a Promise that resolves to a boolean or void.
       * @returns A function to cancel the background task.
       *
       * @example
       * // Add a background task that logs a message every 5 seconds
       * const cancelTask = deskThing.addBackgroundTaskLoop(async () => {
       *   console.log('Performing periodic task...');
       *   await new Promise(resolve => setTimeout(resolve, 5000));
       *   return false; // Return false to continue the loop
       * });
       *
       * // Later, to stop the task:
       * cancelTask();
       *
       * @example
       * // Add a background task that runs until a condition is met
       * let count = 0;
       * deskThing.addBackgroundTaskLoop(async () => {
       *   console.log(`Task iteration ${++count}`);
       *   if (count >= 10) {
       *     console.log('Task completed');
       *     return true; // Return true to end the loop
       *   }
       *   return false; // Continue the loop
       * });
       */
      addBackgroundTaskLoop(task) {
        const cancelToken = { cancelled: false };
        const wrappedTask = () => __awaiter(this, void 0, void 0, function* () {
          let endToken = false;
          while (!cancelToken.cancelled && !endToken) {
            endToken = (yield task()) || false;
          }
        });
        this.backgroundTasks.push(() => {
          cancelToken.cancelled = true;
        });
        wrappedTask();
        return () => {
          cancelToken.cancelled = true;
        };
      }
      /**
      * Adds a background task that will loop until either the task is cancelled or the task function returns false.
      * This is useful for tasks that need to run periodically or continuously in the background.
      *
      * @param url - The url that points directly to the image
      * @param type - The type of image to return (jpeg for static and gif for animated)
      * @returns Promise string that has the base64 encoded image
      *
      * @example
      * // Getting encoded spotify image data
      * const encodedImage = deskThing.encodeImageFromUrl(https://i.scdn.co/image/ab67616d0000b273bd7401ecb7477f3f6cdda060, 'jpeg')
      *
      * deskThing.sendMessageToAllClients({app: 'client', type: 'song', payload: { thumbnail: encodedImage } })
      */
      encodeImageFromUrl(url_1) {
        return __awaiter(this, arguments, void 0, function* (url, type = "jpeg") {
          try {
            console.log(`Fetching ${type} data...`);
            const response = yield fetch(url);
            const arrayBuffer = yield response.arrayBuffer();
            const base64String = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            const imgData = `data:image/${type};base64,${base64String}`;
            console.log(`Sending ${type} data`);
            return imgData;
          } catch (error) {
            console.error(`Error fetching ${type}:`, error);
            throw error;
          }
        });
      }
      /**
       * Deskthing Server Functions
       */
      /**
       * Load the manifest file and saves it locally
       * This method is typically used internally to load configuration data.
       *
       * @example
       * deskThing.loadManifest();
       */
      loadManifest() {
        const manifestPath = path.resolve(__dirname, "./manifest.json");
        try {
          const manifestData = fs.readFileSync(manifestPath, "utf-8");
          this.manifest = JSON.parse(manifestData);
        } catch (error) {
          console.error("Failed to load manifest:", error);
        }
      }
      /**
      * Returns the manifest in a Response structure
      * If the manifest is not found or fails to load, it returns a 500 status code.
      * It will attempt to read the manifest from file if the manifest does not exist in cache
      *
      * @example
      * const manifest = deskThing.getManifest();
      * console.log(manifest);
      */
      getManifest() {
        if (!this.manifest) {
          console.warn("Manifest Not Found - trying to load manually...");
          this.loadManifest();
          if (!this.manifest) {
            return {
              data: { message: "Manifest not found or failed to load after 2nd attempt" },
              status: 500,
              statusText: "Internal Server Error",
              request: []
            };
          } else {
          }
        }
        return {
          data: this.manifest,
          status: 200,
          statusText: "OK",
          request: []
        };
      }
      start(_a) {
        return __awaiter(this, arguments, void 0, function* ({ toServer, SysEvents }) {
          this.toServer = toServer;
          this.SysEvents = SysEvents;
          this.stopRequested = false;
          try {
            yield this.notifyListeners("start");
          } catch (error) {
            console.error("Error in start:", error);
            return {
              data: { message: `Error starting the app: ${error}` },
              status: 500,
              statusText: "Internal Server Error",
              request: []
            };
          }
          return {
            data: { message: "Started successfully!" },
            status: 200,
            statusText: "OK",
            request: []
          };
        });
      }
      /**
       * Stops background tasks, clears data, notifies listeners, and returns a response. This is used by the server to kill the program. Emits 'stop' event.
       *
       * @returns A promise that resolves with a response object.
       *
       * @example
       * const response = await deskThing.stop();
       * console.log(response.statusText);
       */
      stop() {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            if (this.data) {
              this.sendData("set", this.data);
            }
            yield this.notifyListeners("stop");
            this.stopRequested = true;
            this.backgroundTasks.forEach((cancel) => cancel());
            this.backgroundTasks = [];
            this.sendLog("Background tasks stopped and removed");
          } catch (error) {
            console.error("Error in stop:", error);
            return {
              data: { message: `Error in stop: ${error}` },
              status: 500,
              statusText: "Internal Server Error",
              request: []
            };
          }
          return {
            data: { message: "App stopped successfully!" },
            status: 200,
            statusText: "OK",
            request: []
          };
        });
      }
      purge() {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            yield this.notifyListeners("purge");
            this.stopRequested = true;
            this.backgroundTasks.forEach((cancel) => cancel());
            this.sendLog("Background tasks stopped");
            this.clearCache();
            this.sendLog("Cache cleared");
          } catch (error) {
            console.error("Error in Purge:", error);
            return {
              data: { message: `Error in Purge: ${error}` },
              status: 500,
              statusText: "Internal Server Error",
              request: []
            };
          }
          return {
            data: { message: "App purged successfully!" },
            status: 200,
            statusText: "OK",
            request: []
          };
        });
      }
      // Method to clear cached data
      clearCache() {
        this.data = null;
        this.Listeners = {};
        this.manifest = null;
        this.SysEvents = null;
        this.stopRequested = false;
        this.backgroundTasks = [];
        this.sysListeners.forEach((removeListener) => removeListener());
        this.sysListeners = [];
        this.sendLog("Cache cleared");
        this.toServer = null;
      }
      toClient(data) {
        if (data.type === "data" && data) {
          const payload = data.payload;
          if (typeof payload === "object" && data !== null) {
            this.saveData(payload);
          } else {
            console.warn("Received invalid data from server:", payload);
            this.sendLog("Received invalid data from server:" + payload);
            this.initializeData();
          }
        } else if (data.type === "message") {
          this.sendLog("Received message from server:" + data.payload);
        } else if (data.type === "set" && data.request === "settings" && data.payload) {
          const { id, value } = data.payload;
          if (this.data && this.data.settings && this.data.settings[id]) {
            this.sendLog(`Setting with label "${id}" changing from ${this.data.settings[id].value} to ${value}`);
            this.data.settings[id].value = value;
            this.sendData("add", { settings: this.data.settings });
            this.notifyListeners("settings", this.data.settings);
            this.notifyListeners("data", this.data);
          } else {
            this.sendLog(`Setting with label "${id}" not found`);
          }
        } else {
          this.notifyListeners(data.type, data);
        }
      }
    };
    exports2.DeskThing = DeskThing2;
    exports2.default = DeskThing2.getInstance();
  }
});

// index.js
var mediawin_exports = {};
__export(mediawin_exports, {
  DeskThing: () => DeskThing
});
module.exports = __toCommonJS(mediawin_exports);

// mediawin.js
var import_child_process = require("child_process");
var MediaWin = class {
  constructor(DeskThing2) {
    this.DeskThing = DeskThing2;
    this.currentId = null;
  }
  async sendLog(message) {
    this.DeskThing.sendLog(message);
  }
  async sendError(message) {
    this.DeskThing.sendError(message);
  }
  async returnSongData(id = null, retryCount = 0) {
    try {
      const result = await this.executeCommand("");
      if (result === false) {
        this.sendError("Music Data returned false! There was an error");
        return false;
      } else {
        if (result.id !== id) {
          this.currentId = result.id;
          const musicData = result;
          musicData.thumbnail = "data:image/png;base64," + musicData.thumbnail;
          musicData.volume = await this.getVolumeInfo();
          musicData.can_change_volume = true;
          this.sendLog("Returning song data");
          return musicData;
        } else {
          if (retryCount < 5) {
            this.sendLog(`Retry attempt ${retryCount + 1} for next command.`);
            await new Promise((resolve) => setTimeout(resolve, 1e3));
            return this.returnSongData(id, retryCount + 1);
          } else {
            this.sendError(`Reached maximum retry attempts for next command.`);
            return false;
          }
        }
      }
    } catch (error) {
      this.sendError(`Error executing next command: ${error}`);
      return false;
    }
  }
  async checkForRefresh() {
    const result = await this.executeCommand("");
    if (result === false) {
      this.sendError("Music Data returned false! There was an error");
      return false;
    } else if (result.id !== this.currentId) {
      return this.returnSongData();
    }
  }
  async executeCommand(command, args = "") {
    return new Promise((resolve, reject) => {
      (0, import_child_process.exec)(`cd ${__dirname} && DeskThingMediaCLI.exe ${command} ${args}`, (error, stdout, stderr) => {
        if (error) {
          this.sendError(`exec error: ${error}`);
          reject(false);
          return;
        }
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (parseError) {
          this.sendError("Error parsing JSON:" + parseError);
          reject(false);
        }
      });
    });
  }
  async exeVol(...args) {
    return new Promise((resolve, reject) => {
      (0, import_child_process.exec)(`cd ${__dirname} && adjust_get_current_system_volume_vista_plus.exe ${args}`, (error, stdout, stderr) => {
        if (error) {
          this.sendError(`exec error: ${error}`);
          reject(false);
          return;
        }
        try {
          resolve(stdout);
        } catch (parseError) {
          this.sendError("Error parsing JSON:" + parseError);
          reject(false);
        }
      });
    });
  }
  async getVolumeInfo() {
    const data = await this.exeVol();
    const args = data.split(" ");
    return parseInt(args[0], 10);
  }
  async next(id) {
    const result = await this.executeCommand("next");
    if (result.success) {
      return await this.returnSongData(id);
    }
    return false;
  }
  async previous() {
    return this.executeCommand("previous");
  }
  async fastForward(seconds) {
    return this.executeCommand("fastforward", seconds);
  }
  async rewind(seconds) {
    return this.executeCommand("rewind", seconds);
  }
  async play() {
    return this.executeCommand("play");
  }
  async pause() {
    return this.executeCommand("pause");
  }
  async stop() {
    return this.executeCommand("stop");
  }
  async seek(positionMs) {
    return this.executeCommand("seek", positionMs);
  }
  async volume(volumePercentage) {
    this.exeVol(String(volumePercentage));
    return true;
  }
  async repeat(state) {
    return this.executeCommand("setrepeat", state);
  }
  async shuffle(state) {
    return this.executeCommand("setshuffle", state);
  }
};
var mediawin_default = MediaWin;

// index.js
var import_deskthing_server = __toESM(require_dist(), 1);
var DeskThing = import_deskthing_server.DeskThing.getInstance();
var mediawin;
var start = async () => {
  mediawin = new mediawin_default(DeskThing);
  let Data = await DeskThing.getData();
  DeskThing.on("data", (newData) => {
    Data = newData;
  });
  if (!Data.settings?.change_source) {
    const settings = {
      "change_source": {
        "value": "true",
        "label": "Switch Output on Select",
        "type": "boolean"
      }
    };
    DeskThing.addSettings(settings);
  }
  DeskThing.on("get", handleGet);
  DeskThing.on("set", handleSet);
};
DeskThing.on("start", start);
var handleGet = async (data) => {
  console.log("Receiving Get Data", data);
  if (data == null) {
    DeskThing.sendError("No args provided");
    return;
  }
  let response;
  switch (data.request) {
    case "song":
      response = await mediawin.returnSongData();
      response = { app: "client", type: "song", payload: response };
      DeskThing.sendDataToClient(response);
      break;
    case "refresh":
      response = await mediawin.checkForRefresh();
      if (response) {
        response = { app: "client", type: "song", payload: response };
        DeskThing.sendDataToClient(response);
      }
      break;
    default:
      DeskThing.sendError(`Unknown request: ${data.request}`);
      break;
  }
};
var handleSet = async (data) => {
  if (data == null) {
    DeskThing.sendError("No args provided");
    return;
  }
  DeskThing.sendLog("Receiving Set Data" + data);
  console.log("Receiving Set Data", data);
  let response;
  switch (data.request) {
    case "next":
      response = await mediawin.next(data.payload);
      if (!response == false) {
        response = { app: "client", type: "song", payload: response };
        DeskThing.sendDataToClient(response);
      }
      break;
    case "previous":
      response = await mediawin.previous();
      break;
    case "fast_forward":
      response = await mediawin.fastForward(data.payload);
      break;
    case "rewind":
      response = await mediawin.rewind(data.payload);
      break;
    case "play":
      response = await mediawin.play(data.payload);
      break;
    case "pause":
    case "stop":
      response = await mediawin.pause();
      break;
    case "seek":
      response = await mediawin.seek(data.payload);
      break;
    case "like":
      response = "Unable to like songs!";
      break;
    case "volume":
      response = await mediawin.volume(data.payload);
      break;
    case "repeat":
      response = await mediawin.repeat(data.payload);
      break;
    case "shuffle":
      response = await mediawin.shuffle(data.payload);
      break;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DeskThing
});
