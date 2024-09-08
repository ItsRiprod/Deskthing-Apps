import { DeskThing as DK } from "deskthing-server";
const DeskThing = DK.getInstance();
import { totalmem, freemem, cpus } from "os";
export { DeskThing }; // Required export of this exact name for the server to connect

const start = async () => {
  let prevIdleTime = 0;
  let prevTotalTime = 0;

  // Function Declarations

  /**
   * @returns The percentage of memory usage between 0.0 and 1.0
   */
  function getMemPercentage() {
    const totalMemory = totalmem();
    const usedMemory = totalMemory - freemem();
    const percentage = usedMemory / totalMemory;
    return percentage;
  }

  /**
   * Takes a snapshot of the current CPU times
   */
  function snapshotCpuTimes() {
    const CPUs = cpus();
    let idle = 0;
    let total = 0;

    for (const cpu of CPUs) {
      for (const type in cpu.times) {
        total += cpu.times[type];
      }
      idle += cpu.times.idle;
    }

    return { idle, total };
  }
  
   /**
   * @returns A promise that resolves to the percentage of CPU usage between 0.0 and 1.0 after a delay
   */
   async function getCpuPercentage() {
    // Take an initial snapshot
    const startTimes = snapshotCpuTimes();

    // Wait for a small interval (e.g., 100ms)
    await sleep(100);

    // Take a second snapshot
    const endTimes = snapshotCpuTimes();

    // Calculate the difference in idle and total time
    const idleDifference = endTimes.idle - startTimes.idle;
    const totalDifference = endTimes.total - startTimes.total;

    // Calculate CPU usage percentage
    const percentageCpu = 1 - idleDifference / totalDifference;

    return percentageCpu;
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
      const memUsage = await getMemPercentage();
      const cpuUsage = await getCpuPercentage();
  
      const code = Math.round((Math.random()) + 0.1 * 100);
  
      // Send the data to the client
      DeskThing.sendDataToClient({
        type: "system",
        payload: { memUsage, cpuUsage, ping: code },
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
