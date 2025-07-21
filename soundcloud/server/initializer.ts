import { DeskThing } from "@deskthing/server"
import { AUDIO_REQUESTS, MusicEventPayloads, SongEvent } from "@deskthing/types"
import { MediaStore } from "./mediaStore"

export const initializeListeners = async () => {
  const mediaStore = MediaStore.getInstance()
  await mediaStore.initializeListeners()
}

DeskThing.on(SongEvent.GET, (data) => {
  const mediaStore = MediaStore.getInstance()
  switch (data.request) {
    case AUDIO_REQUESTS.SONG:
      mediaStore.handleGetSong()
      break
    case AUDIO_REQUESTS.REFRESH:
      mediaStore.handleRefresh()
      break
  }
})

DeskThing.on(SongEvent.SET, (data) => {
  const mediaStore = MediaStore.getInstance()
  switch (data.request) {
    case AUDIO_REQUESTS.FAST_FORWARD:
      mediaStore.handleFastForward({ amount: data.payload})
      break
    case AUDIO_REQUESTS.LIKE:
      mediaStore.handleLike()
      break
    case AUDIO_REQUESTS.NEXT:
      mediaStore.handleNext()
      break
    case AUDIO_REQUESTS.PAUSE:
      mediaStore.handlePause()
      break
    case AUDIO_REQUESTS.PLAY:
      mediaStore.handlePlay()
      break
    case AUDIO_REQUESTS.PREVIOUS:
      mediaStore.handlePrevious()
      break
    case AUDIO_REQUESTS.REPEAT:
      mediaStore.handleRepeat()
      break
    case AUDIO_REQUESTS.REWIND:
      mediaStore.handleRewind({ amount: data.payload })
      break
    case AUDIO_REQUESTS.SEEK:
      mediaStore.handleSeek({ positionMs: data.payload })
      break
    case AUDIO_REQUESTS.SHUFFLE:
      mediaStore.handleShuffle({ shuffle: data.payload })
      break
    case AUDIO_REQUESTS.STOP:
      mediaStore.handleStop()
      break
    case AUDIO_REQUESTS.VOLUME:
      mediaStore.handleVolume({ volume: data.payload })
      break
  }
})