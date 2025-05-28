import React from 'react';
import Loading from './Loading';
import { useMusic } from '../hooks/useMusic'
import { useUI } from '../hooks/useUI'
import { TextComponent } from '@src/components/TextComponent';
import { ClockComponent } from '@src/components/ClockComponent';
import { BackgroundComponent } from '@src/components/BackgroundComponent';
import { ThumbnailComponent } from '@src/components/ThumbnailComponent';
import { Controls } from '@src/components/Controls';
import { PanelManager } from '@src/panels/PanelManager';

const Player: React.FC = () => {
  const { currentSong } = useMusic()
  const { panel, textSetting, thumbnailSize, showControls } = useUI();

  if (!currentSong) {
    return <div className="h-screen w-screen">
      <Loading text="Waiting for a song to be played..." />
    </div>
  }


  return (
    <BackgroundComponent>
      {thumbnailSize != 'hidden' && (
        <div className={`absolute ${panel != null ? 'animate-slide-out-left' : 'animate-slide-in-left'} transition-all h-full w-[41%] flex items-center justify-end`}>
          <ThumbnailComponent currentSong={currentSong} />
        </div>
      )}

      <div className={`pr-8 font-geist absolute ${panel === 'right' ? 'right-[30%]' : panel === 'left' ? 'right-0 pl-20' : 'right-0'} 
        transition-all ${thumbnailSize != 'hidden' ? 'w-3/5' : 'w-full items-center'} h-full flex justify-center flex-col`}>
        {
          textSetting === "clock" ? <ClockComponent currentSong={currentSong} /> : <TextComponent currentSong={currentSong} />
        }
      </div>
      
      <PanelManager />

      {showControls && (
        <div className="absolute bottom-8 w-full flex justify-center">
          <Controls isPlaying={currentSong?.is_playing} isLight={currentSong?.color?.isLight || false} />
        </div>
      )}
      
      
    </BackgroundComponent>
  );
};

export default Player;