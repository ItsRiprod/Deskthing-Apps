import { DeskThing } from "@deskthing/client"
import { useSongStore } from "@src/stores/songStore"
import { useMemo } from "react"

export const BgAlbumArtWidget = () => {
  const songThumbnail = useSongStore((state) => state.songData?.thumbnail)  
  
  const thumbnail = useMemo(() => {
    if (!songThumbnail) return null;
    return DeskThing.useProxy(songThumbnail)
  }, [songThumbnail])

  console.log(thumbnail)

  return (
    <div className="w-screen absolute h-screen blur-sm">
      {thumbnail && <img src={thumbnail} alt="Album Art" className="opacity-75 object-cover w-full h-full" />}
    </div>
  )
}