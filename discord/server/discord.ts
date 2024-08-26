
import { DeskThing } from './index';
import { DiscordRequest, InstallGlobalCommands } from './discordUtils';

interface VoiceState {
  channel_id: string | null;
  user_id: string;
  session_id: string;
  deaf: boolean;
  mute: boolean;
  self_deaf: boolean;
  self_mute: boolean;
  self_stream?: boolean;
  self_video: boolean;
  suppress: boolean;
  request_to_speaknbn_timestamp: string | null;
}

const DISCORD_APP_ID = process.env.DISCORD_APP_ID;

async function getGuildVoiceStates(guildId: string): Promise<VoiceState[]> {
  try {
    const response = await DiscordRequest(`guilds/${guildId}/voice-states`, { method: 'GET' });
    return await response.json();
  } catch (error) {
    console.error('Error fetching guild voice states:', error);
    return [];
  }
}

async function getCurrentUserVoiceState(guildId: string): Promise<VoiceState | null> {
  try {
    const response = await DiscordRequest(`guilds/${guildId}/voice-states/@me`, { method: 'GET' });
    return await response.json();
  } catch (error) {
    console.error('Error fetching current user voice state:', error);
    return null;
  }
}

async function modifyCurrentUserVoiceState(guildId: string, channelId: string, suppress?: boolean, requestToSpeakTimestamp?: string): Promise<void> {
  try {
    await DiscordRequest(`guilds/${guildId}/voice-states/@me`, {
      method: 'PATCH',
      body: {
        channel_id: channelId,
        suppress,
        request_to_speak_timestamp: requestToSpeakTimestamp,
      },
    });
  } catch (error) {
    console.error('Error modifying current user voice state:', error);
  }
}

const commands = [
  {
    name: 'voice_state',
    description: 'Get current voice state',
    type: 1,
  },
];

DeskThing.on('start', async () => {
  await InstallGlobalCommands(DISCORD_APP_ID, commands);

  DeskThing.on('interactionCreate', async (interaction) => {
    if (interaction.type === 2 && interaction.data.name === 'voice_state') {
      const guildId = interaction.guild_id;
      if (!guildId) {
        await interaction.reply('This command can only be used in a server.');
        return;
      }

      const currentUserVoiceState = await getCurrentUserVoiceState(guildId);
      if (!currentUserVoiceState) {
        await interaction.reply('Unable to fetch your current voice state.');
        return;
      }

      // Store the voice state locally
      await DeskThing.saveData({ currentVoiceState: currentUserVoiceState });

      // Send the voice state to the client
      await interaction.reply({
        content: 'Your current voice state:',
        embeds: [{
          title: 'Voice State',
          fields: Object.entries(currentUserVoiceState).map(([key, value]) => ({
            name: key,
            value: String(value),
            inline: true,
          })),
        }],
      });
    }
  });
});

DeskThing.on('stop', async () => {
  // Cleanup code if needed
});
