import { DeskThing as DK, SocketData } from 'deskthing-server';
const DeskThing = DK.getInstance();
export { DeskThing } // Required export of this exact name for the server to connect

const start = async () => {
    let Data = await DeskThing.getData()
    DeskThing.on('data', (newData) => {
        // Syncs the data with the server
        Data = newData
        DeskThing.sendLog('New data received!' + Data)

        if (Data?.settings?.refresh_interval.value && Data.refresh_interval) {
          const customOption = Data.settings.refresh_interval.options[0];
          if (customOption && customOption.value !== Data.refresh_interval) {
              console.log('Custom refresh interval updated to: ' + Data.refresh_interval);
              console.log('Refresh interval', customOption)
              customOption.value = Data.refresh_interval as string; // Update the "Custom" option value
              Data.settings.refresh_interval[0].value = Data.refresh_interval; // Sync the main refresh interval value
              DeskThing.addSettings({ refresh_interval: Data.settings.refresh_interval }); // Update settings
          }
      }
    })

    if (!Data?.refresh_interval) {
      DeskThing.sendError('No refresh interval received!');
      DeskThing.saveData({refresh_interval: '9999'});
      return;
  }

    // Template Items

    // This is how to add settings (implementation may vary)
    if (!Data?.settings?.playback_location || !Data?.settings?.refresh_interval) {
      DeskThing.addSettings({
        playback_location: {
          value: 'na',
          label: 'Playback Location',
          options: [
            {
              value: 'na',
              label: 'None'
            }
          ]
        },
        refresh_interval: {
          value: '30000',
          label: "Refresh interval",
          options: [
            {
              value: '9999',
              label: "Custom"
            },
            {
              value: '0',
              label: "Disabled"
            },
            {
              value: '5000',
              label: "5 seconds"
            },
            {
              value: '10000',
              label: "10 seconds"
            },
            {
              value: '30000',
              label: "30 seconds"
            },
            {
              value: '60000',
              label: "1 minute"
            },
            {
              value: '300000',
              label: "5 minutes"
            },
          ]
        },
      })
    }

    const handleGet = async (data) => {
      console.log('UTILITY LOG: Handling Get Event', data, Data)
      console.log('Sending data to ', Data?.settings?.playback_location.value, data.type, data.request, data.payload)
      DeskThing.sendDataToOtherApp(Data?.settings?.playback_location.value as string, {type: data.type, request: data.request, payload: data.payload})
    }
    DeskThing.on('get', handleGet)
    
    const handleSet = async (data) => {
      console.log('UTILITY LOG: Handling Set Event', data, Data)
      console.log('Sending data to ', Data?.settings?.playback_location.value, data.request, data.payload)
      DeskThing.sendDataToOtherApp(Data?.settings?.playback_location.value as string, {type: data.type, request: data.request, payload: data.payload})
    }
    DeskThing.on('set', handleSet)
    
    const handleConfigEvent = async (data: SocketData | null = null) => {
      console.log('UTILITY LOG: Handling Config Event', data)
      let configData = data?.payload
      // Check if null
      if (configData == null) {
        configData = {}
        configData["audiosources"] = await DeskThing.getConfig('audiosources')
        // Check again after getting more 
        if (!configData) {
          DeskThing.sendError('No config data found')
          return
        }
      }
  
      DeskThing.sendLog('Handling Config Event')
      const sources: {label: string, value: string}[] = []
      console.log('Actual config data', configData)
  
      configData["audiosources"].map(value => {
        sources.push({
          label: value,
          value: value
        })
        })
        if (!sources) {
          DeskThing.sendError('No sources found')
          return
        }
      if (Data?.settings) {
        Data.settings.playback_location.options = sources
        DeskThing.addSettings({ playback_location: Data.settings.playback_location })
      }
      console.log('UTILITY LOG: Updated playback_location options', Data?.settings )
    }
    DeskThing.onSystem('config', handleConfigEvent)
    handleConfigEvent()


    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  // Refresh loop
  let refreshFunction: null | (() => void) = null
  const updateRefreshLoop = () => {
    if (!Data) return
    // Clear the last loop
    if (refreshFunction) {
      console.log('Clearing refresh loop')
      refreshFunction()
    }
    console.log('Starting refresh loop')
    refreshFunction = DeskThing.addBackgroundTaskLoop(async () => {
      if (!Data) return
      if (Data.settings?.refresh_interval && Data.settings.refresh_interval.value != '0') {
        try {
          if (Data.settings.playback_location.value == 'na') {
            DeskThing.sendLog('No playback location set. Skipping refresh.')
            return true
          }
          DeskThing.sendLog('Refreshing data! ' + Data.settings.refresh_interval.value)
          DeskThing.sendDataToOtherApp(Data.settings.playback_location.value as string, {type: 'get', request: 'refresh', payload: ''})
          await sleep(Data.settings.refresh_interval.value);
          console.log('Finished sleeping. Sending another request!')
          return false
        } catch (ex) {
          DeskThing.sendError('Error refreshing data' + ex)
          return true
        }
      } else {
        DeskThing.sendLog('Refresh interval disabled')
        return true
      }
    })
  }
  let lastInterval = 0

  const handleSettings = async (newSettings) => {
    console.log('Handling Settings', newSettings)
    if (newSettings.refresh_interval && lastInterval != newSettings.refresh_interval.value) {
      console.log('New Timeout Interval')
      lastInterval = newSettings.refresh_interval.value
      updateRefreshLoop()
    }

  }

  DeskThing.on('settings', handleSettings)
  // Start the loop
  updateRefreshLoop()
} 

const stop = async () => {
    // Function called when the server is stopped
}

// Main Entrypoint of the server
DeskThing.on('start', start)

// Main exit point of the server
DeskThing.on('stop', stop)