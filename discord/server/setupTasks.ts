import { DeskThing } from "@deskthing/server"
import { ServerEvent, SETTING_TYPES, Step, STEP_TYPES, Task } from "@deskthing/types"
import { AppSettingIDs } from "./discord/types/deskthingTypes"

export const setupTasks = () => {
    DeskThing.tasks.initTasks({
        discord_info: {
            id: 'discord_info',
            label: "Discord Setup",
            description: 'Get Discord info',
            version: "0.10.4",
            available: true,
            completed: false,
            started: false,
            steps: {
                create_app: {
                    id: 'create_client',
                    label: 'Create Client',
                    type: STEP_TYPES.EXTERNAL,
                    instructions: 'Create a new Discord Application in the Developer Portal',
                    completed: false,
                    url: 'https://discord.com/developers/applications',
                },
                client_id: {
                    type: STEP_TYPES.SETTING,
                    id: 'client_id',
                    label: 'Get Client ID',
                    instructions: 'Under the OAuth tab, copy the Client ID for the Discord Application',
                    completed: false,
                    strict: true,
                    setting: AppSettingIDs.CLIENT_ID
                },
                client_secret: {
                    type: STEP_TYPES.SETTING,
                    id: 'client_secret',
                    label: 'Get Client Secret',
                    instructions: 'Under the OAuth tab, copy the Client Secret for the Discord Application. You may have to regenerate the secret.',
                    completed: false,
                    strict: true,
                    setting: AppSettingIDs.CLIENT_SECRET
                },
                ensure_discord_open: {
                    type: STEP_TYPES.STEP,
                    id: 'ensure_discord_open',
                    label: 'Discord is Open',
                    instructions: 'Ensure that Discord is open before continuing',
                    completed: false,
                },
                finish_auth: {
                    type: STEP_TYPES.EXTERNAL,
                    id: 'finish_auth',
                    label: 'Finish Setup',
                    instructions: 'Complete the popup on Discord to finish the authentication process.',
                    completed: false,
                }

            }
        },
        rich_presence: {
            id: 'rich_presence',
            label: "Rich Presence",
            description: 'Enable Discord Rich Presence',
            version: "0.10.4",
            available: true,
            completed: false,
            started: false,
            steps: {
                enable_rich_presence: {
                    type: STEP_TYPES.EXTERNAL,
                    id: 'enable_rich_presence',
                    label: 'Enable Rich Presence',
                    instructions: 'Enable Rich Presence in the Discord Developer Portal',
                    completed: false,
                    url: 'https://discord.com/developers/applications',
                },
                set_main_text: {
                    type: STEP_TYPES.SETTING,
                    id: 'set_main_text',
                    label: 'Set Main Text',
                    instructions: 'Set the main text for the Rich Presence',
                    completed: false,
                    strict: true,
                    setting: AppSettingIDs.SET_MAIN_TEXT
                },
                set_secondary_text: {
                    type: STEP_TYPES.SETTING,
                    id: 'set_secondary_text',
                    label: 'Set Secondary Text',
                    instructions: 'Set the secondary text for the Rich Presence',
                    completed: false,
                    strict: true,
                    setting: AppSettingIDs.SET_SECONDARY_TEXT
                },
                have_timer: {
                    type: STEP_TYPES.SETTING,
                    id: 'have_timer',
                    label: 'Have Timer',
                    instructions: 'Have a timer running?',
                    completed: false,
                    strict: true,
                    setting: AppSettingIDs.HAVE_TIMER
                }
            }
        }
    })
}

const handleStepUpdate = (step: Step) => {}
const handleTaskUpdate = (task: Task) => {}

DeskThing.on(ServerEvent.TASKS, (taskData) => {
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