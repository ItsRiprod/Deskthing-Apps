import React, { useState, useEffect, useRef } from "react";
import { Playlist } from "../types/spotify";
import { IconArrowRight, IconPlay, IconPlaylistAdd, IconPlus } from "../assets/icons";
import musicStore from "../Stores/musicStore";
interface PlaylistProps {
  playlist: Playlist;
  index: number;
}

type CurrentSetting = 'play' | 'add' | 'set' ;

const PlaylistItem: React.FC<PlaylistProps> = ({ playlist, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [currentSetting, setCurrentSetting] = useState<CurrentSetting>('play');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    // Clear the existing timer if it exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsHovered(true);
    // Set a new timer and store its ID in the ref
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 2000);
  };

  useEffect(() => {
    // Cleanup on component unmount to clear the timer if it exists
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const cycleSetting = () => {
    resetTimer();
    switch (currentSetting) {
      case 'play':
        setCurrentSetting('add');
        break;
      case 'add':
        setCurrentSetting('set');
        break;
      case 'set':
        setCurrentSetting('play');
        break;
    }
  }

  const getOption = () => {
    switch (currentSetting) {
      case 'play':
        return <Play index={index} resetTimer={resetTimer} />;
      case 'add':
        return <Add index={index} resetTimer={resetTimer} />;
      case 'set':
        return <Set index={index} resetTimer={resetTimer} />;
    }
  }

  const playlistStyle = {
    backgroundImage: `url(${playlist.thumbnail_url})`
  }

  const borderStyle = {
    borderColor: `#${playlist.color}`
  }

  if (playlist.id === "-1") {
      return (
          <div className={`w-full relative h-44 rounded-2xl flex overflow-hidden border-slate-500 border`}
              onClick={resetTimer}>
              <div className="w-full bg-slate-500"></div>
              <div className="p-1 w-full">
                <h2>{playlist.title}</h2>
                <h2>{playlist.owner}</h2>
                <h2>Tracks: {playlist.tracks}</h2>
              </div>
              {isHovered && (
                  <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-around items-center">
                      {getOption()}
                      <button className="flex items-center justify-center"
                      onClick={cycleSetting}>
                        <IconArrowRight iconSize={96} />
                      </button>
                  </div>
              )}
          </div>
      )
  }

  return (
    <div className={`w-full relative h-44 rounded-2xl flex overflow-hidden  border`}
        onClick={resetTimer}
        style={borderStyle}>
        <div className={`w-full bg-cover bg-center bg-no-repeat`} style={playlistStyle}></div>
        <div className="p-1 w-full">
          <h2>{playlist.title}</h2>
          <h2>{playlist.owner}</h2>
          <h2>Tracks: {playlist.tracks}</h2>
        </div>
        {isHovered && (
            <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-around items-center">
                {getOption()}
                <button className="flex items-center justify-center"
                onClick={cycleSetting}>
                  <IconArrowRight iconSize={96} />
                </button>
            </div>
        )}
    </div>
);
};

export default PlaylistItem;

interface ActionProps {
  resetTimer: () => void;
  index: number;
}

const Play: React.FC<ActionProps> = ({ resetTimer, index }) => {
  
  const handleClick = () => {
    resetTimer()
    musicStore.playPlaylist(index + 1);
  }

  return (
    <button className="relative" onClick={handleClick}>
      <IconPlay iconSize={96} />
      <p className="absolute">Play Playlist</p>
    </button>
  )
}

const Set: React.FC<ActionProps> = ({ resetTimer, index }) => {

  const handleClick = () => {
    resetTimer()
    musicStore.setPlaylist(index + 1);
  }

  return (
    <button className="relative" onClick={handleClick}>
      <IconPlus iconSize={96} />
      <p className="absolute">Set Playlist</p>
    </button>
  )
}

const Add: React.FC<ActionProps> = ({ resetTimer, index }) => {

  const handleClick = () => {
    resetTimer()
    musicStore.addToPlaylist(index + 1);
  }

  return (
    <button className="relative" onClick={handleClick}>
      <IconPlaylistAdd iconSize={96} />
      <p className="absolute">Add Song</p>
    </button>
  )
}