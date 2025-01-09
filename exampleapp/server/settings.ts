import { DeskThing, DataInterface, SettingsType } from "deskthing-server";

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
export const setupSettings = async (Data: DataInterface | null) => {
    /**
     * Welcome to coding. There are maybe a hundred different ways to be able to do this. This will demonstrate one of the ways I've found 
     * 
     * This way checks if any of the settings are missing and if they are, it will create them.
     * 
     */
    const requiredSettings = [
      "image",
      "number",
      "boolean",
      "string",
      "select",
      "multiselect",
      "list",
      "ranked",
      "range",
      "color"
    ];

    // This checks if there are any settings missing
    const hasAllSettings = requiredSettings.every(
      (setting) => Data?.settings?.[setting]
    );
  
    // If any of the settings are missing, then add them
    if (!hasAllSettings) {
      // Defined the settings object. SettingsType is an interface of any setting type. This sets up the key-value pair of settings
  
      const Settings: { [key: string]: SettingsType } = {
        image: {
          label: "Image URL",
          description: "Enter the URL or filepath to an image",
          type: "string",
          value: '',
        },
        number: {
          label: "Number Input",
          description: "Choose a number between 0 and 100",
          type: "number",
          value: 0,
          min: 0,
          max: 100,
        },
        boolean: {
          label: "Toggle Switch",
          description: "Switch between true and false",
          type: "boolean",
          value: false,
        },
        string: {
          label: "Text Input",
          description: "Enter any text value",
          type: "string",
          value: "",
        },
        select: {
          label: "Theme Selector",
          description: "Choose between dark and light themes",
          type: "select",
          value: "dark",
          options: [
            { label: "Dark Theme", value: "dark" },
            { label: "Light Theme", value: "light" },
          ],
        },
        multiselect: {
          label: "Multiple Options",
          description: "Select one or more options from the list",
          type: "multiselect",
          value: ["option1", "option2"],
          options: [
            { label: "Option1", value: "option1" },
            { label: "Option2", value: "option2" },
            { label: "Option3", value: "option3" },
            { label: "Option4", value: "option4" },
          ],
        },
        list: {
          label: "Settings List",
          description: "Select multiple items from the list",
          type: "list",
          value: ["item1", "item2"],
          options: [
            { label: "Item1", value: "item1" },
            { label: "Item2", value: "item2" },
            { label: "Item3", value: "item3" },
            { label: "Item4", value: "item4" },
          ],
        },
        ranked: {
          label: "Ranked Options",
          description: "Rank the options from best to worst",
          type: "ranked",
          value: ["option1", "option2"],
          options: [
            { label: "Option1", value: "option1" },
            { label: "Option2", value: "option2" },
            { label: "Option3", value: "option3" },
            { label: "Option4", value: "option4" },
          ],
        },
        range: {
          label: "Range Slider",
          description: "Adjust the value using the slider",
          type: "range",
          value: 50,
          min: 0,
          max: 100,
        },
        color: {
          label: "Color Selector",
          description: "Adjust the color using the color picker",
          type: "color",
          value: 'black', // Will end up being a HEX code. This is just the default data
        },
      };
  
      // This adds the settings to the server. When the user changes a setting, the 'data' callback is triggered
      DeskThing.addSettings(Settings);
    }
  }