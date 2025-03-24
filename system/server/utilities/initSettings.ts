import { DeskThing } from "@deskthing/server";
import { AppSettings, ServerEvent, SETTING_TYPES } from "@deskthing/types";
import { SystemDataKeys } from "@shared/types/"

export const initSettings = async () => {

  const availableStats: SystemDataKeys = [
    "cpu",
    "gpu",
    "ram",
    "network",
    "processes",
  ];

  const settings: AppSettings = {
    view: {
      label: "System View",
      type: SETTING_TYPES.SELECT,
      description: "Choose the GUI you want",
      value: "gpu",
      options: [
        { label: "Default View", value: "default" },
        { label: "GPU Centered", value: "gpu" },
      ],
    },
    include_stats: {
      label: "Included Stats",
      type: SETTING_TYPES.MULTISELECT,
      description: "Choose the GUI you want",
      value: availableStats,
      placeholder: "Select Stats",
      options: availableStats.map((stat) => ({
        label: stat.charAt(0).toUpperCase() + stat.slice(1),
        value: stat,
      })),
    },
    update_interval: {
      label: "Update Interval",
      type: SETTING_TYPES.NUMBER,
      description: "The rate at which data updates (in seconds)",
      value: 1,
      min: 1,
      max: 15,
    },
  };

  DeskThing.addSettings(settings);
};