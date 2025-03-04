import { STEP_TYPES, TaskList } from '@deskthing/types';

export const taskList: TaskList = {
    settingTask: {
        id: "settingTask",
        version: "1.0.0",
        completed: false,
        label: "Example Task",
        started: false,
        available: true,
        description: "This is an example task",
        steps: {
            step1: {
                id: "step1",
                type: STEP_TYPES.STEP,
                label: "Basic Step",
                instructions: "This is a basic step",
                completed: false
            },
            step2: {
                id: "step2",
                type: STEP_TYPES.ACTION,
                label: "Action Step",
                completed: false,
                strict: true,
                action: 'testAction'
            },
            step3: {
                id: "step3",
                type: STEP_TYPES.ACTION,
                label: "Action Values Step",
                completed: false,
                strict: true,
                action: { id: "example-action", version: '0.0.0', version_code: 0, icon: 'WandIcon', value: 'Option1', value_options: ['Option1', 'Option2', 'Option3', 'Option4'], value_instructions: 'Set the preset to one of the options', name: 'Example Action', enabled: true }
            },
            step4: {
                id: "step4",
                type: STEP_TYPES.SHORTCUT,
                label: "Shortcut Step",
                completed: false,
                destination: "developer/logs"
            },
            step5: {
                id: "step5",
                type: STEP_TYPES.SETTING,
                label: "Setting Step",
                completed: false,
                setting: "multiselect" // the ID of a setting in ./settings.ts
            },
            step6: {
                id: "step6",
                type: STEP_TYPES.SETTING,
                label: "Setting Step",
                completed: false,
                setting: { type: 'color', value: '#000000', label: 'Color', description: 'Select a color' }
            },
            step7: {
                id: "step7",
                type: STEP_TYPES.TASK,
                label: "Task Step",
                completed: false,
                strict: true,
                taskId: "settingDependantTask"
            },
            step8: {
                id: "step8",
                type: STEP_TYPES.EXTERNAL,
                label: "External Step",
                completed: false,
                url: "https://example.com"
            }
        }
    },
    colorTask: {
        id: "colorTask",
        version: "1.0.0",
        completed: false,
        label: "Color Task",
        started: false,
        available: true,
        description: "A task that lets you set a color",
        steps: {
            step6: {
                id: "step6",
                type: STEP_TYPES.SETTING,
                label: "Setting Step",
                completed: false,
                setting: { type: 'color', value: '#000000', label: 'Color', description: 'Select a color' }
            },
        }
    },
    settingDependantTask: {
        id: "settingDependantTask",
        version: "1.0.0",
        completed: false,
        available: true,
        label: "Settings Dependant Task",
        started: false,
        description: "This task is required by another task to complete",
        steps: {
            completion: {
                id: "completion",
                type: STEP_TYPES.EXTERNAL,
                label: "Completionist",
                instructions: "Complete this step to move on",
                completed: false
            },
       }
    }
}