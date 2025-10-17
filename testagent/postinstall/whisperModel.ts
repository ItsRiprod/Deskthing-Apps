import path from "path";
import { downloadFile, logError, logInfo, MODELS_DIR } from "./utils";
import * as fs from 'fs';

export const downloadWhisperModels = async (): Promise<void> => {
    try {
        logInfo('Setting up Whisper models...');

        // Create models directory
        if (!fs.existsSync(MODELS_DIR)) {
            fs.mkdirSync(MODELS_DIR, { recursive: true });
        }

        // Updated model URLs for v1.7.6 compatible models
        const models = [
            { 
                name: 'ggml-base.en.bin', 
                url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin',
                description: 'Base English model (~142MB) - good balance of speed and accuracy'
            },
            // {
            //     name: 'ggml-small.en.bin',
            //     url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin',
            //     description: 'Small English model (~466MB) - better accuracy, slower'
            // }
            // Add more models as needed:
            // {
            //     name: 'ggml-tiny.en.bin',
            //     url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin',
            //     description: 'Tiny English model (~39MB) - fastest, lower accuracy'
            // }
        ];

        for (const model of models) {
            const modelPath = path.join(MODELS_DIR, model.name);
            
            // Check if model already exists
            if (fs.existsSync(modelPath)) {
                logInfo(`Whisper model ${model.name} already exists, skipping download`);
                continue;
            }

            logInfo(`Downloading Whisper model: ${model.name} - ${model.description}`);
            await downloadFile(model.url, modelPath);
        }
        
        logInfo('Whisper models download completed successfully');

    } catch (error) {
        logError('Failed to download Whisper models', error);
        logInfo('Warning: Whisper models could not be downloaded - will be downloaded on first use instead');
    }
}
