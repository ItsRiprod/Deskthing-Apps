# Deskthing Apps 

This is where all of the apps developed for the DeskThing is located! If you want to make your own or are just browsing, these act as great reference points! 

Every app here is the precompiled apps you download into DeskThing. The structure of each app is defined [here](https://github.com/itsriprod/deskthing-template)


## Making your own app

Prereqs: Ensure you have [node](https://nodejs.org/en/download/package-manager) installed! 

Run
```
npm create deskthing@latest
```
in the terminal and it will prompt you to make a new app!

Audiosources are any app (like spotify or mediawin) that are capable of returning audiodata
Screesaver apps havent been implemented yet
Web App or Local App is a legacy feature - your opinion here doesn't matter.

server/ is the nodeJS files for the backend
src/ is the React + Vite files for the front end 

To communicate back and forth, you'll need to use the DeskThing modules that come installed.

deskthing-client is for the client-side connections
deskthing-server is for the server-side connection

The basic scaffolding for the server is:
```ts
import { DeskThing } from 'deskthing-server' // imports from the connector package
export DeskThing // exports for the server to use
const dt = DeskThing.getInstance() // Enforces singleton pattern


const main = () => {
    // Main code logic
}

dt.on('start', main) // Runs main on startup
```


Once things are more finalized, I will document things more thoroughly here. However, until then, you can go to the discord [linked here](https://deskthing.app/) and I can help you get started!
