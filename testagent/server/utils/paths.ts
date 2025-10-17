import { join } from "path";
import fs from "fs";

// lib path
export const LIB_DIR = process.env.DESKTHING_LIB_DIR || join(__dirname, '..', 'lib');

// binary directory
export const BINARY_DIR = join(LIB_DIR, 'binaries');

// models directory
export const MODELS_DIR = join(LIB_DIR, 'models');

// tmp dir
export const TMP_DIR = join(__dirname, '..', 'temp');

// FFMPEG binary path
const ffmpegName = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
export const FFMPEG_BIN = join(BINARY_DIR, ffmpegName);

// Ollama directory and CLI path (matches #file:utils.ts and #file:ollama.ts)
export const OLLAMA_DIR = join(LIB_DIR, 'ollama');

// Platform-specific Ollama executable name
const ollamaExecutable = process.platform === 'win32' ? 'ollama.exe' : 'ollama';
export const OLLAMA_CLI = join(OLLAMA_DIR, ollamaExecutable);

export const clearTempDir = () => {
  try {
    if (fs.existsSync(TMP_DIR)) {
      fs.rmSync(TMP_DIR, { recursive: true, force: true });
    }
  } catch (error) {
    console.error('Error clearing temp directory:', error);
  }
}