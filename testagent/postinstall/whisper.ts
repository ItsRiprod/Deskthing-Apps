import { execSync } from "child_process";
import { platform, arch } from "os";
import path from "path";
import { logInfo, BINARIES_DIR, downloadFile, logError } from "./utils";
import * as fs from 'fs';

function getPlatformWhisperInfo(): { url: string; filename: string; executable: string } {
    const currentPlatform = platform();
    const currentArch = arch();
    
    logInfo(`Detecting platform for Whisper: ${currentPlatform} ${currentArch}`);

    if (currentPlatform === 'win32') {
        if (currentArch === 'x64') {
            return {
                url: 'https://github.com/ggml-org/whisper.cpp/releases/download/v1.7.6/whisper-bin-x64.zip',
                filename: 'whisper-bin-x64.zip',
                executable: 'whisper-cli.exe'
            };
        } else {
            return {
                url: 'https://github.com/ggml-org/whisper.cpp/releases/download/v1.7.6/whisper-bin-Win32.zip',
                filename: 'whisper-bin-Win32.zip',
                executable: 'whisper-cli.exe'
            };
        }
    } else if (currentPlatform === 'darwin') {
        // For macOS, we'll download and build from source since no direct binaries
        return {
            url: 'https://github.com/ggml-org/whisper.cpp/archive/refs/tags/v1.7.6.tar.gz',
            filename: 'whisper-v1.7.6-source.tar.gz',
            executable: 'whisper-cli'
        };
    } else if (currentPlatform === 'linux') {
        // For Linux, we'll download and build from source
        return {
            url: 'https://github.com/ggml-org/whisper.cpp/archive/refs/tags/v1.7.6.tar.gz',
            filename: 'whisper-v1.7.6-source.tar.gz',
            executable: 'whisper-cli'
        };
    } else {
        throw new Error(`Unsupported platform: ${currentPlatform}`);
    }
}

export const downloadWhisper = async (): Promise<void> => {
    try {
        logInfo('Setting up Whisper.cpp v1.7.6 binary...');
        
        const whisperInfo = getPlatformWhisperInfo();
        const downloadPath = path.join(BINARIES_DIR, whisperInfo.filename);
        const finalPath = path.join(BINARIES_DIR, whisperInfo.executable);

        // Check if Whisper already exists
        if (fs.existsSync(finalPath)) {
            logInfo('Whisper binary already exists, skipping download');
            return;
        }

        await downloadFile(whisperInfo.url, downloadPath);

        // Handle different platforms
        if (platform() === 'win32') {
            await extractWhisperWindows(downloadPath, finalPath);
        } else {
            await buildWhisperFromSource(downloadPath, finalPath);
        }

        logInfo('Whisper.cpp v1.7.6 setup completed successfully');

    } catch (error) {
        logError('Failed to download/setup Whisper.cpp', error);
        logInfo('Warning: Whisper.cpp setup failed - transcription features may not work');
        logInfo('You can manually install whisper.cpp or use an alternative transcription service');
    }
}

async function extractWhisperWindows(downloadPath: string, finalPath: string): Promise<void> {
    try {
        logInfo('Extracting Whisper Windows binary...');
        
        // Extract the zip file
        try {
            execSync(`powershell -command "Expand-Archive -Path '${downloadPath}' -DestinationPath '${BINARIES_DIR}' -Force"`, { stdio: 'inherit' });
        } catch {
            // Fallback for systems without PowerShell
            execSync(`unzip -o "${downloadPath}" -d "${BINARIES_DIR}"`, { stdio: 'inherit' });
        }

        // Find the main.exe executable
        const extractedFiles = fs.readdirSync(BINARIES_DIR);
        let whisperExecutable = '';

        for (const file of extractedFiles) {
            const fullPath = path.join(BINARIES_DIR, file);
            if (fs.statSync(fullPath).isDirectory()) {
                // Look inside extracted directory
                const subFiles = fs.readdirSync(fullPath);
                for (const subFile of subFiles) {
                    if (subFile === 'whisper-cli.exe') {
                        whisperExecutable = path.join(fullPath, subFile);
                        break;
                    }
                }
                if (whisperExecutable) break;
            } else if (file === 'whisper-cli.exe') {
                whisperExecutable = fullPath;
                break;
            }
        }

        if (whisperExecutable && whisperExecutable !== finalPath) {
            logInfo(`Found whisper executable ${finalPath}`);
        } else if (!fs.existsSync(finalPath)) {
            throw new Error('Could not find whisper-cli.exe in extracted files');
        }

        // Clean up downloaded archive and temporary directories
        // if (fs.existsSync(downloadPath)) {
        //     fs.unlinkSync(downloadPath);
        // }

        // Clean up extracted directories (keep only the final binary)
        // extractedFiles.forEach(file => {
        //     const fullPath = path.join(BINARIES_DIR, file);
        //     if (fs.statSync(fullPath).isDirectory()) {
        //         try {
        //             fs.rmSync(fullPath, { recursive: true, force: true });
        //         } catch {
        //             logInfo(`Warning: Could not clean up directory ${file}`);
        //         }
        //     } else if (file !== path.basename(finalPath) && 
        //               file !== path.basename(downloadPath) &&
        //               file !== 'ffmpeg.exe' && 
        //               file !== 'ffmpeg' &&
        //               file !== 'whisper-cli.exe' &&
        //               file !== 'whisper-cli' &&
        //               file !== 'main.exe' &&
        //               file !== 'main') {
        //         try {
        //             fs.unlinkSync(fullPath);
        //         } catch {
        //             logInfo(`Warning: Could not clean up file ${file}`);
        //         }
        //     }
        // });

    } catch (error) {
        logError('Failed to extract Whisper Windows binary', error);
        throw error;
    }
}

