// Voice Assistant Postinstall Script
// Downloads platform-specific FFmpeg binaries and Whisper models

import fs from 'fs';
import path from 'path';

// lib is a protected dir that wont get deleted during app updates
const LIB_DIR = process.env.DESKTHING_LIB_DIR || path.join(process.cwd(), 'lib');

if (!fs.existsSync(LIB_DIR)) {
    fs.mkdirSync(LIB_DIR);
}

export const BINARIES_DIR = path.join(LIB_DIR, 'binaries');
export const MODELS_DIR = path.join(LIB_DIR, 'models');
export const OLLAMA_DIR = path.join(LIB_DIR, "ollama");

let subject = 'Voice Assistant Postinstall';

export const setLogSubject = (newSubject: string) => {
    subject = newSubject;
}

export const logInfo = (message: string) => {
    console.log(`[${subject}] ${message}`);
}

export const logError = (message: string, error?: unknown) => {
    console.error(`[${subject} ERROR] ${message}`);
    if (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        console.error(`Details: ${errorMessage}`);
        if (errorStack) console.error(`Stack: ${errorStack}`);
    }
}

export const downloadFile = async (url: string, destPath: string): Promise<void> => {
    try {
        logInfo(`Downloading file from ${url} to ${destPath}`);

        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
            logInfo(`Creating directory: ${destDir}`);
            fs.mkdirSync(destDir, { recursive: true });
        }

        // Check if file already exists and get remote file info
        let shouldDownload = true;
        if (fs.existsSync(destPath)) {
            try {
                // Get remote file size
                const headResponse = await fetch(url, { 
                    method: 'HEAD',
                    headers: { 'User-Agent': 'DeskThing-Voice-Assistant' }
                });
                
                if (headResponse.ok) {
                    const remoteSize = Number(headResponse.headers.get('content-length'));
                    const localSize = fs.statSync(destPath).size;
                    
                    if (remoteSize > 0 && localSize === remoteSize) {
                        logInfo(`File ${path.basename(destPath)} already exists with correct size (${localSize} bytes), skipping download`);
                        shouldDownload = false;
                    } else {
                        logInfo(`File ${path.basename(destPath)} exists but size differs (local: ${localSize}, remote: ${remoteSize}), re-downloading`);
                    }
                } else {
                    logInfo(`Could not get remote file info, proceeding with download`);
                }
            } catch {
                logInfo(`Could not check remote file size, proceeding with download`);
            }
        }

        if (!shouldDownload) {
            return;
        }

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'DeskThing-Voice-Assistant'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to download file: ${response.statusText} (${response.status})`);
        }

        const chunks: Uint8Array[] = [];
        const contentLength = Number(response.headers.get('content-length'));
        let receivedLength = 0;
        const reader = response.body?.getReader();

        if (!reader) {
            throw new Error('Failed to get reader from response body');
        }

        let previousProgress = 0;

        let done = false;
        while (!done) {
            const result = await reader.read();
            done = result.done;
            if (!done && result.value) {
                chunks.push(result.value);
                receivedLength += result.value?.length || 0;

                if (contentLength > 0) {
                    const progress = Math.round((receivedLength / contentLength) * 100);
                    if (progress > previousProgress + 10 || progress === 100) {
                        logInfo(`Progress: ${progress}% | Downloading ${url} to ${destPath}`);
                        previousProgress = progress;
                    }
                }
            }
        }

        const buffer = Buffer.concat(chunks);
        fs.writeFileSync(destPath, buffer);
        logInfo(`Successfully downloaded ${path.basename(destPath)} (${buffer.length} bytes)`);

    } catch (error) {
        logError(`Error downloading file: ${error}`, error);
        throw error;
    }
}
