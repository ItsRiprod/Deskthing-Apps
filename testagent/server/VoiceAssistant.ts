// Voice Assistant Orchestrator
// Top-level class that manages state and coordinates all domains

import * as path from 'path'
import { AGENT_MESSAGE_TYPES, type AgentMessage } from "@deskthing/types"
import { DeskThing } from "@deskthing/server"
import { AudioProcessor } from './agent/AudioProcessor'
import { SpeechToText } from './agent/SpeechToText'
import { OllamaLLM } from './agent/OllamaLLM'
import type { AgentHistory, AudioFormat, VoiceAssistantConfig } from './types'
import { TMP_DIR } from './utils/paths'
import { ToolCalling, ToolCall } from './agent/ToolCalling'

const defaultConfig: VoiceAssistantConfig = {
  maxHistoryLength: 10,
  modelName: "gemma3:1b",
  speakResponses: false,
  prompt: 'You are a desk-side support assistant. Help the user with their tasks in a friendly and efficient manner. Keep responses concise and to the point. Avoid use of markdown formatting. The user input is done via speech recognition, so may contain errors. Do your best to interpret the user intent and provide a helpful response.'
}

export class VoiceAssistant {
  private config: VoiceAssistantConfig
  private audioProcessor: AudioProcessor
  private speechToText: SpeechToText
  private conversationLLM: OllamaLLM

  private static instance: VoiceAssistant | null = null;

  // Recording state
  private audioChunks: Buffer[] = []
  private isRecording = false
  private detectedFormat: AudioFormat | null = null
  private prevVolLevel = 0

  // Conversation state
  private conversationHistory: AgentHistory = {}

  private constructor(config: Partial<VoiceAssistantConfig> = {}) {
    this.config = {
      ...defaultConfig,
      ...config
    }

    // Initialize domain services
    this.audioProcessor = new AudioProcessor()
    this.speechToText = new SpeechToText("ggml-base.en.bin")
    this.conversationLLM = new OllamaLLM(this.config.modelName)
  }

  static getInstance(config?: Partial<VoiceAssistantConfig>): VoiceAssistant {
    if (!VoiceAssistant.instance) {
      VoiceAssistant.instance = new VoiceAssistant(config);
    }
    return VoiceAssistant.instance;
  }

  /**
   * Handle incoming binary audio data
   */
  handleAudioChunk(clientId: string, binary: ArrayBuffer | Buffer): void {
    const buffer = Buffer.isBuffer(binary) ? binary : Buffer.from(binary)

    // Extract PCM data and detect format
    const { pcmData, format } = this.audioProcessor.extractPCMFromWav(buffer)

    if (!pcmData) {
      this.sendError(clientId, "Received invalid audio chunk", undefined, 400)
      return
    }

    // Store format from first valid chunk
    if (format && !this.detectedFormat) {
      this.detectedFormat = format
    }

    // Start recording if not already
    if (!this.isRecording) {
      this.isRecording = true
      this.audioChunks.length = 0
      const channels = this.detectedFormat?.channels || 'unknown'
      const sampleRate = this.detectedFormat?.sampleRate || 'unknown'
      this.sendStatus(clientId, `Started recording audio (${channels} channels, ${sampleRate}Hz)...`)
    }

    // Add PCM data to buffer
    this.audioChunks.push(pcmData)
  }

  /**
   * End recording and process the conversation
   */
  async endRecording(clientId: string): Promise<void> {
    console.debug('Ending recording for client:', clientId)
    if (!this.isRecording || this.audioChunks.length === 0) {
      this.sendStatus(clientId, "No active recording to end.")
      return
    }

    try {
      // Concatenate all audio chunks
      const audioData = Buffer.concat(this.audioChunks)

      if (!this.detectedFormat) {
        throw new Error("No audio format detected")
      }

      // Prepare file paths
      const timestamp = Date.now()
      const tempFilePath = path.join(TMP_DIR, `recording_${timestamp}.wav`)
      const resampledPath = path.join(TMP_DIR, `recording_${timestamp}_16k.wav`)

      // Ensure temp directory exists
      this.audioProcessor.ensureTempDir(TMP_DIR)

      // Save original audio
      this.audioProcessor.saveAsWav(audioData, this.detectedFormat, tempFilePath)

      const { channels, sampleRate } = this.detectedFormat
      this.sendStatus(clientId, `Processing your request... (${channels} channels, ${sampleRate}Hz → 16kHz)`)

      // Resample for Whisper
      await this.audioProcessor.resampleTo16kHz(tempFilePath, resampledPath)

      this.sendStatus(clientId, `Transcribing...`)
      // Transcribe
      const transcript = await this.speechToText.transcribe(resampledPath)

      // Clean up temp files
      this.audioProcessor.cleanupFiles([tempFilePath, resampledPath])

      // Reset recording state
      this.resetRecording()

      if (transcript.trim()) {
        this.sendStatus(clientId, `Generating Response...`)
        await this.handleConversation(transcript, clientId)
      } else {
        this.sendError(clientId, "I couldn't understand what you said. Please try again.", undefined, 400)
      }

    } catch (error) {
      console.error('Error in endRecording:', error)
      this.sendError(clientId, "Sorry, I encountered an error processing your request.", error instanceof Error ? error.message : String(error), 500)
      this.resetRecording()
    }
  }

