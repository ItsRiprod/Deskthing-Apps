// LLM Integration Domain
// Handles conversation with Ollama and function calling

import { AgentMessage } from "@deskthing/types"
import { OllamaFunctionToolResponse, ToolCall, ToolCalling } from "./ToolCalling"
import { OLLAMA_CLI } from "../utils/paths"
import { spawnSync, spawn } from "child_process"
import * as fs from "fs"
import { DeskThing } from "@deskthing/server"

const OLLAMA_API_URL = "http://localhost:11434";

export class OllamaLLM {
  private modelName: string
  private activeDownloads: Set<string> = new Set();
  private ollamaApiUrl: string

  constructor(modelName: string = "gemma3:1b", ollamaApiUrl: string = OLLAMA_API_URL) {
    this.modelName = modelName
    this.ollamaApiUrl = ollamaApiUrl
  }

  /**
   * Check if the Ollama CLI and model are installed
   */
  async isOllamaInstalled(): Promise<boolean> {
    // Check if Ollama REST API is running
    try {
      const res = await fetch(`${this.ollamaApiUrl}/api/tags`);
      if (!res.ok) throw new Error("Ollama REST API not responding");
      const data = await res.json() as { models: { name: string }[] };
      return data.models.some((m) => m.name.startsWith(this.modelName));
    } catch (_err) {
      // Try to start Ollama serve
      await this.tryStartOllamaServe();
      // Try again
      try {
        const res = await fetch(`${this.ollamaApiUrl}/api/tags`);
        if (!res.ok) throw new Error("Ollama REST API not responding");
        const data = await res.json() as { models: { name: string }[] };
        return data.models.some((m) => m.name.startsWith(this.modelName));
      } catch (err2) {
        this.notifyError("Ollama REST API not available", err2);
        return false;
      }
    }
  }

  /**
 * Try to start Ollama serve
 */
  private async tryStartOllamaServe(): Promise<void> {
    try {
      const proc = spawn(OLLAMA_CLI, ["serve"], { detached: true, stdio: "ignore" });
      proc.unref();
      // Wait a bit for the server to start
      await new Promise(res => setTimeout(res, 2000));
    } catch (err) {
      this.notifyError("Failed to start Ollama serve", err);
    }
  }

  /**
 * Send DeskThing notification for errors
 */
  private notifyError(title: string, error: Error | unknown): void {
    DeskThing.sendNotification({
      type: 'error',
      title,
      description: error instanceof Error ? error.message : String(error),
      id: `ollama-error-${Date.now()}`
    });
  }

  /**
   * Generate a full response using the Ollama REST API (non-streaming)
   */
  async generateResponse(messages: AgentMessage[]): Promise<string> {
    try {
      const ok = await this.isOllamaInstalled();
      if (!ok) throw new Error("Ollama REST API or model not available");

      const tools = ToolCalling.getAvailableTools();
      const res = await fetch(`${this.ollamaApiUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.modelName,
          messages: messages.map(m => ({ role: m.role, content: m.message })),
          stream: false,
          tools
        })
      });
      if (!res.ok) throw new Error(`Ollama chat API error: ${res.statusText}`);
      const data = await res.json();
      // If tool_calls are present, return them as JSON string, else return content
      if (data.message?.tool_calls) {
        return JSON.stringify({ tool_calls: data.message.tool_calls });
      }
      return data.message?.content ?? "";
    } catch (error) {
      this.notifyError("Ollama generateResponse error", error);
      throw error;
    }
  }

  /**
   * Stream response using the Ollama CLI (word streaming)
   * Calls onToken for each chunk of output
   */
  async streamResponse(messages: AgentMessage[], onToken: (token: string, toolCalls?: OllamaFunctionToolResponse) => void): Promise<void> {
    try {
      const ok = await this.isOllamaInstalled();
      if (!ok) throw new Error("Ollama REST API or model not available");

      console.log(`Starting stream with model ${this.modelName}`);

      const tools = ToolCalling.getAvailableTools();
      const res = await fetch(`${this.ollamaApiUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.modelName,
          messages: messages.map(m => ({ role: m.role, content: m.message })),
          stream: true,
          tools
        })
      });

