import { DeskThing as DK } from 'deskthing-server';
// Doing this is required in order for the server to link with DeskThing
const DeskThing = DK.getInstance();
export { DeskThing }

// End of required code

// This is triggered at the end of this file with the on('start') listener. It runs when the DeskThing starts your app. It serves as the entrypoint for your app
const start = async () => {

    // This is just one of the ways of synchronizing your data with the server. It waits for the server to have more data and saves it to the Data object here.
    let Data = await DeskThing.getData()
    DeskThing.on('data', (newData) => {
        // Syncs the data with the server
        Data = newData
        DeskThing.sendLog('New data received!' + Data)
    })

    // Template Items

    // This is how to add settings. You need to pass the "settings" object to the AddSettings() function
    if (!Data?.settings?.theme) {
        DeskThing.addSettings({
          "number": { label: "Number Input", description: "Choose a number between 0 and 100", type: 'number', value: 0, min: 0, max: 100 },
          "boolean": { label: "Toggle Switch", description: "Switch between true and false", type: 'boolean', value: false },
          "string": { label: "Text Input", description: "Enter any text value", type: 'string', value: '' },
          "select": { label: "Theme Selector", description: "Choose between dark and light themes", type: 'select', value: 'dark', options: [{ label: 'Dark Theme', value: 'dark' }, { label: 'Light Theme', value: 'light' }] },
          "multiselect": { label: "Multiple Options", description: 'Select one or more options from the list', type: 'multiselect', value: ['option1', 'option2'], options: [{ label: 'Option1', value: 'option1' }, { label: 'Option2', value: 'option2' }, { label: 'Option3', value: 'option3' }, { label: 'Option4', value: 'option4' }] },
        })
        // This will make Data.settings.theme.value equal whatever the user selects
      }

    // Getting data from the user (Ensure these match)
    if (!Data?.user_input || !Data?.second_user_input) {
        const requestScopes = {
          'user_input': {
            'value': '',
            'label': 'Placeholder User Data',
            'instructions': 'You can make the instructions whatever you want. You can also include HTML inline styling like <a href="https://deskthing.app/" target="_blank" style="color: lightblue;">Making Clickable Links</a>.',
          },
          'second_user_input': {
            'value': 'Prefilled Data',
            'label': 'Second Option',
            'instructions': 'Scopes can include as many options as needed',
          }
        }
    
        DeskThing.getUserInput(requestScopes, async (data) => {
          if (data.payload.user_input && data.payload.second_user_input) {
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