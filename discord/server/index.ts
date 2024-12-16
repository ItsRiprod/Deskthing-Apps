import DiscordHandler from "./discord";
import { DeskThing as DK, SocketData } from "deskthing-server";
const DeskThingServer = DK.getInstance();
export { DeskThingServer as DeskThing };

let discord: DiscordHandler;

const main = async () => {
  // Set Data object and ensure it is up-to-date
  let data = await DeskThingServer.getData();
  DeskThingServer.on("data", (newData) => {
    data = newData;
    DeskThingServer.sendLog("Data object has been updated");
  });

  // Initialize settings
  if (
    !data?.settings?.auto_switch_view ||
    !data.settings?.notifications ||
    !data.settings?.activity
  ) {
    DeskThingServer.addSettings({
      auto_switch_view: {
        label: "Auto Switch View",
        type: "boolean",
        value: true,
      },
      notifications: {
        label: "Show Notifications",
        type: "boolean",
        value: true,
      },
      activity: {
        label: "Display Activity",
        type: "boolean",
        value: true,
      },
    });
  }
  // Check if data exists
  if (!data?.client_id || !data?.client_secret) {
    const requestScopes = {
      client_id: {
        value: "",
        label: "Discord Client ID",
        instructions:
          'You can get your Discord Client ID from the <a href="https://discord.com/developers/applications" target="_blank" style="color: lightblue;">Discord Application Dashboard</a>. You must create a new discord bot and then under OAuth2 find CLIENT ID - Copy and paste that into this field.',
      },
      client_secret: {
        value: "",
        label: "Discord Client Secret",
        instructions:
          'You can get your Spotify Client Secret from the <a href="https://discord.com/developers/applications" target="_blank" style="color: lightblue;">Discord Application Dashboard</a>. You must create a new application and then under OAuth2 click "Reveal Secret" or "Reset Secret" and copy-paste that here in this field.',
      },
      redirect_url: {
        label: "Discord Redirect URI",
        value: "http://localhost:8888/callback/discord",
        instructions:
          'Set the Discord Redirect URI to http://localhost:8888/callback/discord and then click "Save".\n This ensures you can authenticate your account to this application',
      },
    };

    DeskThingServer.getUserInput(requestScopes, async (data) => {
      console.log("Data Response", data.payload);
      if (data.payload.client_id && data.payload.client_secret) {
        DeskThingServer.saveData(data.payload);
        discord = new DiscordHandler(DeskThingServer);
        await discord.registerRPC();
      } else {
        DeskThingServer.sendError(
          "Please fill out all the fields! Restart Discord to try again"
        );
      }
    });
  } else {
    discord = new DiscordHandler(DeskThingServer);
    await discord.registerRPC();
  }

  DeskThingServer.on("set", handleSet);
  DeskThingServer.on("get", handleGet);

  DeskThingServer.sendLog("Discord app started successfully.");
};

const handleSet = (data: SocketData) => {
  if (!data.request) {
    DeskThingServer.sendError("No request provided in 'set' data.");
    return;
  }

  switch (data.request) {
    case "hangup":
      discord.leaveCall();
      break;
    case "mic":
      discord.setVoiceSetting({ mute: data.payload || false });
      break;
    case "deafened":
      discord.setVoiceSetting({ deaf: data.payload || false });
      break;
    default:
      DeskThingServer.sendError(`Unhandled 'set' request: ${data.request}`);
      break;
  }
};

const handleGet = (data: SocketData) => {
  // if (data.app !== "discord") {
  //   // Ignore data not intended for the discord app
  //   return;
  // }

  if (!data.request) {
    DeskThingServer.sendError("No request provided in 'get' data.");
    return;
  }

  if (data.request == "refresh_call") {
    DeskThingServer.sendLog("Sending requested call data to clients");
    discord.refreshCallData();
  } else {
    DeskThingServer.sendError(`Unhandled 'get' request: ${data.request}`);
  }
};

// Start the DeskThing
DeskThingServer.on("start", main);

DeskThingServer.on("stop", () => {
  console.log("Stopping DeskThing");
  if (discord) {
    discord.unsubscribe();
  }
});
