import { ADBPluginDetails, ADBPluginInterface } from "@deskthing/types";

/**
 * The ADB Plugin class implementing the ADBPluginInterface
 * This will be able to be run within the deskthing server GUI and may automatically be run if configured once, depending on the configuration
 */
class ADBPlugin implements ADBPluginInterface {
  public async install(details: ADBPluginDetails): Promise<void> {
    console.log(`Installing ADB Plugin for ${details.adbId}...`);
    for (let i = 0; i <= 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log(`Mockup Uninstall Progress: ${i * 10}%`);
    }

    console.log(`ADB Plugin for ${details.adbId} installed successfully.`);
    // include the configuration / setup logic here
  }

  public async uninstall(details: ADBPluginDetails): Promise<void> {
    console.log(`Uninstalling ADB Plugin for ${details.adbId}...`);

    for (let i = 0; i <= 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log(`Mockup Uninstall Progress: ${i * 10}%`);
    }

    console.log(`ADB Plugin for ${details.adbId} uninstalled successfully.`);
    // include any cleanup logic here if necessary
  }
}

export default new ADBPlugin();
