// setup deskthing settings for configuration

import { DeskThing } from "@deskthing/server";
import { APP_REQUESTS, AppSettings, DESKTHING_EVENTS, SETTING_TYPES, SettingsType } from "@deskthing/types";
import { getOllamaModels } from "../utils/ollama";
import { VoiceAssistant } from "../VoiceAssistant";
import { VoiceAssistantConfig } from "../types";

export const initSettings = async (): Promise<AppSettings> => {

  const availableLLMS = await getOllamaModels()


  // always init settings to ensure they exist
  const settings: AppSettings = {
    model: {
      version: '0.11.0',
      id: 'model',
      type: SETTING_TYPES.SELECT,
      label: 'LLM Model',
      description: 'WARNING: Research models. Some take more storage and RAM than others. Choose wiseley! Find available models at https://ollama.com/library/',
      value: 'qwen3:4b',
      options: [
        ...availableLLMS.map(m => ({ label: m, value: m.toLowerCase() }))
      ]
    },
    newModel: {
      id: 'newModel',
      type: SETTING_TYPES.STRING,
      label: 'LLM Model',
      description: 'Save settings to begin download of new model',
      value: ''
    },
    contextLength: {
      id: 'contextLength',
      type: SETTING_TYPES.STRING,
      label: 'Message Context Length',
      description: 'How far back in the conversation history the assistant should consider when generating responses. Default is 10.',
      value: '10'
    },
    speakResponses: {
      version: '0.11.0',
      id: 'speakResponses',
      type: SETTING_TYPES.BOOLEAN,
      label: 'Speak Responses (Pending Implementation)',
      description: 'Whether the assistant should speak its responses aloud.',
      value: false
    },
    prompt: {
      version: '0.11.0',
      id: 'prompt',
      type: SETTING_TYPES.STRING,
      label: 'Prompt',
      description: 'The prompt to use for the assistant. This will be appended to every message.',
      value: 'You are a desk-side support assistant. Help the user with their tasks in a friendly and efficient manner. Keep responses concise and to the point. Avoid use of markdown formatting. The user input is done via speech recognition, so may contain errors. Do your best to interpret the user intent and provide a helpful response.'
    }
  };

  await DeskThing.settings.init(settings);

  // then get the settings - these have been merged with the existing settings if any
  const existingSettingsPromise = DeskThing.once(DESKTHING_EVENTS.SETTINGS);

  // send a manual fetch request in case the event was before we set up the listener
  DeskThing.fetch({ type: APP_REQUESTS.SETTINGS, request: 'get' })

  const existingSettings = await existingSettingsPromise

  return existingSettings.payload;
}

const handleNewModel = async (newModel: SettingsType, model: SettingsType, currentModel: string) => {
  if (!newModel || newModel.type !== SETTING_TYPES.STRING || !model || model.type !== SETTING_TYPES.SELECT) {
    return // newModel is not valid
  }

  const newModelValue = newModel?.value?.trim();

  if (!newModelValue || newModelValue.length == 0) {
    console.log('No new model specified or it is the same as the current model.');
    return
  }

  if (newModelValue == currentModel) {
    console.log(`Model "${newModelValue}" is already the current model.`);
    await DeskThing.settings.setValue('newModel', '');
    return
  }

  // 3. Check if the newModel is already an available option
  const existingOptions = (model?.options || []).map(o => o.value.toLowerCase());
  const isAlreadyOption = existingOptions.includes(newModelValue.toLowerCase());

  // 4. Use getOllamaModels to get the source of truth list of models
  const availableLLMS = await getOllamaModels();
  const isInOllamaList = availableLLMS.map(m => m.toLowerCase()).includes(newModelValue.toLowerCase());

  if (!isAlreadyOption && !isInOllamaList) {
    // Add new model to options
    const newOptions = [
      ...availableLLMS.map(m => ({ label: m, value: m.toLowerCase() }))
    ];
    DeskThing.settings.setOptions('model', newOptions);
    console.log(`Added new model "${newModelValue}" to options.`);
  } else if (!isInOllamaList) {
    console.log(`Model "${newModelValue}" was found in Ollama models.`);
  } else {
    console.log(`Model "${newModelValue}" is already an option.`);
  }

  // 5. Update the 'newModel' setting so the value is blank again
  await DeskThing.settings.setValue('newModel', '');

  // Optionally, trigger model download if needed
  if (!isInOllamaList) {
    const voiceAssistant = VoiceAssistant.getInstance()

    await voiceAssistant.downloadModel(newModelValue);
  }
}

const handleModelChange = async (model: SettingsType, currentModel: string): Promise<string | undefined> => {
  if (!model || model.type !== SETTING_TYPES.SELECT) {
    return // model is not valid
  }

  const selectedModel = model.value
  if (selectedModel === currentModel) {
    console.log(`LLM model is already set to ${selectedModel}.`);
    return
  }

  console.log(`Switching LLM model from ${currentModel} to ${selectedModel}`);
  return selectedModel
}


DeskThing.on(DESKTHING_EVENTS.SETTINGS, async (settingsData) => {
  // settings have been updated

  console.log('Received updated settings!')

  const newSettings = settingsData.payload

  const voiceAssistant = VoiceAssistant.getInstance()

  const existingConfig = voiceAssistant.getConfig()
  const currentModel = existingConfig.modelName
  const updatedConfig: Partial<VoiceAssistantConfig> = {}

  // handle new model
  await handleNewModel(newSettings.newModel, newSettings.model, currentModel)

  // changing model from existing options
  const modelName = await handleModelChange(newSettings.model, currentModel)
  if (modelName) {
    updatedConfig.modelName = modelName
  }

  const contextLength = Number(newSettings.contextLength?.value)
  if (!isNaN(contextLength) && contextLength > 0 && contextLength !== existingConfig.maxHistoryLength) {
    console.log(`Updating context length from ${existingConfig.maxHistoryLength} to ${contextLength}`);
    updatedConfig.maxHistoryLength = contextLength
  }

  const speakResponses = newSettings.speakResponses?.value
  if (typeof speakResponses === 'boolean' && speakResponses !== existingConfig.speakResponses) {
    console.log(`Updating speak responses from ${existingConfig.speakResponses} to ${speakResponses}`);
    updatedConfig.speakResponses = speakResponses
  }

  voiceAssistant.updateConfig(updatedConfig)

})