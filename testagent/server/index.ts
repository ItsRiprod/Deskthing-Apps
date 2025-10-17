import { DeskThing } from "@deskthing/server";
import { DESKTHING_EVENTS, SETTING_TYPES } from "@deskthing/types";
import { VoiceAssistant } from "./VoiceAssistant";
import { initSettings } from "./deskthing/settings";
import { VoiceAssistantConfig } from "./types";
import { checkVersionAndNotify } from "./utils/checks";

let assistant: VoiceAssistant | null = null;

const start = async () => {
  console.log('Server Started!')

  const isUpdated = checkVersionAndNotify() // checks the current deskthing version

  if (!isUpdated) {
    console.error('Incompatible DeskThing version. Please update to the latest version to use TestAgent.');
    return;
  } else {
    console.log('DeskThing version is compatible.');
  }
  
  
  try {
    console.log('Initializing Settings...');
    const settings = await initSettings();
    
    console.log('Setting up voice assistant...');
    const config: Partial<VoiceAssistantConfig> = {}

    // check for the model
    if (settings && settings.model && settings.model.type == SETTING_TYPES.STRING) { // ensure the settings exist and the wanted setting is a string
      console.log('Using existing model setting:', settings.model)
      config.modelName = settings.model.value
    }

    // check for the context size
    if (settings && settings.contextLength && settings.contextLength.type == SETTING_TYPES.NUMBER) { // ensure the settings exist and the wanted setting is a string
      const parsed = settings.contextLength.value
      if (!isNaN(parsed) && parsed > 0) {
        config.maxHistoryLength = parsed
      }
    }

    // check for the speak responses setting
    if (settings && settings.speakResponses && settings.speakResponses.type == SETTING_TYPES.BOOLEAN) { // ensure the settings exist and the wanted setting is a string
      config.speakResponses = settings.speakResponses.value
    }

    // check the prompt settings
    if (settings && settings.prompt && settings.prompt.type == SETTING_TYPES.STRING) { // ensure the settings exist and the wanted setting is a string
      config.prompt = settings.prompt.value
    }

    assistant = VoiceAssistant.getInstance(config)
    console.log('Voice Assistant initialized with config:', assistant.getConfig())

  } catch (error) {
    console.error('Error initializing Voice Assistant:', error)
  }

};

const stop = async () => {
  // Function called when the server is stopped
  console.log('Server Stopped');
  assistant?.cleanup()
  assistant = null
};

// Main Entrypoint of the server
DeskThing.on(DESKTHING_EVENTS.START, start);

// Main exit point of the server
DeskThing.on(DESKTHING_EVENTS.STOP, stop);

DeskThing.on(DESKTHING_EVENTS.AGENT, (message) => {

  if (!assistant) {
    console.warn('VoiceAssistant not initialized yet.')
    return
  }

  switch (message.request) {
    case "binary":
      console.log('Received audio chunk of size', message.payload?.byteLength || 'No Length')
      assistant.handleAudioChunk(message.clientId, message.payload)
      break
    case 'text':
      console.log(message.payload)
      break
    case 'end':
      assistant.endRecording(message.clientId)
      // Handle end of recording if needed
      break
    case 'start':
      break
    case 'fetch': {

      const history = assistant.getHistory(message.clientId)

      if (!history || history.length === 0) {
        DeskThing.agent.sendContext([], message.clientId) // no history yet - send a clear history
        return // nothing to send
      }

      DeskThing.agent.sendContext(history, message.clientId)
      break
    }
    case 'clear':
      assistant.clearHistory(message.clientId)
      DeskThing.agent.sendContext([], message.clientId)
      break
    case 'delete': {
      const existingMessage = assistant?.deleteMessage(message.clientId, message.payload)
      if (existingMessage) { // send the new history if deletion was successful
        DeskThing.agent.sendContext(existingMessage, message.clientId)
      }
      break
    }
    default:
      console.warn(`Unknown request type: ${'request' in message ? (message as { request: string }).request : 'undefined'}`);
  }
})