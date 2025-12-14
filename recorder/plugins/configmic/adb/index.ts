import { ADBPluginDetails, ADBPluginInterface } from "@deskthing/types";
import {
  install,
  uninstall,
  InstallConfig,
  InstallLogger,
} from "@deskthing/microphone/utils";

const logger: InstallLogger = (message, error, code) => {
  console.log(`[ADB Plugin] ${message}`);
  if (error) {
    console.error(`[ADB Plugin] Error:`, error, code);
  }
};

/**
 * The ADB Plugin class implementing the ADBPluginInterface
 * This will be able to be run within the deskthing server GUI and may automatically be run if configured once, depending on the configuration
 */
class ADBPlugin implements ADBPluginInterface {
  public async install(details: ADBPluginDetails): Promise<void> {
    console.log(`Installing ADB Plugin for ${details.adbId}...`);

    const config: InstallConfig = {
      clientId: details.adbId,
    };

    try {
      await install(config, logger);
    } catch (error) {
      console.error(
        `Error during ADB Plugin installation for ${details.adbId}:`,
        error
      );
      throw error;
    }
    // include the configuration / setup logic here
  }

  public async uninstall(details: ADBPluginDetails): Promise<void> {
    console.log(`Uninstalling ADB Plugin for ${details.adbId}...`);
    const config: InstallConfig = {
      clientId: details.adbId,
    };

    try {
      await uninstall(config, logger);
    } catch (error) {
      console.error(
        `Error during ADB Plugin uninstallation for ${details.adbId}:`,
        error
      );
      throw error;
    }
    // include any cleanup logic here if necessary
  }
}

export default new ADBPlugin();
