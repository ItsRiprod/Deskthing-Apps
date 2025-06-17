import { DESKTHING_EVENTS, SETTING_TYPES, STEP_TYPES } from "@deskthing/types";
import { DeskThing } from "@deskthing/server";
import { taskList } from "./taskList";

export const setupTasks = () => {
  // Initialize the tasks
  console.debug("Setting up tasks");
  DeskThing.tasks.initTasks(taskList);
};

DeskThing.on(DESKTHING_EVENTS.TASKS, (data) => {
  switch (data.request) {
    case "task":
      // A single task's update
      console.debug("Task Updated" + data.payload.id);
      break;
    case "update":
      // All of the registered tasks
      console.debug("Tasks Updated");
      break;
    case "step":
      // A single step updated
      console.debug("Step Updated" + data.payload.id);
      if (data.payload.type == STEP_TYPES.SETTING) {
        console.debug("Step's Color updated to be " + data.payload.id);
        if (
          "type" in data.payload.setting &&
          data.payload.setting.type == SETTING_TYPES.COLOR
        )
          DeskThing.send({
            type: "color",
            payload: data.payload.setting.value,
          });
      }
      break;
  }
});