      if (!res.ok || !res.body) throw new Error(`Ollama chat API error: ${res.statusText}`);

      // Stream response
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let partial = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        partial += decoder.decode(value, { stream: true });
        // Ollama streams JSON objects per line
        for (const line of partial.split("\n")) {
          if (line.trim()) {
            try {
              const obj = JSON.parse(line);
              // If tool_calls are present, pass them to the callback
              if (obj.message?.tool_calls) {
                onToken('', obj.message.tool_calls);
              } else if (obj.message?.content) {
                onToken(obj.message.content);
              }
            } catch {
              // Ignore parse errors for incomplete lines
            }
          }
        }
        partial = ""; // Clear after processing
      }
    } catch (error) {
      this.notifyError("Ollama streamResponse error", error);
    }
  }

  /**
   * Process function calls in LLM response
   */
  processFunctionCalls(response: string): string {
    // Handle time function call
    if (response.includes('<CALL:getTime>')) {
      const currentTime = new Date().toLocaleTimeString()
      return response.replace('<CALL:getTime>', `The current time is ${currentTime}`)
    }

    // Add more function calls here in the future
    // if (response.includes('<CALL:getWeather>')) { ... }
    // if (response.includes('<CALL:setReminder>')) { ... }

    return response
  }

  /**
   * Get available models from Ollama CLI
   */
  getAvailableModels(): string[] {
    try {
      if (!fs.existsSync(OLLAMA_CLI)) return [];
      const result = spawnSync(OLLAMA_CLI, ["list"], { encoding: "utf-8" });
      if (result.error) return [];
      // Parse output: each line is a model name
      return result.stdout.split("\n").map(line => line.trim()).filter(Boolean);
    } catch {
      return [];
    }
  }

  /**
   * Download a model using the Ollama CLI.
   * Checks if the model exists, and if not, downloads it.
   * Prevents duplicate downloads.
   */
  async downloadModel(modelName: string): Promise<void> {
    if (this.getAvailableModels().some(m => m.startsWith(modelName))) {
      // Model already exists
      console.log(`Model ${modelName} already exists, skipping download.`);
      return;
    }

    if (this.activeDownloads.has(modelName)) {
      // Already downloading
      console.log(`Model ${modelName} is already being downloaded.`);
      return;
    }
    this.activeDownloads.add(modelName);
    try {
      const proc = spawn(OLLAMA_CLI, ["pull", modelName], { stdio: "inherit" });
      await new Promise<void>((resolve, reject) => {
        proc.on("close", (code) => {
          this.activeDownloads.delete(modelName);
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Failed to download model ${modelName} (exit code ${code})`));
          }
        });
        proc.on("error", (err) => {
          this.activeDownloads.delete(modelName);
          reject(err);
        });
      });
    } catch (err) {
      this.activeDownloads.delete(modelName);
      console.error('Error downloading model:', err);
      throw err;
    }
  }

  /**
   * Set the model to use
   */
  setModel(modelName: string): void {

    // first ensure that the model is downloaded
    const availableModels = this.getAvailableModels()

    if (!availableModels.some(m => m.startsWith(modelName))) {
      // check if it is downloading
      if (this.activeDownloads.has(modelName)) {
        DeskThing.sendNotification({
          type: 'warning',
          title: 'Model Still Downloading!',
          description: `Model ${modelName} is still downloading. Please wait for it to finish. Available models: ${availableModels.join(', ')}`,
          id: `model-still-downloading-${modelName}`
        })
      } else {
        DeskThing.sendNotification({
          type: 'error',
          title: 'Model Not Found',
          description: `Model ${modelName} is not available. Please download it first. Available models: ${availableModels.join(', ')}`,
          id: `model-not-found-${modelName}`
        })
      }
      return
    }

    console.log(`Setting model to ${modelName}`)

    this.modelName = modelName;
  }

  cleanup() {
    // stop any internal operations
  }

  /**
   * Get current model name
   */
  getModel(): string {
    return this.modelName;
  }
}