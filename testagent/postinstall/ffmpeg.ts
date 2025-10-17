import { execSync } from "child_process";
import { platform, arch } from "os";
import path from "path";
import { logInfo, BINARIES_DIR, downloadFile, logError } from "./utils";
import * as fs from 'fs';

function getPlatformFFmpegInfo(): { url: string; filename: string; executable: string } {
    const currentPlatform = platform();
    const currentArch = arch();
    
    logInfo(`Detecting platform: ${currentPlatform} ${currentArch}`);

    if (currentPlatform === 'win32') {
        return {
            url: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip',
            filename: 'ffmpeg-win64.zip',
            executable: 'ffmpeg.exe'
        };
    } else if (currentPlatform === 'darwin') {
        return {
            url: 'https://evermeet.cx/ffmpeg/ffmpeg-6.1.1.zip',
            filename: 'ffmpeg-macos.zip',
            executable: 'ffmpeg'
        };
    } else if (currentPlatform === 'linux') {
        return {
            url: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz',
            filename: 'ffmpeg-linux.tar.xz',
            executable: 'ffmpeg'
        };
    } else {
        throw new Error(`Unsupported platform: ${currentPlatform}`);
    }
}

export const downloadFFmpeg = async (): Promise<void> => {
    try {
        logInfo('Setting up FFmpeg binary...');
        
        const ffmpegInfo = getPlatformFFmpegInfo();
        const downloadPath = path.join(BINARIES_DIR, ffmpegInfo.filename);
        const finalPath = path.join(BINARIES_DIR, ffmpegInfo.executable);

        // Check if FFmpeg already exists
        if (fs.existsSync(finalPath)) {
            logInfo('FFmpeg binary already exists, skipping download');
            return;
        }

        await downloadFile(ffmpegInfo.url, downloadPath);

        // Extract the downloaded file
        logInfo('Extracting FFmpeg binary...');
        
        if (ffmpegInfo.filename.endsWith('.zip')) {
            // For Windows and macOS zip files
            try {
                execSync(`powershell -command "Expand-Archive -Path '${downloadPath}' -DestinationPath '${BINARIES_DIR}' -Force"`, { stdio: 'inherit' });
            } catch {
                // Fallback for non-Windows systems with unzip
                execSync(`unzip -o "${downloadPath}" -d "${BINARIES_DIR}"`, { stdio: 'inherit' });
            }
        } else if (ffmpegInfo.filename.endsWith('.tar.xz')) {
            // For Linux tar.xz files
            execSync(`tar -xf "${downloadPath}" -C "${BINARIES_DIR}"`, { stdio: 'inherit' });
        }

        // Find and move the FFmpeg executable to the correct location
        // Windows: ffmpeg-master/bin/ffmpeg.exe
        // macOS/Linux: ffmpeg (directly in archive or in subdirectory)
        let ffmpegExecutable = '';

        function findFFmpegRecursively(dir: string): string {
            const files = fs.readdirSync(dir);
            
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    // Recursively search subdirectories
                    const found = findFFmpegRecursively(fullPath);
                    if (found) return found;
                } else if (file === 'ffmpeg.exe' || file === 'ffmpeg') {
                    return fullPath;
                }
            }
            
            return '';
        }

        ffmpegExecutable = findFFmpegRecursively(BINARIES_DIR);

        if (!ffmpegExecutable) {
            throw new Error('Could not find FFmpeg executable in extracted files');
        }

        logInfo(`Found FFmpeg executable at: ${ffmpegExecutable}`);

        if (ffmpegExecutable !== finalPath) {
            fs.copyFileSync(ffmpegExecutable, finalPath);
            logInfo(`Moved FFmpeg executable to ${finalPath}`);
        } else {
            logInfo('FFmpeg executable is already in the correct location');
        }

        // Make executable on Unix systems
        if (platform() !== 'win32') {
            fs.chmodSync(finalPath, '755');
        }

        // // Clean up downloaded archive and extracted directories
        // if (fs.existsSync(downloadPath)) {
        //     fs.unlinkSync(downloadPath);
        // }

        // Clean up extracted directories (keep only the final binary)
        // const extractedFiles = fs.readdirSync(BINARIES_DIR);
        // extractedFiles.forEach(file => {
        //     const fullPath = path.join(BINARIES_DIR, file);
        //     try {
        //         if (fs.statSync(fullPath).isDirectory() && file !== 'models') {
        //             fs.rmSync(fullPath, { recursive: true, force: true });
        //             logInfo(`Cleaned up extracted directory: ${file}`);
        //         } else if (file !== path.basename(finalPath) && 
        //                   file !== path.basename(downloadPath) && 
        //                   file !== 'ffmpeg.exe' && 
        //                   file !== 'ffmpeg' &&
        //                   file !== 'whisper-cli.exe' &&
        //                   file !== 'whisper-cli' &&
        //                   file !== 'main.exe' &&
        //                   file !== 'main') {
        //             // Clean up any other files that aren't our target executables
        //             fs.unlinkSync(fullPath);
        //             logInfo(`Cleaned up file: ${file}`);
        //         }
        //     } catch {
        //         logInfo(`Warning: Could not clean up ${file}`);
        //     }
        // });

        logInfo('FFmpeg setup completed successfully');

    } catch (error) {
        logError('Failed to download/setup FFmpeg', error);
        throw error;
    }
}