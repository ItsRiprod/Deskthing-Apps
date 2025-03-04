import { Action, EventMode, ServerEvent } from '@deskthing/types'
import { DeskThing } from '@deskthing/server'

export const setupActions = () => {
    const Action: Action = {
        id: "testAction",
        name: "Example Action",
        icon: "WandIcon",
        enabled: true,
        version: "1.0.0",
        description: "This is an example action",
        version_code: 1,
        value: "Option1",
        value_options: ['Option1', 'Option2', 'Option3', 'Option4'],
        value_instructions: 'Set the preset to one of the options'
    }

    // Adding a button
    DeskThing.registerKeyObject({
      id: 'settingKey',
      description: 'An example button to mess around with',
      version: '0.10.0',
      version_code: 10,
      modes: [EventMode.KeyDown, EventMode.PressShort],
    })
    
    DeskThing.registerAction({
      id: 'settingAction',
      description: 'An example button to mess around with',
      version: '0.10.0',
      version_code: 10,
      enabled: true
    })

    DeskThing.registerAction(Action)
}

DeskThing.on(ServerEvent.ACTION, (data) => {
    switch (data.payload.id) {
        case 'settingAction':
            DeskThing.sendLog('Action settingAction was pressed!')
            if (data.payload.icon == 'WandIcon') {
                DeskThing.updateIcon('settingIcon', 'WandIcon2')
            } else {
                DeskThing.updateIcon('settingIcon', 'WantIcon')
            }
            break
    }
})