import { DeskThing } from '@deskthing/server';
import { existsSync, mkdirSync, writeFile, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const IMAGES_DIR = join(__dirname, '../images');
const PUBLIC_BASE = '/resource/image/cacp/';

function ensureImagesDir() {
  if (!existsSync(IMAGES_DIR)) {
    DeskThing.sendLog('Creating images directory for CACP');
    mkdirSync(IMAGES_DIR, { recursive: true });
  }
}

export async function saveBinaryImage(binary: Buffer, fileNameNoExt: string, ext = 'png'): Promise<string> {
  ensureImagesDir();
  const filePath = join(IMAGES_DIR, `${fileNameNoExt}.${ext}`);
  await new Promise<void>((resolve, reject) => {
    writeFile(filePath, binary, (err) => {
      if (err) {
        DeskThing.sendError(`Failed to save image: ${err.message}`);
        reject(err);
        return;
      }
      resolve();
    });
  });
  return `${PUBLIC_BASE}${fileNameNoExt}.${ext}`;
}

export async function saveRemoteImage(url: string, fileNameHint: string): Promise<string | undefined> {
  try {
    ensureImagesDir();
    const res = await fetch(url);
    if (!res.ok) {
      DeskThing.sendWarning(`Image fetch failed: ${url} (${res.status})`);
      return undefined;
    }
    const contentType = res.headers.get('content-type') || '';
    const ext = contentType.includes('jpeg') ? 'jpg' : contentType.includes('png') ? 'png' : 'png';
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const safeName = fileNameHint.replace(/[^a-z0-9_-]/gi, '_').slice(0, 80) || 'artwork';
    return await saveBinaryImage(buffer, safeName, ext);
  } catch (err: any) {
    DeskThing.sendWarning(`saveRemoteImage error: ${err?.message || err}`);
    return undefined;
  }
}

export function deleteImages() {
  ensureImagesDir();
  const files = readdirSync(IMAGES_DIR);
  for (const file of files) {
    try { unlinkSync(join(IMAGES_DIR, file)); } catch {}
  }
}


