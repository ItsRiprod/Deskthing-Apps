import { DeskThing } from "@deskthing/server"

export const getEncodedImage = async (url: string): Promise<string | undefined> => {
    if (process.env.DESKTHING_ENV == 'development') {
        return url
    } else {
        const encodedUrl = await DeskThing.saveImageReferenceFromURL(url)
        return encodedUrl || undefined
    }
}
