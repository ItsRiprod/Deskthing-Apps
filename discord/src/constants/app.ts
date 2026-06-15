import manifest from "../../deskthing/manifest.json";

// Provide a strongly-typed source ID for any DeskThing actions that should
// target this app's server process. If the manifest cannot be resolved for any
// reason, fall back to the expected XL Controls identifier so the DeskThing
// backend routes actions to the correct process instead of the legacy
// `discord` app id.
export const DISCORD_APP_ID = manifest?.id ?? "discord-xl-controls";

