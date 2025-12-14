import { ServerPluginInterface } from "@deskthing/types";

class ServerPlugin implements ServerPluginInterface {
    public async install(): Promise<void> {
        console.log("Installing Server Plugin...");
    }
    public async uninstall(): Promise<void> {
        console.log("Installing Server Plugin...");
    }
    // Server plugin logic goes here
}

export default new ServerPlugin();