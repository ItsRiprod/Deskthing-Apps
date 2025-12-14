import { ClientPluginInterface, ClientPluginMountOptions } from "@deskthing/types"


/**
 * The Client Plugin class implementing the ClientPluginInterface
 * This will be able to be run within the deskthing client and may automatically be run if configured once, depending on the configuration
 * 
 * This will be run WITHIN A WEB CONTEXT - not a node context
 */
class ClientPlugin implements ClientPluginInterface {

    install(root: HTMLElement, options?: ClientPluginMountOptions): void | Promise<void> {
        console.log("Mounting Client Plugin...", root, options);

        // Plugin logic goes here
    }

    uninstall(root?: HTMLElement): void | Promise<void> {
        console.log("Unmounting Client Plugin...", root);

        // Cleanup logic goes here
    }
}

export default new ClientPlugin()