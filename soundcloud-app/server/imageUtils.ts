import { DeskThing } from '@deskthing/server';
import { existsSync, mkdirSync, writeFile, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

export const saveImage = async (imageData: string, fileName: string): Promise<string | undefined> => {
    // Handle both base64 and binary image data
    if (imageData.startsWith('data:image')) {
        DeskThing.sendLog('Processing base64 image data');
        return await saveBase64Image(imageData, fileName);
    } else {
        // Assume it's raw binary data
        DeskThing.sendLog('Processing binary image data');
        return await saveBinaryImage(imageData, fileName);
    }
}

const saveBase64Image = async (base64Image: string, fileName: string): Promise<string | undefined> => {
    // Extract the image format from the data URL
    const matches = base64Image.match(/^data:image\/([a-zA-Z+]+);base64,/);
    if (!matches) {
        DeskThing.sendError('Invalid base64 image format');
        return;
    }
    
    const imageFormat = matches[1];
    const base64Data = base64Image.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    // Create the images directory if it doesn't exist
    const imagesDir = join(__dirname, '../images');
    if (!existsSync(imagesDir)) {
        DeskThing.sendLog('Creating images directory');
        mkdirSync(imagesDir, { recursive: true });
    }

    // Generate file path with correct extension
    const filePath = join(imagesDir, `${fileName}.${imageFormat}`);

    // Write the file and return a promise
    return new Promise((resolve, reject) => {
        writeFile(filePath, base64Data, 'base64', (err) => {
            if (err) {
                DeskThing.sendError(`Failed to save base64 image: ${err.message}`);
                reject(err);
                return;
            }
            DeskThing.sendLog(`Successfully saved base64 image: ${fileName}.${imageFormat}`);
            resolve(`/resource/image/soundcloud/${fileName}.${imageFormat}`);
        });
    });
}

const saveBinaryImage = async (binaryData: string, fileName: string): Promise<string | undefined> => {
    // Create the images directory if it doesn't exist
    const imagesDir = join(__dirname, '../images');
    if (!existsSync(imagesDir)) {
        DeskThing.sendLog('Creating images directory');
        mkdirSync(imagesDir, { recursive: true });
    }

    // Generate file path (assuming png as default)
    const filePath = join(imagesDir, `${fileName}.png`);

    // Write the file and return a promise
    return new Promise((resolve, reject) => {
        writeFile(filePath, binaryData, 'binary', (err) => {
            if (err) {
                DeskThing.sendError(`Failed to save binary image: ${err.message}`);
                reject(err);
                return;
            }
            DeskThing.sendLog(`Successfully saved binary image: ${fileName}.png`);
            resolve(`/resource/image/soundcloud/${fileName}.png`);
        });
    });
}

export async function deleteImages() {
    const imagesDir = join(__dirname, '../images')

    if (existsSync(imagesDir)) {
        const files = readdirSync(imagesDir)
        for (const file of files) {
            unlinkSync(join(imagesDir, file))
        }
    }
}