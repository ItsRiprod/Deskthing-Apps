import { DeskThing as DK } from "deskthing-server";
const DeskThing = DK.getInstance();
import si from "systeminformation";
export { DeskThing }; // Required export of this exact name for the server to connect

const start = async () => {
  let Data = await DeskThing.getData()
  DeskThing.on('data', (newData) => {
      // Syncs the data with the server
      Data = newData
      DeskThing.sendLog('New data received!' + Data)
  })

  if (!Data?.settings?.view) {
    DeskThing.addSettings({
      "view": { label: "System View", type:'select', description:'Choose the GUI you want', value: 'gpu', options: [{ label: 'Default View', value: 'default' }, { label: 'GPU Centered', value: 'gpu' }] }
    });
  }
  
  async function getAdditionalSystemStats() {
    try {
      const gpuData = await si.graphics();
      const networkData = await si.networkStats();
      const cpuData = await si.cpuTemperature();
      const memoryData = await si.mem();
      const processData = await si.processes();
      const cpuLoad = (await si.currentLoad()).currentLoad;

      const gpuTemp = gpuData.controllers[0].temperatureGpu;
      const gpuUsage = gpuData.controllers[0].utilizationGpu;
      const uploadSpeed = networkData[0].tx_sec;
      const downloadSpeed = networkData[0].rx_sec;
      const ping = networkData[0].ms;
      const cpuTemp = cpuData.main;
      const memTotal = memoryData.total;
      const memUsage = memoryData.active;
      const processCount = processData.all;
      const activeProcesses = processData.running;

      return {
        gpuTemp,
        gpuUsage,
        uploadSpeed,
        downloadSpeed,
        ping,
        cpuTemp,
        cpuLoad,
        memTotal,
        memUsage,
        processCount,
        activeProcesses,
      };
    } catch (error) {
      DeskThing.sendLog(`Error fetching system stats: ${error.message}`);
      return {};
    }
  }

  // Utility function for sleeping 
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));



  // Remove background task function
  let removeBackgroundTask: (() => void) | null = null


  /**
   * Sets up a loop that sends data to the client every 100ms and pings the client to see if it is still connected
   */
  const setupLoop = async () => {
    if (removeBackgroundTask) {
      console.log('Removed existing background task');
      removeBackgroundTask(); // remove any existing background task
      removeBackgroundTask = null; // reset the reference to null
    }

    // Create a new background task
    removeBackgroundTask = DeskThing.addBackgroundTaskLoop(async () => {
      const {
        gpuTemp,
        gpuUsage,
        uploadSpeed,
        downloadSpeed,
        ping,
        cpuTemp,
        memTotal,
        cpuLoad,
        memUsage,
        processCount,
        activeProcesses,
      } = await getAdditionalSystemStats();
      const code = Math.round((Math.random()) + 0.1 * 100);
  
      // Send the data to the client
      DeskThing.sendDataToClient({
        type: "system",
        payload: {
          cpuLoad,
          memUsage,
          cpuTemp,
          gpuTemp,
          gpuUsage,
          uploadSpeed,
          downloadSpeed,
          ping: code,
          pingTime: ping,
          processCount,
          activeProcesses,
        },
      });

      // Await for the client to ping back
      const responsePromise = new Promise<boolean>((resolve) => {
        
        const removeListener = DeskThing.on("set", async (socketData) => {
          if (socketData.request == "pong" && socketData.payload == code) {
            console.log('Client responded with correct pong');
            removeListener();
            resolve(true);
          }
        });

        // Setup a 5 second timeout to resolve with false if the client doesn't respond
        setTimeout(() => {
          removeListener()
          resolve(false)
        }, 5000)
      });
  
  
      // Start the race condition
      const result = await responsePromise
  


      // Check the results
      await sleep(1000); // Wait an additional second to not overload the client with data
      if (result) {
        console.log("Client response received");
        return false; // Continue Loop
      } else {
        console.log("Client response timed out");
        return true; // End Loop as client as presumably disconnected
      }
    });
  }



  // Listen for the initial setup request (pinged when the client connects)
  const removeInitialSetup = DeskThing.on('set', async (socketData) => {
    if (socketData.request == "subscribe") {
      setupLoop();
    }
  })

  // Start the loop by default
  setupLoop()

  // Stop function to cleanup listeners and tasks
  const stop = async () => {

    // Remove the background task
    if (removeBackgroundTask) {
      removeBackgroundTask();
      removeBackgroundTask = null;
    }

    // Remove the initial setup listener
    removeInitialSetup()
  };
  DeskThing.on("stop", stop);
};

// Main Entrypoint of the server
DeskThing.on("start", start);
