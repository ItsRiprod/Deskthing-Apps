import { platform } from "os";
import path from "path";
import { downloadFFmpeg } from "./ffmpeg";
import { logInfo, BINARIES_DIR, MODELS_DIR, logError, OLLAMA_DIR, setLogSubject } from "./utils";
import { downloadWhisper } from "./whisper";
import { downloadWhisperModels } from "./whisperModel";
import * as fs from 'fs';
import { downloadOllama, downloadGemma3 } from "./ollama";

async function main() {
    try {
        logInfo('Starting Voice Assistant postinstall setup...');

        // Create necessary directories
        [BINARIES_DIR, MODELS_DIR, OLLAMA_DIR].forEach(dir => {
            if (!fs.existsSync(dir)) {
                logInfo(`Creating directory: ${dir}`);
                fs.mkdirSync(dir, { recursive: true });
            }
        });

        setLogSubject('FFMPEG Download')
        // Download FFmpeg binaries
        await downloadFFmpeg();
        
        setLogSubject('Whisper Download')
        // Download Whisper.cpp v1.7.6 binary
        await downloadWhisper();
        
        setLogSubject('Whisper Model Download')
        // Download Whisper models
        await downloadWhisperModels();
        
        setLogSubject('Ollama Download')
        await downloadOllama();

        setLogSubject('Qwen3 Ollama Model Download')
        await downloadGemma3();

        logInfo('Voice Assistant postinstall completed successfully!');
        logInfo(`FFmpeg binary location: ${path.join(BINARIES_DIR, platform() === 'win32' ? 'ffmpeg.exe' : 'ffmpeg')}`);
        logInfo(`Whisper.cpp binary location: ${path.join(BINARIES_DIR, platform() === 'win32' ? 'whisper-cli.exe' : 'whisper-cli')}`);
        logInfo(`Whisper models location: ${MODELS_DIR}`);

    } catch (error) {
        logError('Error during postinstall setup:', error);
        process.exit(1);
    }
}

main();
