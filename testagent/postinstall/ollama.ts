import { execSync } from "child_process";
import { platform, arch } from "os";
import path from "path";
import { logInfo, OLLAMA_DIR, downloadFile, logError } from "./utils";
import * as fs from 'fs';
import { spawn } from "child_process";

type OllamaInfo = {
    url: string;
    filename: string;
    executable: string;
    rocmUrl?: string;
    rocmFilename?: string;
};

function getPlatformOllamaInfo(): OllamaInfo {
    const currentPlatform = platform();
    const currentArch = arch();

    logInfo(`Detecting platform for Ollama: ${currentPlatform} ${currentArch}`);

    if (currentPlatform === 'win32') {
        // Detect AMD GPU for ROCm support
        let hasAmdGpu = false;
        try {
            const output = execSync(
                'powershell "Get-WmiObject win32_VideoController | Select-Object -ExpandProperty Name"',
                { encoding: 'utf-8' }
            );
            hasAmdGpu = /amd|radeon/i.test(output);
        } catch (e) {
            logInfo('Could not detect AMD GPU: ' + String(e));
        }

        if (hasAmdGpu) {
            // Both main and ROCm zips are needed for AMD
            return {
                url: 'https://ollama.com/download/ollama-windows-amd64.zip',
                filename: 'ollama-windows-amd64.zip',
                executable: 'ollama.exe',
                rocmUrl: 'https://ollama.com/download/ollama-windows-amd64-rocm.zip',
                rocmFilename: 'ollama-windows-amd64-rocm.zip'
            };
        }
        return {
            url: 'https://ollama.com/download/ollama-windows-amd64.zip',
            filename: 'ollama-windows-amd64.zip',
            executable: 'ollama.exe'
        };
    } else if (currentPlatform === 'darwin') {
        return {
            url: 'https://ollama.com/download/ollama-darwin-universal.zip',
            filename: 'ollama-darwin-universal.zip',
            executable: 'ollama'
        };
    } else if (currentPlatform === 'linux') {
        // Detect ARM64
        if (currentArch === 'arm64' || currentArch === 'aarch64') {
            return {
                url: 'https://ollama.com/download/ollama-linux-arm64.tgz',
                filename: 'ollama-linux-arm64.tgz',
                executable: 'ollama'
            };
        }
        // Detect AMD GPU for ROCm support
        let hasAmdGpu = false;
        try {
            const output = execSync('lspci | grep VGA', { encoding: 'utf-8' });
            hasAmdGpu = /amd|radeon/i.test(output);
        } catch (e) {
            logInfo('Could not detect AMD GPU: ' + String(e));
        }

        if (hasAmdGpu) {
            // Both main and ROCm tgz are needed for AMD
            return {
                url: 'https://ollama.com/download/ollama-linux-amd64.tgz',
                filename: 'ollama-linux-amd64.tgz',
                executable: 'ollama',
                rocmUrl: 'https://ollama.com/download/ollama-linux-amd64-rocm.tgz',
                rocmFilename: 'ollama-linux-amd64-rocm.tgz'
            };
        }
        return {
            url: 'https://ollama.com/download/ollama-linux-amd64.tgz',
            filename: 'ollama-linux-amd64.tgz',
            executable: 'ollama'
        };
    } else {
        throw new Error(`Unsupported platform: ${currentPlatform}`);
    }
}

