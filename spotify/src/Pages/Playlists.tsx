import React, { useEffect, useState } from 'react';
import { IconArrowRight } from '../assets/icons';
import { Playlist } from '../types/spotify';
import { MusicStore } from '../Stores/musicStore';
import PlaylistItem from '../components/PlaylistItem';

interface PlaylistsProps {
  visible: boolean;
  setVisible: () => void;
}

const Playlists: React.FC<PlaylistsProps> = ({ visible, setVisible }) => {
  const musicStore = MusicStore.getInstance()
  const [playlists, setPlaylists] = useState<Playlist[]>(musicStore.getPlaylists())

  useEffect(() => {
    const handlePlaylists = async (data: Playlist[]) => {
      if (data.length > 0) {
        setPlaylists(data);
        console.log('Received playlists:', playlists);
      }
    };

    const unsubscribe = musicStore.on('playlists', (a) => handlePlaylists(a as Playlist[]));

    return () => {
      unsubscribe()
    };
  }, []);

  return (
    <div
    className={`fixed w-1/2 h-screen flex flex-col justify-center items-center bg-gray-800 transition-all duration-300 ease-in-out ${
        visible ? 'right-0' : '-right-2/4'
    }`}>


      <div className="w-full max-h-screen h-full overflow-y-scroll p-5">
      {playlists && playlists.map((playlist, index) => (
        <div key={index} className="w-full mb-5">
          <PlaylistItem playlist={playlist} index={index} />
        </div>
      ))}
      
      </div>
    <div className={`absolute ${visible ? '-left-1/3 opacity-100' : '-left-0 opacity-0'} transition-all duration-500 ease-in-out`}>
                  <IconArrowRight iconSize={124} />
    </div>
    <button
        className={`fixed flex justify-end items-center right-0 ${visible ? 'w-1/2 right-1/2' : 'right-0 w-1/3'} transition-all duration-300 h-full z-10 text-black`}
        onClick={() => setVisible()}>
    </button>
    </div>
  );
}
export default Playlists;
