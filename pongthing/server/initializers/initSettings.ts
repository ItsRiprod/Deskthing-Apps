import { createDeskThing } from "@deskthing/server"
import { SETTING_TYPES } from "@deskthing/types"
import { FromClientToServer, FromServerToClient } from "../../shared/types/transit"

const DeskThing = createDeskThing<FromClientToServer, FromServerToClient>()


export const initSettings = async () => {
  // initialize information
  DeskThing.initSettings({
    settingOpt1: {
      id: 'settingOpt1',
      label: 'Random Setting Toggle',
      type: SETTING_TYPES.BOOLEAN,
      value: false
    }
  })
}