import { PlaylistComponent } from "@src/components/PlaylistComponent";
import { usePlaylists } from "../../hooks/usePlaylists";
import Button from "@src/components/Button";
import { RefreshCw } from "lucide-react";

export const Playlists = () => {
  const { playlists, fetchPlaylists } = usePlaylists();

  const handleRefreshPlaylist = () => {
    fetchPlaylists();
  };

  return (
    <div className="h-full overflow-y-scroll flex flex-col w-full p-4 pt-0">
      <div className="w-full mb-4 rounded-xl">
        {playlists.map((playlist, index) => (
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