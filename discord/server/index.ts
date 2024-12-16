import { DeskThing } from 'deskthing-server';
export { DeskThing } // Required export of this exact name for the server to connect

const start = async () => {
    let Data = await DeskThing.getData()
    DeskThing.on('data', (newData) => {
        // Syncs the data with the server
        Data = newData
        DeskThing.sendLog('New data received!' + Data)
    })

    // Template Items

    // This is how to add settings (implementation may vary)
    if (!Data?.settings?.notifications || !Data?.settings?.activity ) {
        DeskThing.addSettings({
          "notifications": { label: "Show Notifcations", type: 'select', value: 'both', options: [{ label: 'From DMs', value: 'dm' }, { label: 'From VC Chat', value: 'vc' }, { label: 'Both', value: 'both' }, { label: 'Disabled', value: 'neither' }] },
          "activity": { label: "Set Activity", type: 'boolean', value: false },
        })

        // This will make Data.settings.theme.value equal whatever the user selects
      }

    // Getting data from the user (Ensure these match)
    if (!Data?.client_id || !Data?.client_secret) {
        const requestScopes = {
          'client_id': {
            'value': '',
            'label': 'Discord Client ID',
            'instructions': 'You can get your Discord Client ID from the <a href="https://discord.com/developers/applications" target="_blank" style="color: lightblue;">Discord Application Dashboard</a>. You must create a new discord bot and then under OAuth2 find CLIENT ID - Copy and paste that into this field.',
          },
          'client_secret': {
            'value': '',
            'label': 'Discord Client Secret',
            'instructions': 'You can get your Spotify Client Secret from the <a href="https://discord.com/developers/applications" target="_blank" style="color: lightblue;">Discord Application Dashboard</a>. You must create a new application and then under OAuth2 click "Reveal Secret" or "Reset Secret" and copy-paste that here in this field.',
          },
          'redirect_url': {
            'label': 'Discord Redirect URI',
            'value': 'http://localhost:8888/callback/discord',
            'instructions': 'Set the Discord Redirect URI to http://localhost:8888/callback/discord and then click "Save".\n This ensures you can authenticate your account to this application',
          }
        }
    
        DeskThing.getUserInput(requestScopes, async (data) => {
          if (data.payload.client_id && data.payload.client_secret) {
            // You can either save the returned data to your data object or do something with it
            DeskThing.saveData(data.payload)
          } else {
            DeskThing.sendError('Please fill out all the fields! Restart to try again')
          }
        })
      } else {
        DeskThing.sendLog('Data Exists!')
        // This will be called is the data already exists in the server
      }
} 

const stop = async () => {
    // Function called when the server is stopped
}

// Main Entrypoint of the server
DeskThing.on('start', start)

// Main exit point of the server
DeskThing.on('stop', stop)