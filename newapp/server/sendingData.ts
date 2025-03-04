import { DeskThing } from "deskthing-server"

export const sendSampleData = () => {
    DeskThing.send({ type: 'sampleData', payload: 'sampleData' })
}

export const sendImage = async () => {
    const settings = await DeskThing.getSettings()

    if (settings &&  settings.image.type == 'string' && settings.image.value) {
        const imageUrl = await DeskThing.saveImageReferenceFromURL(settings.image.value)
        DeskThing.send({ type: 'image', payload: imageUrl || '' })
    }
}