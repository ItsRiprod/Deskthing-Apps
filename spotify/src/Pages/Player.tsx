import React from 'react';
import Loading from './Loading';
import { useMusic } from '../hooks/useMusic'
import { useUI } from '../hooks/useUI'
import { TextComponent } from '@src/components/TextComponent';
import { ClockComponent } from '@src/components/ClockComponent';
import { BackgroundComponent } from '@src/components/BackgroundComponent';
import { ThumbnailComponent } from '@src/components/ThumbnailComponent';
import { PanelManager } from '@src/panels/PanelManager';
import { CONTROL_OPTIONS, DISPLAY_ITEMS } from '@shared/spotifyTypes';
import { Controls } from '@src/components/Controls';

const Player: React.FC = () => {
  const { currentSong } = useMusic()
  const { panel, displayItems, controlOptions } = useUI();

  if (!currentSong) {
    return <div className="h-screen w-screen">
      <Loading text="Waiting for a song to be played..." />
    </div>
  }

  const thumbnailVisible = displayItems.includes(DISPLAY_ITEMS.THUMBNAIL) || (displayItems.includes(DISPLAY_ITEMS.CONTROLS) && controlOptions == CONTROL_OPTIONS.THUMBNAIL)

  return (
    <BackgroundComponent>
      {thumbnailVisible && (
        <div className={`absolute ${panel != null ? 'animate-slide-out-left' : 'animate-slide-in-left'} transition-all h-full w-[41%] flex items-center justify-end`}>
          <ThumbnailComponent currentSong={currentSong} />
        </div>
      )}

      <div className={`pr-8 font-geist absolute ${panel === 'right' ? 'right-[30%]' : panel === 'left' ? 'right-0 pl-20' : 'right-0'} 
        transition-all ${thumbnailVisible ? 'w-3/5' : 'w-full items-center'} h-full flex justify-center flex-col`}>
        <TextComponent currentSong={currentSong} />
      </div>
      
      {displayItems.includes(DISPLAY_ITEMS.MINI_CLOCK) && (
        <div className="absolute top-3 left-3 flex">
          <ClockComponent currentSong={currentSong} className="text-[24px]" />
        </div>
      )}

      {displayItems.includes(DISPLAY_ITEMS.CONTROLS) && controlOptions == CONTROL_OPTIONS.BOTTOM && (
        <div className={`absolute bottom-8 w-full`}>
          <Controls isPlaying={currentSong?.is_playing} isLight={currentSong?.color?.isLight || false} />
        </div>
      )}

      <PanelManager />

      
      
    </BackgroundComponent>
  );
};

export default Player;