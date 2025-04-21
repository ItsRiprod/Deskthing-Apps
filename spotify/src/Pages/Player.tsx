import React from 'react';
import Loading from './Loading';
import { ScrollingText } from '../components/ScrollingText';
import { useMusic } from '../hooks/useMusic'
import { useUI } from '../hooks/useUI'

const Player: React.FC = () => {
  const { currentSong, backgroundColor } = useMusic()
  const { panel } = useUI();

  if (!currentSong) {
    return <div className="h-screen w-screen">
      <Loading text="Waiting for a song to be played..." />
    </div>
  }

  return (
    <div className="w-screen h-screen font-geist text-white flex"
    style={{background: `linear-gradient(315deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 100%), ${backgroundColor}`}}>
      
      <div className={`absolute ${panel != null ? 'animate-slide-out-left' : 'animate-slide-in-left'} transition-all h-full w-[41%] flex items-center justify-end`}>
        <div className="aspect-square h-[36vw] max-h-full p-4">
          {currentSong.thumbnail && (
            <img className="rounded-lg drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]" src={currentSong.thumbnail} alt={`${currentSong.album} cover`} />
          )}
        </div>
      </div>

      <div className={`pr-8 font-geist absolute ${panel === 'right' ? 'right-[30%]' : panel === 'left' ? 'right-0 pl-20' : 'right-0'} 
        transition-all w-3/5 h-full flex justify-center flex-col`}>
        <div className="pl-5 h-[35vw] flex flex-col justify-center relative">
          <p className="text-[2vw] font-mono opacity-80">
            {currentSong.album}
            </p>
          <h1 className="text-[4.5vw] font-bold">
            <ScrollingText text={currentSong.track_name} fadeWidth={24} />
            </h1>
          <h1 className="text-[2.5vw]">
            {currentSong.artist}
            </h1>

        </div>
      </div>
    </div>
  );
};

export default Player;