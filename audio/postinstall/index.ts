// Beginning of the postinstall script

import fs from 'fs';
import path from 'path';
import { platform, arch } from 'os';

const REPO_OWNER = 'JoeyEamigh';
const REPO_NAME = 'nowplaying';
const FINAL_DIR = path.join(process.cwd(), 'server');

function logInfo(message: string) {
    console.log(`[Postinstall] ${message}`);
}

function logError(message: string, error?: any) {
    console.error(`[Postinstall ERROR] ${message}`);
    if (error) {
        console.error(`Details: ${error.message || error}`);
        if (error.stack) console.error(`Stack: ${error.stack}`);
    }
}

async function downloadFile(url: string, destPath: string): Promise<void> {
    try {

        logInfo(`Downloading file from ${url} to ${destPath}`);

        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
            logInfo(`Creating directory: ${destDir}`);
            fs.mkdirSync(destDir, { recursive: true });
        }

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Deskthing-Apps-Installer'
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

                const progress = Math.round((receivedLength / contentLength) * 100);
                // Skip progress updates if the progress is less than 5% over the previous count
                if (progress > previousProgress + 5 || progress === 100) {
                    logInfo(`Progress: (${progress}%)`);
                    previousProgress = progress;
                }
            }
        }

        const buffer = Buffer.concat(chunks);

        logInfo(`Writing ${buffer.length} bytes to ${destPath}`);

        fs.writeFileSync(destPath, buffer);

        logInfo(`File successfully written to ${destPath}`);

        return Promise.resolve();
    } catch (error) {
        logError(`Error downloading file: ${error}`, error);
        throw error;
    }
}
async function getLatestReleaseAssets(): Promise<any[]> {
    try {

        const response = await fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`,
            {
                headers: {
                    'User-Agent': 'Deskthing-Apps-Installer'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch release data: ${response.statusText} (${response.status})`);
        }

        const data = await response.json();

        logInfo(`Found ${data.assets?.length || 0} assets in the latest release`);

        return data.assets;
    } catch (error) {
        logError(`Error fetching release assets: ${error}`, error);
        throw error;
    }
}

function isMusl(): boolean {
    if (platform() !== 'linux') return false;

    try {
        logInfo('Checking for musl libc');
        if (fs.existsSync('/usr/bin/ldd')) {
            return fs.readFileSync('/usr/bin/ldd', 'utf-8').includes('musl');
        } else {
            logInfo('/usr/bin/ldd not found, trying ldd --version');
            const { execSync } = require('child_process');
            return execSync('ldd --version', { encoding: 'utf8' }).includes('musl');
        }
    } catch (error) {
        logInfo(`Could not determine if using musl: ${error.message}`);
        return false;
    }
}

async function main() {
    try {
        // Create bindings directory if it doesn't exist
        if (!fs.existsSync(FINAL_DIR)) {
            logInfo(`Creating directory: ${FINAL_DIR}`);
            try {
                fs.mkdirSync(FINAL_DIR, { recursive: true });
                logInfo(`Directory created successfully`);
            } catch (dirError) {
                logError(`Failed to create directory ${FINAL_DIR}`, dirError);
                throw dirError;
            }
        } else {
            logInfo(`Directory ${FINAL_DIR} already exists`);
        }

        let filePattern = '';

        // Determine the correct file to download based on platform and architecture
        if (platform() === 'win32') {
            if (arch() === 'x64') {
                filePattern = 'n-nowplaying.win32-x64-msvc.node';
            } else if (arch() === 'arm64') {
                filePattern = 'n-nowplaying.win32-arm64-msvc.node';
            } else {
                throw new Error(`Unsupported architecture on Windows: ${arch()}`);
            }
        } else if (platform() === 'darwin') {
            filePattern = 'n-nowplaying.darwin-universal.node';
        } else if (platform() === 'linux') {
            if (arch() === 'x64') {
                filePattern = isMusl()
                    ? 'n-nowplaying.linux-x64-musl.node'
                    : 'n-nowplaying.linux-x64-gnu.node';
            } else if (arch() === 'arm64') {
                filePattern = isMusl()
                    ? 'n-nowplaying.linux-arm64-musl.node'
                    : 'n-nowplaying.linux-arm64-gnu.node';
            } else {
                throw new Error(`Unsupported architecture on Linux: ${arch()}`);
            }
        } else {
            throw new Error(`Unsupported platform: ${platform()}`);
        }

        console.log(`Looking for ${filePattern} for ${platform()} ${arch()}...`);

        const assets = await getLatestReleaseAssets();

        const asset = assets.find(a => a.name === filePattern);

        if (!asset) {
            logError(`Could not find ${filePattern} in the latest release assets. Available assets:`, 
                assets.map(a => a.name).join(', '));
            throw new Error(`Could not find ${filePattern} in the latest release assets`);
        }

        logInfo(`Found asset: ${asset.name} (${asset.size} bytes)`);
        logInfo(`Downloading from: ${asset.browser_download_url}`);

        const destPath = path.join(FINAL_DIR, asset.name);
        await downloadFile(asset.browser_download_url, destPath);

        console.log(`Successfully downloaded ${asset.name}`);

        if (fs.existsSync(destPath)) {
            const stats = fs.statSync(destPath);
            logInfo(`Verified file exists with size: ${stats.size} bytes`);
        } else {
            throw new Error(`File verification failed: ${destPath} does not exist after download`);
        }

        console.log('Postinstall completed successfully');
    } catch (error) {
        console.error('Error during postinstall:', error);
    } finally {
        process.exit(0);
    }
}

main();