  /**
   * Handle the conversation flow
   */
  private async handleConversation(transcript: string, clientId: string): Promise<void> {
    if (!transcript.trim()) {
      this.sendError(clientId, "No valid transcript provided.", `Unable to find a valid transcript. Got a transcript with length ${transcript.length}`, 404)
      return
    }

    try {
      // Add user message to conversation history
      const userMessage = this.addUserMessage(transcript, clientId)
      this.sendMessage(clientId, userMessage)

      const assistantMessage = this.createAssistantMessage('', clientId)

      // Send response with empty message first to get messageId established
      this.sendMessage(clientId, assistantMessage)

      this.sendStatus(clientId, `Processing message using ${this.config.modelName}`)

      const context = this.getConversationContext(clientId)
      // Get conversation context
      let assistantResponse = ''
      let tokensReceived = 0
      const MAX_TOOL_CALLS = 5
      const toolsCalled: string[] = [];
      let toolLoopCount = 0
      let continueToolLoop = true;
      const startTime = Date.now()

      // Get LLM response

      console.log('Starting to stream LLM response...')
      while (continueToolLoop && toolLoopCount < MAX_TOOL_CALLS) {
        toolLoopCount++
        continueToolLoop = false

        assistantResponse = ''

        let toolCallsFromStream: ToolCall[] | null = null;
        await this.conversationLLM.streamResponse(context, (token, toolCalls) => {
          if (typeof token === 'string' && token.length > 0) {
            assistantResponse += token;
            tokensReceived++;
            const cleaned = ToolCalling.stripToolCallsJson ? ToolCalling.stripToolCallsJson(token) : token;
            if (cleaned) {
              DeskThing.agent.sendCommand('token', { clientId, messageId: assistantMessage.messageId, token: cleaned });
            }
            if (tokensReceived % 5 === 0) {
              this.sendStatus(clientId, `Receiving response... ${tokensReceived} Chunks`)
            }
          }
          // If tool_calls are present, parse and store for this loop
          if (toolCalls && Array.isArray(toolCalls)) {
            toolCallsFromStream = toolCalls.map((call) => ({
              name: call.function?.name || call.name,
              arguments: call.function?.arguments || call.arguments || {}
            }));
          }
        });

        const toolCalls = toolCallsFromStream || ToolCalling.analyzeForToolCalls(assistantResponse);

        if (toolCalls) {
          this.sendStatus(clientId, `Calling tools: ${toolCalls.map(t => t.name).join(', ')}`)
          const toolResults = await ToolCalling.executeTools(toolCalls)

          if (!toolResults || toolResults.length === 0) {
            this.sendError(clientId, "Tool execution failed.", "No valid tool result returned.", 500)
            continueToolLoop = false
            continue
          }

          for (const toolResult of toolResults) {
            toolsCalled.push(toolResult.name)
            const toolResultMsg: AgentMessage = {
              role: `tool`,
              message: `${toolResult.name} was already called with result: ${toolResult.result}`,
              type: AGENT_MESSAGE_TYPES.TEXT,
              source: 'voice-assistant',
              version: 'placeholder',
              timestamp: Date.now(),
              clientId,
              messageId: `${clientId}-tool-${Date.now()}`
            }
            context.push(toolResultMsg)
          }
          continueToolLoop = true
        } else {
          console.log('No tool calls detected in the response.')
          continueToolLoop = false
        }
      }

      assistantMessage.message = assistantResponse

      console.log(`LLM response complete. Tokens received: ${tokensReceived}. Loops: ${toolLoopCount}. Tool calls made: ${toolsCalled.join(', ') || 'None'}`)

      const totalTime = (Date.now() - startTime) / 1000
      this.sendStatus(clientId, `LLM response completed in ${totalTime.toFixed(2)} seconds with ${tokensReceived} tokens.`)
      // Add assistant response to history
      this.addAssistantMessage(assistantMessage, clientId)


    } catch (error) {
      console.error('Error in conversation:', error)
      this.sendError(clientId, "I'm sorry, I'm having trouble connecting to my language model right now.", error instanceof Error ? error.message : 'Unknown error', 500)
    }
  }

  /**
   * Add user message to conversation history
   */
  private addUserMessage(message: string, clientId: string): AgentMessage {
    if (!this.conversationHistory[clientId]) {
      this.conversationHistory[clientId] = []
    }
    // Fill in AgentMessage fields for user message
    const userMessage: AgentMessage = {
      source: "voice-assistant", // will get overridden when sent
      version: 'placeholder',
      timestamp: Date.now(),
      role: "user",
      clientId,
      messageId: `${clientId}-${crypto.randomUUID()}`,
      type: AGENT_MESSAGE_TYPES.TEXT,
      message
    }

    this.conversationHistory[clientId].push(userMessage)
    this.trimConversationHistory(clientId)

    return userMessage
  }

