import { existsSync, mkdirSync, writeFile, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

export function saveBase64AsPng(base64Image: string, fileName: string): Promise<string> {
    return new Promise((resolve, reject) => {
        // Remove the data:image/png;base64 prefix if it exists
        const base64Data = base64Image.replace(/^data:image\/png;base64,/, '');

        // Create the images directory if it doesn't exist
        const imagesDir = join(__dirname, '../images');
        if (!existsSync(imagesDir)) {
            mkdirSync(imagesDir, { recursive: true });
        }

        // Generate file path
        const filePath = join(imagesDir, `${fileName}.png`);

        // Skip if file already exists
        if (existsSync(filePath)) {
            resolve(`/resource/image/audio/${fileName}.png`);
            return;
        }

        // Write the file
        writeFile(filePath, base64Data, 'base64', (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(`/resource/image/audio/${fileName}.png`);
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