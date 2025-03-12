import React, { useEffect, useState } from 'react';
import { MusicStore } from '../Stores/musicStore';
import { SongData } from '@deskthing/types';
import Loading from './Loading';
import Playlists from './Playlists';
import { ScrollingText } from '../components/ScrollingText';
import { DeskThing } from '@deskthing/client';

const Player: React.FC = () => {
  const musicStore = MusicStore.getInstance()
  const [currentSong, setCurrentSong] = useState<SongData | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<string>('');
  const [visibleComponent, setVisibleComponent] = useState<'stats' | 'playlist' | null>(null);

  useEffect(() => {
    const updateSong = async (song?: SongData, backgroundColor?: string) => {
      if (song && backgroundColor) {
        setCurrentSong(song);
        setBackgroundColor(song.color ? song.color.rgb : '');
      }
    };

    // Subscribe to song updates
    const unsubscribe = musicStore.on('music', (a, b) => updateSong(a as SongData, b as string));
    
    // Set the current song on component mount
    const song = musicStore.getSong();
    if (song) {
      setCurrentSong(song);
    } else {
      musicStore.fetchInitialSong();
    }

    // Cleanup the listener on component unmount
    return () => {
      unsubscribe();
    };
  }, []);

  if (!currentSong || Object.keys(currentSong).length == 0) {
    return <div className="w-screen h-screen"><Loading text={'Loading Song...'} /></div>;
  }

  const toggleVisibleComponent = (component: 'stats' | 'playlist') => {
    setVisibleComponent(prevComponent => prevComponent === component ? null : component);
  };

  return (
    <div className="w-screen h-screen font-geist text-white font-semibold flex"
    style={{backgroundColor: backgroundColor}}>
      
      <div className={`absolute ${visibleComponent ? '-left-1/2' : 'left-0'} transition-all h-full w-1/2 flex items-center justify-end`}>
        <div className="w-[35vw] h-[35vw]">
          {currentSong.thumbnail && (
            <img src={currentSong.thumbnail} alt={`${currentSong.album} cover`} />
          )}
        </div>
      </div>

      <div className={`font-geist absolute ${visibleComponent === 'playlist' ? 'right-1/2' : visibleComponent === 'stats' ? '-right-0 pl-20' : 'right-0'} transition-all w-1/2 h-full flex justify-center flex-col`}>
        <div className="pl-5 h-[35vw] flex flex-col justify-center relative">
          <p className="top-0 absolute">
            {currentSong.album}
            </p>
          <h1 className="text-4xl">
            <ScrollingText text={currentSong.track_name} fadeWidth={24} />
            </h1>
          <h1 className="">
            {currentSong.artist}
            </h1>

        </div>
      </div>
      <Playlists visible={visibleComponent === 'playlist'} setVisible={() => toggleVisibleComponent('playlist')} />
    </div>
  );
};

export default Player;