import { DeskThing } from '@deskthing/server';
/**
 * Workers are basically a way to multithread your app. This is useful for things like websockets or background tasks that don't always need to directly talk to your client.
 *
 * Use them carefully. While DeskThing properly cleans them up, there's a chance they could still cause a memory leak if you're not careful.
 *
 * They can be triggered on('start') and will automatically be cleaned up when the server is stopped or paused.
 */

export const setupWorkers = async () => {

    // worker data can be anything you want to pass to it
    const data = {
        name: "Worker Example",
        description: "This is an example of a worker",
    };

    // Ensure that it is in production before using the worker thread. This way it resolves to .js correctly
    if (process.env.NODE_ENV !== "development") {
        const [worker] = DeskThing.addThread("./workers/workerEx.js", data); // use JS because that is what it will be compiled into

        worker.on("message", (message) => {
          console.debug("Worker Message: " + message);
        });
    }

};
