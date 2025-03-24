
import { DeskThing } from "@deskthing/server"
import { DESKTHING_EVENTS, ServerEvent, Step, STEP_TYPES, Task } from "@deskthing/types"
import { SpotifySettingIDs } from "./setupSettings"

export const setupTasks = () => {
    DeskThing.tasks.initTasks({
        spotify_setup: {
            id: 'spotify_setup',
            label: "Spotify Setup",
            description: 'Setup Spotify Integration',
            version: "0.10.4",
            available: true,
            completed: false,
            started: false,
            steps: {
                create_app: {
                    id: 'create_app',
                    label: 'Create Application',
                    type: STEP_TYPES.EXTERNAL,
                    instructions: 'Create a new Spotify Application in the Developer Dashboard',
                    completed: false,
                    url: 'https://developer.spotify.com/dashboard',
                },
                client_id: {
                    type: STEP_TYPES.SETTING,
                    id: 'client_id',
                    label: 'Get Client ID',
                    instructions: 'Copy the Client ID from your Spotify Application',
                    completed: false,
                    strict: true,
                    setting: { id: SpotifySettingIDs.CLIENT_ID }
                },
                client_secret: {
                    type: STEP_TYPES.SETTING,
                    id: 'client_secret',
                    label: 'Get Client Secret',
                    instructions: 'Copy the Client Secret from your Spotify Application',
                    completed: false,
                    strict: true,
                    setting: { id: SpotifySettingIDs.CLIENT_SECRET }
                },
                setup_redirect: {
                    type: STEP_TYPES.SETTING,
                    id: 'redirect_uri',
                    label: 'Setup Redirect URI',
                    instructions: 'Set the Redirect URI to deskthing://a?app=spotify in your Spotify Application settings',
                    completed: false,
                    strict: true,
                    setting: { id: SpotifySettingIDs.REDIRECT_URI }
                },
                finish_auth: {
                    type: STEP_TYPES.EXTERNAL,
                    id: 'finish_auth',
                    label: 'Finish Setup',
                    instructions: 'Complete the Spotify authentication process in the popup window.',
                    completed: false,
                }
            }
        }
    })
}

const handleStepUpdate = (step: Step) => {}
const handleTaskUpdate = (task: Task) => {}

DeskThing.on(DESKTHING_EVENTS.TASKS, (taskData) => {
    switch (taskData.request) {
        case 'step':
            handleStepUpdate(taskData.payload)
            break
        case 'task':
            handleTaskUpdate(taskData.payload)
            break
        case 'update':
            // Do nothing
            break
    }
})
