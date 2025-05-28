
export const getEncodedImage = async (url: string): Promise<string | undefined> => {
    if (process.env.DESKTHING_ENV == 'development') {
        return url
    } else {
        // const encodedUrl = await DeskThing.saveImageReferenceFromURL(url)
        // return encodedUrl || undefined

        // v0.11.0 patch 9 means we can avoid any encoding of images 
        return url
    }
}
