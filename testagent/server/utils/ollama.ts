import { OLLAMA_CLI } from "./paths";
import { spawnSync } from "child_process";
import * as fs from "fs";

/**
 * Get a list of available Ollama models.
 * Parses the output to extract only model names.
 */
export function getOllamaModels(): string[] {
  if (!fs.existsSync(OLLAMA_CLI)) return [];
  const result = spawnSync(OLLAMA_CLI, ["list"], { encoding: "utf-8" });
  if (result.error) return [];
  const lines = result.stdout.split("\n").map(line => line.trim()).filter(Boolean);

  // Skip header line, extract first column (model name) from each row
  return lines.slice(1).map(line => line.split(/\s+/)[0]);
}