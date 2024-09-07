import { DeskThing as DK } from 'deskthing-server';
const DeskThing = DK.getInstance();
import { totalmem, freemem, cpus } from 'os';
export { DeskThing } // Required export of this exact name for the server to connect

const start = async () => {

  let prevIdleTime = 0;
  let prevTotalTime = 0;

  function getMemPercentage() {
    const totalMemory = totalmem();
    const usedMemory = totalMemory - freemem();
    const percentage = usedMemory / totalMemory;
    return percentage;
}
  function getCpuPercentage() {
    const CPUs = cpus();
    let idle = 0;
    let total = 0;
  
    for (const cpu of CPUs) {
        for (const type in cpu.times) {
            total += cpu.times[type];
        }
        idle += cpu.times.idle;
    }
  
    // Calculate the difference in idle and total time since last call
    const idleDifference = idle - prevIdleTime;
    const totalDifference = total - prevTotalTime;
  
    // Calculate the percentage CPU usage
    let percentageCpu = 100 - Math.ceil((100 * idleDifference) / totalDifference);
  
    // Update the previous idle and total times
    prevIdleTime = idle;
    prevTotalTime = total;
  
    percentageCpu /= 100;
    return percentageCpu;
  }
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const remove = DeskThing.addBackgroundTaskLoop(async () => {
    const memUsage = await getMemPercentage()
    const cpuUsage = await getCpuPercentage()

    DeskThing.sendDataToClient({type: 'system', payload: { memUsage, cpuUsage }})

    await sleep(1000)
  })

  /*  
  let Data = await DeskThing.getData()
    DeskThing.on('data', (newData) => {
        // Syncs the data with the server
        Data = newData
        DeskThing.sendLog('New data received!' + Data)
    })

    // Template Items

    // This is how to add settings (implementation may vary)
    if (!Data?.settings?.theme) {
        DeskThing.addSettings({
          "theme": { label: "Theme Choice", value: 'dark', options: [{ label: 'Dark Theme', value: 'dark' }, { label: 'Light Theme', value: 'light' }] },
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

      */
     const stop = async () => {
        remove()
     }
     DeskThing.on('stop', stop)
} 


// Main Entrypoint of the server
DeskThing.on('start', start)

// Main exit point of the server