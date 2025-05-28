import { randomUUID } from "node:crypto"
import { existsSync } from "node:fs"
import { copyFile, mkdir } from "node:fs/promises"
import { join } from "node:path"

const IMAGE_PATH = process.env.DESKTHING_ENV == 'development' ? '' : join(__dirname, '../images')

export const saveImageReferenceFromURL = async (url: string): Promise<string | undefined> => {
    try {
        if (url.startsWith('https')) {
            return url
        }
        return await handleFile(url)
    } catch (error) {
        console.error('Error saving image reference: ', error)
        return
    }
}

const ensureFileExists = () => {
    if (!existsSync(IMAGE_PATH)) {
        console.debug('Creating images directory');
        mkdir(IMAGE_PATH, { recursive: true });
    }
}

const handleFile = async (filePath: string): Promise<string> => {
    ensureFileExists()

    if (!existsSync(filePath)) {
        console.error(`Unable to find image path at ${filePath}`)
        return ''
    }

    const fileExtension = filePath.split('.').pop()?.toLowerCase()
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff']

    if (!fileExtension || !imageExtensions.includes(fileExtension)) {
        console.error(`File is not a supported image format: ${fileExtension}. Only supports ${imageExtensions.join(', ')}`)
        return ''
    }

    const originalName = filePath.split(/[\\/]/).pop() || ''
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const uniqueName = `${sanitizedName}`

    const destinationPath = join(IMAGE_PATH, uniqueName)
    await copyFile(filePath, destinationPath)

    return `http://localhost:8891/resource/image/image/${uniqueName}`
}