// You need to treat workers like their own isolated process - because they are. This means they can't access any of the DeskThing objects.
// By default, workers are also compiled per-file rather
import { parentPort, workerData } from 'worker_threads'

// If you must separate out your code, put all helpers inside a subdirectory (/helpers in this case) to avoid them being compiled into the /workers folder
import { workerHelper } from './helpers/workerHelper'

parentPort?.postMessage(`Worker ${workerData?.name || 'Unknown'} started successfully`)

setInterval(() => {
    const message = workerHelper()
    parentPort?.postMessage(message)
}, 5000)