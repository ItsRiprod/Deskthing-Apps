import { PlaylistComponent } from "@src/components/PlaylistComponent"
import { usePlaylists } from "../../hooks/usePlaylists"
import Button from "@src/components/Button"
import { RefreshCw } from "lucide-react"

export const Playlists = () => {
   const { playlists, fetchPlaylists } = usePlaylists();
 
   const handleRefreshPlaylist = () => {
    fetchPlaylists();
   }

   return (
     <div className="h-full flex flex-col w-full">
        <div className="p-3 flex justify-end">
            <Button onClick={handleRefreshPlaylist} className="p-2 rounded-xl text-zinc-300 items-center bg-neutral-900">
                <p className="mr-2">Refresh</p>
                <RefreshCw />
            </Button>
        </div>
       <div className="overflow-y-scroll w-full h-full">
         {playlists.map((playlist, index) => (
           <div key={index} className="max-w-full w-full overflow-y-hidden mb-4">
             <PlaylistComponent playlist={playlist} />
           </div>
         ))}
       </div>
     </div>
   );
}