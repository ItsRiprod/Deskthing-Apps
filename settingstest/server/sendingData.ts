import { DeskThing } from '@deskthing/server'

export const sendSampleData = (data?: string) => {
    DeskThing.send({ type: 'sampleData', payload: data || 'sampleData' })
}