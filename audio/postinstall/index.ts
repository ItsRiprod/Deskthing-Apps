// Beginning of the postinstall script

import fs from 'fs';
import path from 'path';
import { platform, arch } from 'os';

const REPO_OWNER = 'JoeyEamigh';
const REPO_NAME = 'nowplaying';
const FINAL_DIR = path.join(process.cwd(), 'server');

async function downloadFile(url: string, destPath: string): Promise<void> {
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
                console.log(`(${progress}%)`);
                previousProgress = progress;
            } 
        }
    }

    const buffer = Buffer.concat(chunks);
    const fileStream = fs.createWriteStream(destPath);

    return new Promise((resolve, reject) => {
        fileStream.write(buffer);
        fileStream.on('finish', resolve);
        fileStream.on('error', reject);
        fileStream.end();
    });
}
async function getLatestReleaseAssets(): Promise<any[]> {
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
    return data.assets;
}

function isMusl(): boolean {
    if (platform() !== 'linux') return false;

    try {
        return fs.readFileSync('/usr/bin/ldd', 'utf-8').includes('musl');
    } catch {
        try {
            const { execSync } = require('child_process');
            return execSync('ldd --version', { encoding: 'utf8' }).includes('musl');
        } catch {
            return false;
        }
    }
}

async function main() {
    try {
        // Create bindings directory if it doesn't exist
        if (!fs.existsSync(FINAL_DIR)) {
            fs.mkdirSync(FINAL_DIR, { recursive: true });
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
            throw new Error(`Could not find ${filePattern} in the latest release assets`);
        }

        console.log(`Found asset: ${asset.name} (${asset.size} bytes)`);
        console.log(`Downloading from: ${asset.browser_download_url}`);

        const destPath = path.join(FINAL_DIR, asset.name);
        await downloadFile(asset.browser_download_url, destPath);

        console.log(`Successfully downloaded ${asset.name}`);

        console.log('Postinstall completed successfully');
    } catch (error) {
        console.error('Error during postinstall:', error);
        process.exit(1);
    }
}

main();
