import { AppSettings, SETTING_TYPES } from '@deskthing/types'
import { DeskThing } from '@deskthing/server';

/**
 *
 * ----------- Settings ------------------
 *
 * The following function is used to setup the settings for the app.
 *
 * This portion of the example will walk through the way you can define and add settings and ensure they are up-to-date with existing data.
 *
 * It's usually a good idea to extract this
 *
 * @param Data - DataInterface | undefined
 */
export const setupSettings = async () => {
  // Defined the settings object. SettingsType is an interface of any setting type. This sets up the key-value pair of settings
  const Settings: AppSettings = {
    image: {
      id: 'image',
      label: "Image URL",
      description: "Enter the URL or filepath to an image",
      type: SETTING_TYPES.STRING,
      value: "",
    },
    number: {
      id: 'number',
      label: "Number Input",
      description: "Choose a number between 0 and 100",
      type: SETTING_TYPES.NUMBER,
      value: 0,
      min: 0,
      max: 100,
    },
    boolean: {
      id: 'boolean',
      label: "Toggle Switch",
      description: "Switch between true and false",
      type: SETTING_TYPES.BOOLEAN,
      value: false,
    },
    string: {
      id: 'string',
      label: "Text Input",
      description: "Enter any text value",
      type: SETTING_TYPES.STRING,
      value: "",
    },
    select: {
      id: 'select',
      label: "Theme Selector",
      description: "Choose between dark and light themes",
      type: SETTING_TYPES.SELECT,
      value: "dark",
      options: [
        { label: "Dark Theme", value: "dark" },
        { label: "Light Theme", value: "light" },
      ],
    },
    multiselect: {
      id: 'multiselect',
      label: "Multiple Options",
      description: "Select one or more options from the list",
      type: SETTING_TYPES.MULTISELECT,
      value: ["option1", "option2"],
      options: [
        { label: "Option1", value: "option1" },
        { label: "Option2", value: "option2" },
        { label: "Option3", value: "option3" },
        { label: "Option4", value: "option4" },
      ],
    },
    list: {
      id: 'list',
      label: "Settings List",
      description: "Select multiple items from the list",
      type: SETTING_TYPES.LIST,
      value: ["item1", "item2"],
      options: [
        { label: "Item1", value: "item1" },
        { label: "Item2", value: "item2" },
        { label: "Item3", value: "item3" },
        { label: "Item4", value: "item4" },
      ],
    },
    ranked: {
      id: 'ranked',
      label: "Ranked Options",
      description: "Rank the options from best to worst",
      type: SETTING_TYPES.RANKED,
      value: ["option1", "option2"],
      options: [
        { label: "Option1", value: "option1" },
        { label: "Option2", value: "option2" },
        { label: "Option3", value: "option3" },
        { label: "Option4", value: "option4" },
      ],
    },
    range: {
      id: 'range',
      label: "Range Slider",
      description: "Adjust the value using the slider",
      type: SETTING_TYPES.RANGE,
      value: 50,
      min: 0,
      max: 100,
    },
    color: {
      id: 'color',
      label: "Color Selector",
      description: "Adjust the color using the color picker",
      type: SETTING_TYPES.COLOR,
      value: "white", // Will end up being a HEX code. This is just the default data
    },
  };

  // This adds the settings to the server. When the user changes a setting, the 'DESKTHING_EVENTS.SETTINGS' callback is triggered
  DeskThing.initSettings(Settings);
};
