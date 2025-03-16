import React, { useState } from 'react';
import Loading from './Loading';
import { ScrollingText } from '../components/ScrollingText';
import { useMusic } from '../hooks/useMusic'
import { useUI } from '../hooks/useUI'

const Player: React.FC = () => {
  const { currentSong, backgroundColor } = useMusic()
  const { panel } = useUI();

  if (!currentSong) {
    return <Loading />
  }

  return (
    <div className="w-screen h-screen font-geist text-white font-semibold flex"
    style={{backgroundColor: backgroundColor}}>
      
      <div className={`absolute ${panel != null ? 'animate-slide-out-left' : 'animate-slide-in-left'} transition-all h-full w-1/2 flex items-center justify-end`}>
        <div className="w-[35vw] h-[35vw]">
          {currentSong.thumbnail && (
            <img src={currentSong.thumbnail} alt={`${currentSong.album} cover`} />
          )}
        </div>
      </div>

      <div className={`font-geist absolute ${panel === 'right' ? 'right-1/2' : panel === 'left' ? '-right-0 pl-20' : 'right-0'} transition-all w-1/2 h-full flex justify-center flex-col`}>
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
    </div>
  );
};

export default Player;