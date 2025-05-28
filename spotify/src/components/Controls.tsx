
import React, { useEffect, useState } from 'react';
import { useControls } from '../hooks/useControls';
import { Pause, Play } from 'lucide-react';
import IconFastForward from '@src/assets/icons/IconFastForward';
import IconRewind from '@src/assets/icons/IconRewind';
import { useUI } from '@src/hooks/useUI';
import { CONTROL_OPTIONS } from '@shared/spotifyTypes';

export const Controls: React.FC<{ isPlaying: boolean, isLight: boolean }> = ({ isPlaying, isLight }) => {
    const { pausePlayback, resumePlayback, nextTrack, previousTrack } = useControls();
    const { controlOptions } = useUI()

    const [playing, setIsPlaying] = useState(isPlaying);

    useEffect(() => {
        setIsPlaying(isPlaying);
    }, [isPlaying]);

    if (controlOptions == CONTROL_OPTIONS.DISABLED) return // early break

    const handleTogglePlayback = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (playing) {
            pausePlayback();
            setIsPlaying(false)
        } else {
            resumePlayback();
            setIsPlaying(true);

        }
    };

    const stopPropagation = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
    };

    return (
        <div className="flex z-10 flex-row max-w-full flex-shrink items-center justify-center"
            onClick={stopPropagation}
            onTouchStart={stopPropagation}>
            <button
                onClick={previousTrack}
                className={`${isLight ? 'text-black hover:text-gray-700' : 'text-white hover:text-gray-300'} flex-shrink transition-colors`}
                aria-label="Previous track"
            >
                <IconRewind className="w-full h-full" iconSize={58} />
            </button>

            <button
                onClick={handleTogglePlayback}
                className={`${isLight ? 'text-black hover:text-gray-700' : 'text-white hover:text-gray-300'} sm:mx-5 transition-colors`}
                aria-label={playing ? "Pause" : "Play"}
            >
                {playing ? (
                    <Pause className="w-full h-full" fill="currentColor" strokeWidth={2} size={64} />
                ) : (
                    <Play className="w-full h-full" fill="currentColor" strokeWidth={2} size={64} />
                )}
            </button>

            <button
                onClick={nextTrack}
                className={`${isLight ? 'text-black hover:text-gray-700' : 'text-white hover:text-gray-300'} transition-colors`}
                aria-label="Next track"
            >
                <IconFastForward className="w-full h-full" iconSize={58} />
            </button>
        </div>
    );
};