async function buildWhisperFromSource(downloadPath: string, finalPath: string): Promise<void> {
    try {
        logInfo('Building Whisper.cpp v1.7.6 from source...');

        // Extract the source archive
        logInfo('Extracting source archive...');
        execSync(`tar -xzf "${downloadPath}" -C "${BINARIES_DIR}"`, { stdio: 'inherit' });

        // Find the extracted directory (should be whisper.cpp-1.7.6)
        const extractedDirs = fs.readdirSync(BINARIES_DIR).filter(file => {
            const fullPath = path.join(BINARIES_DIR, file);
            return fs.statSync(fullPath).isDirectory() && file.startsWith('whisper.cpp-');
        });

        if (extractedDirs.length === 0) {
            throw new Error('Could not find extracted whisper.cpp source directory');
        }

        const actualSourceDir = path.join(BINARIES_DIR, extractedDirs[0]);

        // Build the project
        logInfo('Compiling whisper.cpp...');
        const originalCwd = process.cwd();
        
        try {
            process.chdir(actualSourceDir);
            
            // Try modern CMake build first
            try {
                execSync('cmake -B build -DCMAKE_BUILD_TYPE=Release', { stdio: 'inherit' });
                execSync('cmake --build build --config Release', { stdio: 'inherit' });
                
                // Find the built executable
                const possiblePaths = [
                    path.join(actualSourceDir, 'build', 'bin', 'whisper-cli'),
                    path.join(actualSourceDir, 'build', 'whisper-cli'),
                    path.join(actualSourceDir, 'build', 'bin', 'Release', 'whisper-cli'),
                    path.join(actualSourceDir, 'build', 'bin', 'main'),
                    path.join(actualSourceDir, 'build', 'main'),
                    path.join(actualSourceDir, 'build', 'bin', 'Release', 'main'),
                ];
                
                let builtExecutable = '';
                for (const possiblePath of possiblePaths) {
                    if (fs.existsSync(possiblePath)) {
                        builtExecutable = possiblePath;
                        break;
                    }
                }
                
                if (!builtExecutable) {
                    throw new Error('CMake build succeeded but could not find whisper-cli or main executable');
                }
                
                fs.copyFileSync(builtExecutable, finalPath);
                
            } catch {
                logInfo('CMake build failed, trying make...');
                // Fallback to make
                execSync('make', { stdio: 'inherit' });
                
                // Try both whisper-cli and main executables
                const possibleBuilds = [
                    path.join(actualSourceDir, 'whisper-cli')
                ];
                
                let builtExecutable = '';
                for (const possiblePath of possibleBuilds) {
                    if (fs.existsSync(possiblePath)) {
                        builtExecutable = possiblePath;
                        break;
                    }
                }
                
                if (!builtExecutable) {
                    throw new Error('Make build failed to produce whisper-cli or main executable');
                }
                
                fs.copyFileSync(builtExecutable, finalPath);
            }
            
        } finally {
            process.chdir(originalCwd);
        }

        // Make executable on Unix systems
        if (platform() !== 'win32') {
            fs.chmodSync(finalPath, '755');
        }

        logInfo('Whisper.cpp built from source successfully');

        // Clean up source directory and archive
        // try {
        //     fs.rmSync(actualSourceDir, { recursive: true, force: true });
        //     if (fs.existsSync(downloadPath)) {
        //         fs.unlinkSync(downloadPath);
        //     }
        // } catch {
        //     logInfo('Warning: Could not clean up source files');
        // }

    } catch (error) {
        logError('Failed to build Whisper.cpp from source', error);
        throw error;
    }
}