
import React, { useEffect, useState } from 'react';
import { useControls } from '../hooks/useControls';
import { Pause, Play } from 'lucide-react';
import IconFastForward from '@src/assets/icons/IconFastForward';
import IconRewind from '@src/assets/icons/IconRewind';

export const Controls: React.FC<{ isPlaying: boolean, isLight: boolean }> = ({ isPlaying, isLight }) => {
    const { pausePlayback, resumePlayback, nextTrack, previousTrack } = useControls();

    const [playing, setIsPlaying] = useState(isPlaying);

    useEffect(() => {
        setIsPlaying(isPlaying);
    }, [isPlaying]);

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
        <div className="flex items-center justify-center"
            onClick={stopPropagation}
            onTouchStart={stopPropagation}>
            <button
                onClick={previousTrack}
                className={`${isLight ? 'text-black hover:text-gray-700' : 'text-white hover:text-gray-300'} transition-colors`}
                aria-label="Previous track"
            >
                <IconRewind iconSize={58} />
            </button>

            <button
                onClick={handleTogglePlayback}
                className={`${isLight ? 'text-black hover:text-gray-700' : 'text-white hover:text-gray-300'} mx-5 transition-colors`}
                aria-label={playing ? "Pause" : "Play"}
            >
                {playing ? (
                    <Pause fill="currentColor" strokeWidth={2} size={64} />
                ) : (
                    <Play fill="currentColor" strokeWidth={2} size={64} />
                )}
            </button>

            <button
                onClick={nextTrack}
                className={`${isLight ? 'text-black hover:text-gray-700' : 'text-white hover:text-gray-300'} transition-colors`}
                aria-label="Next track"
            >
                <IconFastForward iconSize={58} />
            </button>
        </div>
    );
};