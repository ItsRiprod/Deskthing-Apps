import { PlaylistComponent } from "@src/components/PlaylistComponent";
import Button from "@src/components/Button";
import { RefreshCw } from "lucide-react";
import { usePlaylistStore } from "@src/stores/playlistStore";

export const Playlists = () => {
  const fetchPlaylists = usePlaylistStore(state => state.fetchPlaylists);
  const playlists = usePlaylistStore(state => state.playlists);

  const handleRefreshPlaylist = () => {
    fetchPlaylists();
  };

  return (
    <div className="h-full max-h-full overflow-y-scroll flex flex-col w-full p-4 pt-0">
      <div className="w-full mb-4 rounded-xl">
        {playlists.items.map((playlist, index) => (
          <div key={index} className="max-w-full w-full overflow-y-hidden mb-2">
            <PlaylistComponent playlist={playlist} />
          </div>
        ))}
      </div>
      <div className="flex justify-start">
        <Button
          onClick={handleRefreshPlaylist}
          className="p-2 rounded-xl text-neutral-300 items-center bg-neutral-900"
        >
          <p className="mr-2">Refresh</p>
          <RefreshCw />
        </Button>
      </div>
    </div>
  );
};