  private createAssistantMessage(message: string, clientId: string): AgentMessage {
    const assistantMessage: AgentMessage = {
      source: "voice-assistant", // will get overridden when sent
      version: 'placeholder',
      timestamp: Date.now(),
      role: "assistant",
      clientId,
      messageId: `${clientId}-${crypto.randomUUID()}`,
      type: AGENT_MESSAGE_TYPES.TEXT,
      message
    }
    return assistantMessage
  }

  /**
   * Add assistant message to conversation history
   */
  private addAssistantMessage(assistantMessage: AgentMessage, clientId: string): AgentMessage {
    if (!this.conversationHistory[clientId]) {
      this.conversationHistory[clientId] = []
    }

    this.conversationHistory[clientId].push(assistantMessage)
    this.trimConversationHistory(clientId)

    return assistantMessage
  }

  /**
   * Get conversation context with system prompt
   */
  private getConversationContext(clientId: string): AgentMessage[] {

    const message = `'''SYSTEM ${this.config.prompt}'''`

    const systemPrompt: AgentMessage = {
      role: 'system',
      version: 'placeholder',
      timestamp: Date.now(),
      type: AGENT_MESSAGE_TYPES.TEXT,
      source: "voice-assistant", // will get overridden when sent
      messageId: `${clientId}-system-${Date.now()}`,
      message: message
    }

    return [systemPrompt, ...this.conversationHistory[clientId]]
  }

  /**
   * Trim conversation history to max length
   */
  private trimConversationHistory(clientId: string): void {
    const maxMessages = this.config.maxHistoryLength * 2 // user + assistant pairs
    if (this.conversationHistory[clientId].length > maxMessages) {
      this.conversationHistory[clientId].splice(0, 2) // Remove oldest user+assistant pair
    }
  }

  /**
   * Reset recording state
   */
  private resetRecording(): void {
    this.audioChunks.length = 0
    this.isRecording = false
    this.detectedFormat = null
    this.prevVolLevel = 0
  }

  /**
   * Send message to client
   */
  private sendMessage(clientId: string, agentMessage: AgentMessage): void {
    DeskThing.agent.sendResponse(agentMessage, clientId)
  }

  private sendError(clientId: string, message: string, error?: string, code?: number): void {
    const errorMessage: AgentMessage = {
      source: "voice-assistant", // will get overridden when sent
      version: 'placeholder',
      timestamp: Date.now(),
      role: "system",
      clientId,
      messageId: `${clientId}-${Date.now()}`,
      type: AGENT_MESSAGE_TYPES.ERROR,
      message,
      error,
      code
    }
    DeskThing.agent.sendResponse(errorMessage, clientId)
  }

  private sendStatus(clientId: string, status: string): void {
    const statusMessage: AgentMessage = {
      source: "voice-assistant", // will get overridden when sent
      version: 'placeholder',
      timestamp: Date.now(),
      role: "system",
      clientId,
      messageId: `${clientId}-${Date.now()}`,
      type: AGENT_MESSAGE_TYPES.STATUS,
      message: status
    }
    DeskThing.agent.sendResponse(statusMessage, clientId)
  }

  clearHistory(clientId: string): void {
    this.conversationHistory[clientId] = []
    this.sendStatus(clientId, "Conversation history cleared.")
  }

  deleteMessage(clientId: string, messageId: string): AgentMessage[] | void {
    if (!this.conversationHistory[clientId]) {
      this.sendError(clientId, "No conversation history found to delete message from.", undefined, 404)
      return
    }

    const messages = this.conversationHistory[clientId]
    const index = messages.findIndex(msg => msg.messageId === messageId)
    if (index === -1) {
      this.sendError(clientId, `Message with ID ${messageId} not found.`, undefined, 404)
      return
    }

    // Remove all messages up to and including the found index
    this.conversationHistory[clientId] = messages.slice(index + 1)
    this.sendStatus(clientId, `Deleted message with ID ${messageId} and all previous messages.`)

    return this.conversationHistory[clientId]
  }

  getHistory(clientId: string): AgentMessage[] {
    return this.conversationHistory[clientId] || []
  }

  downloadModel(modelName: string): void {
    this.conversationLLM.downloadModel(modelName)
  }

  /**
   * Get current configuration
   */
  getConfig(): VoiceAssistantConfig {
    return { ...this.config }
  }

  /**
   * Cleans up resources when the assistant is no longer needed
   */
  cleanup(): void {
    this.audioChunks.length = 0
    this.isRecording = false
    this.detectedFormat = null
    this.prevVolLevel = 0
    this.conversationHistory = {}
    this.conversationLLM.cleanup()
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<VoiceAssistantConfig>): void {
    this.config = { ...this.config, ...updates }

    // Update domain services if needed
    if (updates.modelName) {
      this.conversationLLM.setModel(this.config.modelName)
    }
  }

}