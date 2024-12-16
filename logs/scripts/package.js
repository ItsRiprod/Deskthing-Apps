import { createWriteStream } from 'fs';
import { join, resolve } from 'path';
import archiver from 'archiver';
import { readdir } from 'fs/promises';

async function createPackage() {
    const packageName = process.env.npm_package_name;
    const version = process.env.npm_package_version;
    const distPath = resolve('dist');
    const outputFile = join(distPath, `${packageName}-v${version}.zip`);
    
    const output = createWriteStream(outputFile);
    const archive = archiver('zip', {
        zlib: { level: 9 }
    });

    archive.pipe(output);
    
    const files = await readdir(distPath);
    
    for (const file of files) {
        if (file === `${packageName}-v${version}.zip`) continue;
        archive.file(join(distPath, file), { name: file });
    }

    await archive.finalize();
}

createPackage().catch(console.error);