// Speech-to-Text Domain
// Handles Whisper.cpp v1.7.6 binary integration for audio transcription

import { execSync } from 'child_process';
import { platform } from 'os';
import fs from 'fs';
import path from 'path';
import { BINARIES_DIR } from '../../postinstall/utils';
import { MODELS_DIR } from '../utils/paths';

export class SpeechToText {
    private whisperBinaryPath: string;
    private modelName: string;

    constructor(modelName: string = 'ggml-base.en.bin') {
        // Determine paths based on platform

        this.whisperBinaryPath = path.join(
            BINARIES_DIR,
            'Release',
            platform() === 'win32' ? 'whisper-cli.exe' : 'whisper-cli'
        );
        this.modelName = modelName;

        this.validateSetup();
    }

    private validateSetup(): void {
        // Check if whisper binary exists
        if (!fs.existsSync(this.whisperBinaryPath)) {
            throw new Error(
                `Whisper binary not found at ${this.whisperBinaryPath}. ` +
                'Please run postinstall script to download Whisper.cpp v1.7.6 binaries.'
            );
        }

        // Check if models directory exists
        if (!fs.existsSync(MODELS_DIR)) {
            console.warn('Models directory not found, will try to download models automatically');
            fs.mkdirSync(MODELS_DIR, { recursive: true });
        }
    }

    private async ensureModel(): Promise<string> {
        const modelPath = path.join(MODELS_DIR, this.modelName);

        if (fs.existsSync(modelPath)) {
            return modelPath;
        }

        // Model doesn't exist, try to download it
        console.log(`Downloading Whisper model: ${this.modelName}`);

        try {
            const modelUrl = `https://huggingface.co/ggerganov/whisper.cpp/resolve/main/${this.modelName}`;

            // Use curl or wget to download the model
            const downloadCommand = platform() === 'win32'
                ? `curl -L "${modelUrl}" -o "${modelPath}"`
                : `wget "${modelUrl}" -O "${modelPath}"`;

            execSync(downloadCommand, { stdio: 'inherit' });

            if (!fs.existsSync(modelPath)) {
                throw new Error('Model download failed - file not created');
            }

            console.log(`Successfully downloaded model: ${this.modelName}`);
            return modelPath;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(
                `Failed to download Whisper model ${this.modelName}: ${errorMessage}. ` +
                'Please download the model manually or check your internet connection.'
            );
        }
    }

    /**
     * Transcribe audio file using Whisper.cpp
     * Expects 16kHz WAV files for best results
     */
    async transcribe(audioFilePath: string): Promise<string> {
        try {
            console.log(`Transcribing audio file: ${audioFilePath}`);

            // Validate input file exists
            if (!fs.existsSync(audioFilePath)) {
                throw new Error(`Audio file not found: ${audioFilePath}`);
            }

            // Ensure model is available
            const modelPath = await this.ensureModel();

            // Build whisper.cpp command
            const whisperCommand = [
                `"${this.whisperBinaryPath}"`,
                `-m "${modelPath}"`,
                `-f "${audioFilePath}"`,
                '--output-txt',      // Output as text
                '--no-timestamps',   // Don't include timestamps
                '--language en',     // Force English language
                '--threads 4'        // Use 4 threads for processing
            ].join(' ');

            console.log(`Running Whisper command: ${whisperCommand}`);

            // Execute whisper.cpp
            const result = execSync(whisperCommand, {
                encoding: 'utf8',
                maxBuffer: 1024 * 1024 * 10 // 10MB buffer for large outputs
            });

            // The output might contain additional info, extract just the transcription
            const lines = result.split('\n').filter(line => line.trim());

            // Find the transcription line (usually starts with timestamps or content)
            let transcription = '';
            for (const line of lines) {
                const trimmed = line.trim();

                // Skip empty lines and whisper info lines
                if (!trimmed ||
                    trimmed.startsWith('whisper_') ||
                    trimmed.includes('processing') ||
                    trimmed.includes('model loaded') ||
                    trimmed.includes('milliseconds')) {
                    continue;
                }

                // This should be our transcription
                transcription = trimmed;
                break;
            }

            if (!transcription) {
                // Fallback: try to get the last meaningful line
                transcription = lines[lines.length - 1] || '';
            }

            // Clean up the transcription
            transcription = transcription
                .replace(/^\[\d+:\d+:\d+\.\d+\s*-->\s*\d+:\d+:\d+\.\d+\]\s*/, '') // Remove timestamp markers
                .replace(/\s+/g, ' ')  // Normalize whitespace
                .trim();

            console.log(`Transcription result: "${transcription}"`);

            if (!transcription) {
                throw new Error('No transcription produced by Whisper.cpp');
            }

            return transcription;

        } catch (error) {
            console.error('Transcription failed:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Speech-to-text transcription failed: ${errorMessage}`);
        }
    }

    /**
     * Set the Whisper model to use
     */
    setModel(modelName: string): void {
        this.modelName = modelName;
        console.log(`Switched to Whisper model: ${modelName}`);
    }

    /**
     * Get current model name
     */
    getModel(): string {
        return this.modelName;
    }

    /**
     * Get available models
     */
    getAvailableModels(): string[] {
        if (!fs.existsSync(MODELS_DIR)) {
            return [];
        }

        return fs.readdirSync(MODELS_DIR)
            .filter(file => file.endsWith('.bin'))
            .sort();
    }

    /**
     * Test if Whisper.cpp setup is working
     */
    async testSetup(): Promise<boolean> {
        try {
            // Try to run whisper with version check
            const versionCommand = `"${this.whisperBinaryPath}" --help`;
            execSync(versionCommand, { stdio: 'pipe' });

            // Try to ensure model exists
            await this.ensureModel();

            console.log('Whisper.cpp setup test passed');
            return true;

        } catch (error) {
            console.error('Whisper.cpp setup test failed:', error);
            return false;
        }
    }
}