const checkForOllamaCLI = async (): Promise<boolean> => {
    try {
        execSync('ollama --version', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
};


export const downloadOllama = async (): Promise<void> => {
    try {

        logInfo('Checking for existing Ollama CLI installation...');
        const hasOllama = await checkForOllamaCLI();
        if (hasOllama) {
            logInfo('Ollama CLI found, skipping installation.');
            return;
        }


        logInfo('Setting up Ollama standalone CLI...');

        const ollamaInfo = getPlatformOllamaInfo();
        const downloadPath = path.join(OLLAMA_DIR, ollamaInfo.filename);
        const finalPath = path.join(OLLAMA_DIR, ollamaInfo.executable);

        // Check if Ollama already exists
        if (fs.existsSync(finalPath)) {
            logInfo('Ollama CLI already exists, skipping download');
            return;
        }

        // Ensure directory exists
        if (!fs.existsSync(OLLAMA_DIR)) {
            fs.mkdirSync(OLLAMA_DIR, { recursive: true });
        }

        // Download main package
        await downloadFile(ollamaInfo.url, downloadPath);

        // Download ROCm package if present
        if ('rocmUrl' in ollamaInfo && ollamaInfo.rocmUrl && ollamaInfo.rocmFilename) {
            const rocmDownloadPath = path.join(OLLAMA_DIR, ollamaInfo.rocmFilename);
            await downloadFile(ollamaInfo.rocmUrl, rocmDownloadPath);
        }

        // Extract main package
        try {
            if (platform() === 'win32') {
                execSync(`powershell -command "Expand-Archive -Path '${downloadPath}' -DestinationPath '${OLLAMA_DIR}' -Force"`, { stdio: 'inherit' });
                if ('rocmUrl' in ollamaInfo && ollamaInfo.rocmUrl && ollamaInfo.rocmFilename) {
                    const rocmDownloadPath = path.join(OLLAMA_DIR, ollamaInfo.rocmFilename);
                    execSync(`powershell -command "Expand-Archive -Path '${rocmDownloadPath}' -DestinationPath '${OLLAMA_DIR}' -Force"`, { stdio: 'inherit' });
                }
            } else if (platform() === 'linux') {
                execSync(`tar -xzf "${downloadPath}" -C "${OLLAMA_DIR}"`, { stdio: 'inherit' });
                if ('rocmUrl' in ollamaInfo && ollamaInfo.rocmUrl && ollamaInfo.rocmFilename) {
                    const rocmDownloadPath = path.join(OLLAMA_DIR, ollamaInfo.rocmFilename);
                    execSync(`tar -xzf "${rocmDownloadPath}" -C "${OLLAMA_DIR}"`, { stdio: 'inherit' });
                }
            } else {
                execSync(`unzip -o "${downloadPath}" -d "${OLLAMA_DIR}"`, { stdio: 'inherit' });
            }
        } catch (extractError) {
            logError('Failed to extract Ollama CLI package(s)', extractError);
            throw extractError;
        }

        // Find the executable
        let ollamaExecutable = '';
        const extractedFiles = fs.readdirSync(OLLAMA_DIR);
        for (const file of extractedFiles) {
            const fullPath = path.join(OLLAMA_DIR, file);
            if (fs.statSync(fullPath).isDirectory()) {
                const subFiles = fs.readdirSync(fullPath);
                for (const subFile of subFiles) {
                    if (subFile === ollamaInfo.executable) {
                        ollamaExecutable = path.join(fullPath, subFile);
                        break;
                    }
                }
                if (ollamaExecutable) break;
            } else if (file === ollamaInfo.executable) {
                ollamaExecutable = fullPath;
                break;
            }
        }

        if (ollamaExecutable && ollamaExecutable !== finalPath) {
            fs.copyFileSync(ollamaExecutable, finalPath);
            logInfo(`Moved Ollama executable to ${finalPath}`);
        } else if (!fs.existsSync(finalPath)) {
            throw new Error(`Could not find ${ollamaInfo.executable} in extracted files`);
        }

        // Make executable on Unix systems
        if (platform() !== 'win32') {
            fs.chmodSync(finalPath, '755');
        }

        // Clean up downloaded archive and extracted directories
        // if (fs.existsSync(downloadPath)) {
        //     fs.unlinkSync(downloadPath);
        // }

        // if ('rocmUrl' in ollamaInfo && ollamaInfo.rocmUrl && ollamaInfo.rocmFilename) {
        //     const rocmDownloadPath = path.join(OLLAMA_DIR, ollamaInfo.rocmFilename);
        //     if (fs.existsSync(rocmDownloadPath)) {
        //         fs.unlinkSync(rocmDownloadPath);
        //     }
        // }

        // extractedFiles.forEach(file => {
        //     const fullPath = path.join(OLLAMA_DIR, file);
        //     if (fs.statSync(fullPath).isDirectory()) {
        //         try {
        //             fs.rmSync(fullPath, { recursive: true, force: true });
        //         } catch {
        //             logInfo(`Warning: Could not clean up directory ${file}`);
        //         }
        //     }
        // });

        logInfo('Ollama CLI setup completed successfully');
    } catch (error) {
        logError('Failed to download/setup Ollama CLI', error);
        logInfo('Warning: Ollama CLI setup failed - LLM features may not work');
        logInfo('You can manually install Ollama or use an alternative LLM service');
    }
}

/**
 * Downloads Gemma3:1b via the Ollama CLI
 */
export const downloadGemma3 = async (): Promise<void> => {
    try {
        logInfo('Downloading Gemma3:1b model for Ollama...');
        const ollamaInfo = getPlatformOllamaInfo();
        const ollamaExecutable = path.join(OLLAMA_DIR, ollamaInfo.executable);

        if (!fs.existsSync(ollamaExecutable)) {
            throw new Error('Ollama executable not found, please run the Ollama setup first');
        }

        // check of gemma3:1b model already exists
        const modelList = execSync(`"${ollamaExecutable}" list`, { encoding: 'utf-8' });
        if (modelList.includes('gemma3:1b')) {
            logInfo('Gemma3:1b model already exists, skipping download');
            return;
        }


        const child = spawn(`"${ollamaExecutable}"`, ["pull", "gemma3:1b"], { shell: true });
        let lastLogTime = Date.now();
        child.stdout.on('data', (data) => {
            const now = Date.now();
            if (now - lastLogTime > 2000) { // every 2 seconds
            logInfo('Ollama pull progress: ' + data.toString().trim());
            lastLogTime = now;
            }
        });
        child.stderr.on('data', (data) => {
            logError('Ollama pull error: ' + data.toString().trim());
        });
        await new Promise((resolve, reject) => {
            child.on('close', (code) => {
            if (code === 0) resolve(undefined);
            else reject(new Error(`Ollama pull exited with code ${code}`));
            });
        });
        
        logInfo('Successfully downloaded Qwen3 model');
    } catch (error) {
        logError('Failed to download Qwen3 model', error);
    }
}