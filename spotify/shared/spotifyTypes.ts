import { SongData } from '@deskthing/types'

export interface SpotifySongData extends SongData {
  isLiked: boolean
}

export type playlist = {
  title: string
  owner: string
  tracks: number
  id: string
  uri: string
  color: string
  thumbnail_url: string
}